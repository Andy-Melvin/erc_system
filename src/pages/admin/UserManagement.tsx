import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { UserPlus, Search, Filter, MoreHorizontal, Key, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  fullName: string;
  gender: string;
  email: string;
  phoneNumber: string;
  familyCategory: string;
  familyName: string;
  role: string;
  roleDescription: string;
  accessCode: string;
  createdAt: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    email: "",
    phoneNumber: "",
    familyCategory: "",
    familyName: "",
    role: "",
    roleDescription: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data.map(user => ({
        id: user.id,
        fullName: user.full_name,
        gender: user.gender || 'Not specified',
        email: user.email,
        phoneNumber: user.phone || 'Not provided',
        familyCategory: user.family_category || 'Not specified',
        familyName: user.family_name || 'Not specified',
        role: user.role,
        roleDescription: user.bio || 'No description',
        accessCode: user.access_code,
        createdAt: new Date(user.created_at).toISOString().split('T')[0],
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Debug function to test authentication
  const testAuth = async () => {
    if (!session?.access_token) {
      console.log('No session token available');
      return;
    }

    console.log('Testing authentication...');
    console.log('Token exists:', !!session.access_token);
    console.log('Token length:', session.access_token.length);
    console.log('Token preview:', session.access_token.substring(0, 50) + '...');

    try {
      // Test basic auth with Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', userData?.user?.id);
      console.log('User error:', userError);

      // Test function call with minimal data
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: 'Test User',
          gender: 'Male',
          email: 'test@example.com',
          role: 'Youth Committee',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      console.log('Function response:', data);
      console.log('Function error:', error);
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  // Alternative function to create user directly through database (fallback)
  const createUserDirectly = async (userData: any) => {
    try {
      // Generate access code
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Create auth user first
      const tempPassword = `temp_${accessCode}_${Date.now()}`;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        }
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create authentication account');
      }

      // Insert user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          full_name: userData.full_name,
          gender: userData.gender,
          email: userData.email,
          phone: userData.phone,
          family_category: userData.family_category,
          family_name: userData.family_name,
          role: userData.role,
          access_code: accessCode,
          bio: userData.bio,
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create user profile');
      }

      return { success: true, access_code: accessCode, user: profileData };
    } catch (error: any) {
      console.error('Direct user creation error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if session exists and has access token
    if (!session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "No valid session found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Session token exists:', !!session.access_token);
    console.log('Token length:', session.access_token.length);
    
    try {
      // First, try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
      } else if (refreshData.session) {
        console.log('Session refreshed successfully');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: formData.fullName,
          gender: formData.gender,
          email: formData.email,
          phone: formData.phoneNumber || undefined,
          family_category: formData.familyCategory || undefined,
          family_name: formData.familyName || undefined,
          role: formData.role,
          bio: formData.roleDescription || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // If it's an auth error, try with refreshed session
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            console.log('Retrying with refreshed session...');
            const { data: retryData, error: retryError } = await supabase.functions.invoke('create-user', {
              body: {
                full_name: formData.fullName,
                gender: formData.gender,
                email: formData.email,
                phone: formData.phoneNumber || undefined,
                family_category: formData.familyCategory || undefined,
                family_name: formData.familyName || undefined,
                role: formData.role,
                bio: formData.roleDescription || undefined,
              },
              headers: {
                Authorization: `Bearer ${refreshData.session.access_token}`,
              }
            });

            if (retryError) {
              throw new Error(retryError.message || 'Failed to create user after session refresh');
            }

            if (!retryData?.success) {
              throw new Error(retryData?.error || 'Failed to create user');
            }

            toast({
              title: "User registered successfully!",
              description: `Access code: ${retryData.access_code}`,
            });

            setFormData({
              fullName: "",
              gender: "",
              email: "",
              phoneNumber: "",
              familyCategory: "",
              familyName: "",
              role: "",
              roleDescription: "",
            });
            
            setIsDialogOpen(false);
            fetchUsers();
            return;
          }
        }
        
        // If Edge Function fails, try direct database approach
        console.log('Edge Function failed, trying direct database approach...');
        
        try {
          const directResult = await createUserDirectly({
            full_name: formData.fullName,
            gender: formData.gender,
            email: formData.email,
            phone: formData.phoneNumber || undefined,
            family_category: formData.familyCategory || undefined,
            family_name: formData.familyName || undefined,
            role: formData.role,
            bio: formData.roleDescription || undefined,
          });

          toast({
            title: "User registered successfully!",
            description: `Access code: ${directResult.access_code}`,
          });

          setFormData({
            fullName: "",
            gender: "",
            email: "",
            phoneNumber: "",
            familyCategory: "",
            familyName: "",
            role: "",
            roleDescription: "",
          });
          
          setIsDialogOpen(false);
          fetchUsers();
          return;
        } catch (directError: any) {
          console.error('Direct creation also failed:', directError);
          throw new Error(`Edge Function failed: ${error.message}. Direct creation also failed: ${directError.message}`);
        }
      }

      if (!data?.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Failed to create user');
      }

      toast({
        title: "User registered successfully!",
        description: `Access code: ${data.access_code}`,
      });

      setFormData({
        fullName: "",
        gender: "",
        email: "",
        phoneNumber: "",
        familyCategory: "",
        familyName: "",
        role: "",
        roleDescription: "",
      });
      
      setIsDialogOpen(false);
      fetchUsers(); // Refresh the users list
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAccessCode = (userId: string) => {
    const newCode = generateAccessCode();
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, accessCode: newCode }
        : user
    ));
    
    toast({
      title: "Access code updated",
      description: `New code: ${newCode}`,
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      gender: user.gender,
      email: user.email,
      phoneNumber: user.phoneNumber,
      familyCategory: user.familyCategory,
      familyName: user.familyName,
      role: user.role,
      roleDescription: user.roleDescription,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "User deleted",
      description: "User has been removed from the system",
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      ));
      
      toast({
        title: "User updated successfully!",
        description: `${formData.fullName} has been updated`,
      });
    }

    setFormData({
      fullName: "",
      gender: "",
      email: "",
      phoneNumber: "",
      familyCategory: "",
      familyName: "",
      role: "",
      roleDescription: "",
    });
    
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterCategory === "all" || user.familyCategory.toLowerCase() === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage church youth and family members</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData({
              fullName: "",
              gender: "",
              email: "",
              phoneNumber: "",
              familyCategory: "",
              familyName: "",
              role: "",
              roleDescription: "",
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Register New User</span>
              <span className="sm:hidden">Add User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl m-4 w-[calc(100vw-2rem)] sm:w-full">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Register New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user information" : "Add a new member to the church youth coordination platform"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingUser ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                    className="rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    required
                    className="rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyCategory">Family Category *</Label>
                  <Select value={formData.familyCategory} onValueChange={(value) => setFormData({...formData, familyCategory: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Joseph Family">Joseph Family</SelectItem>
                      <SelectItem value="Daniel Family">Daniel Family</SelectItem>
                      <SelectItem value="Isaac Family">Isaac Family</SelectItem>
                      <SelectItem value="David Family">David Family</SelectItem>
                      <SelectItem value="Ezra Family">Ezra Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyName">Family Name *</Label>
                  <Input
                    id="familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData({...formData, familyName: e.target.value})}
                    required
                    className="rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Pastor">Pastor</SelectItem>
                      <SelectItem value="Youth Committee">Youth Committee</SelectItem>
                      <SelectItem value="Père">Père</SelectItem>
                      <SelectItem value="Mère">Mère</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDescription">Role Description</Label>
                <Textarea
                  id="roleDescription"
                  value={formData.roleDescription}
                  onChange={(e) => setFormData({...formData, roleDescription: e.target.value})}
                  placeholder="Describe the person's role and responsibilities..."
                  className="rounded-xl bg-white"
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
                  {editingUser ? "Update User" : "Register User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 rounded-xl bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="young">Young</SelectItem>
                  <SelectItem value="mature">Mature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Registered Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage all registered church members and their access codes
            {totalPages > 1 && (
              <span className="ml-2 text-xs">
                • Page {currentPage} of {totalPages} • Showing {currentUsers.length} of {filteredUsers.length} users
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-xl border overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">Family</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[80px] hidden lg:table-cell">Role</TableHead>
                      <TableHead className="min-w-[120px]">Access Code</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium truncate">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.familyName}</TableCell>
                        <TableCell>
                          <Badge variant={user.familyCategory === "Young" ? "default" : "secondary"}>
                            {user.familyCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{user.role}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {user.accessCode}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateAccessCode(user.id)}
                              className="h-6 w-6 p-0"
                              title="Regenerate code"
                            >
                              <Key className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white z-50">
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(user.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg"
                >
                  First
                </Button>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current page
                      const showPage = page === 1 || 
                                     page === totalPages || 
                                     (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                         (page === currentPage + 2 && currentPage < totalPages - 2);
                      
                      if (showEllipsis) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      if (showPage) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}