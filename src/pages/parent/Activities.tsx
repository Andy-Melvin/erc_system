import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, Users, TrendingUp, Heart, Globe } from "lucide-react";
import { ActivityLogger } from "@/components/parent/ActivityLogger";
import { Badge } from "@/components/ui/badge";

export default function Activities() {
  const activityStats = [
    { label: "This Month", value: 24, change: "+8%", color: "primary" },
    { label: "Spiritual", value: 16, change: "+12%", color: "accent" },
    { label: "Social", value: 8, change: "+4%", color: "success" },
    { label: "Participants", value: 156, change: "+18%", color: "warning" }
  ];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Family Activities</h1>
          <p className="text-muted-foreground">
            Track spiritual and social activities for your family members
          </p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {activityStats.map((stat, index) => (
          <Card key={index} className={`border-0 shadow-lg bg-gradient-to-br from-card to-${stat.color}/5`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Activity className={`h-6 w-6 text-${stat.color}/60`} />
                  <Badge variant="outline" className={`text-success border-success/40 text-xs`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Loggers */}
      <div className="space-y-6">
        {/* Spiritual Activities */}
        <ActivityLogger
          activityTable="spiritual_activities"
          title="Spiritual Activities"
          description="Track prayer, Bible study, worship, and other spiritual activities"
          icon={<Heart className="w-5 h-5 text-spiritual" />}
        />

        {/* Social Activities */}
        <ActivityLogger
          activityTable="social_activities"
          title="Social Activities"
          description="Track community service, family time, sports, and social engagement"
          icon={<Globe className="w-5 h-5 text-social" />}
        />
      </div>

    </div>
  );
}