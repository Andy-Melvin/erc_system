import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Activity {
  id: string;
  type: string;
  date: string;
  notes: string | null;
  status: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

interface ActivityLoggerProps {
  activityTable: 'spiritual_activities' | 'social_activities';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ActivityLogger({ activityTable, title, description, icon }: ActivityLoggerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  const [formData, setFormData] = useState({
    type: "",
    date: "",
    notes: "",
    status: "Planned" as Activity['status'],
  });

  // Fetch activities
  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, activityTable]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`${activityTable}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: activityTable,
          filter: `family_id=eq.${user.id}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activityTable]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from(activityTable)
        .select('*')
        .eq('family_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error(`Error fetching ${activityTable}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${title.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const activityData = {
        family_id: user.id,
        type: formData.type,
        date: formData.date,
        notes: formData.notes || null,
        status: formData.status,
      };

      if (editingActivity) {
        const { error } = await supabase
          .from(activityTable)
          .update(activityData)
          .eq('id', editingActivity.id);

        if (error) throw error;

        toast({
          title: "Activity Updated",
          description: `${formData.type} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from(activityTable)
          .insert(activityData);

        if (error) throw error;

        toast({
          title: "Activity Added",
          description: `${formData.type} has been logged successfully.`,
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(`Error saving ${activityTable}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to save ${title.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type,
      date: activity.date,
      notes: activity.notes || "",
      status: activity.status,
    });
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = async (activityId: string, newStatus: Activity['status']) => {
    try {
      const { error } = await supabase
        .from(activityTable)
        .update({ status: newStatus })
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Activity status changed to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error(`Error updating ${activityTable} status:`, error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      date: "",
      notes: "",
      status: "Planned",
    });
    setEditingActivity(null);
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Ongoing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: Activity['status']) => {
    switch (status) {
      case 'Completed':
        return 'default' as const;
      case 'Ongoing':
        return 'secondary' as const;
      case 'Cancelled':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="ml-2 text-muted-foreground">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title} ({activities.length})
            </CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit Activity" : "Log New Activity"}</DialogTitle>
                <DialogDescription>
                  {editingActivity ? "Update activity information" : `Add a new ${title.toLowerCase()} activity`}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Activity Type *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                    placeholder={activityTable === 'spiritual_activities' ? 'e.g., Prayer, Bible Study, Service' : 'e.g., Community Service, Family Time, Sports'}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Activity['status']) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Add any additional notes or details..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl">
                    {editingActivity ? "Update Activity" : "Log Activity"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const statuses: Activity['status'][] = ['Planned', 'Ongoing', 'Completed', 'Cancelled'];
                          const currentIndex = statuses.indexOf(activity.status);
                          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                          handleStatusUpdate(activity.id, nextStatus);
                        }}
                      >
                        {getStatusIcon(activity.status)}
                      </Button>
                      <Badge variant={getStatusVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-muted-foreground max-w-xs truncate">
                      {activity.notes || "No notes"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(activity)}
                      className="rounded-lg"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No activities found. Log your first activity to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}