import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw, UserCheck, UserX, Shield, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Fetch all users
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: false
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User updated',
        description: 'User role or status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update user.',
        variant: 'destructive',
      });
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserMutation.mutate({
      userId,
      data: { role: newRole }
    });
  };

  const handleStatusChange = (userId: number, active: boolean) => {
    updateUserMutation.mutate({
      userId,
      data: { active }
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'grant_writer':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'manager':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'artist':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">{role}</Badge>;
      case 'grant_writer':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{role}</Badge>;
      case 'manager':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{role}</Badge>;
      case 'artist':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">{role}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Error loading users. Please try again.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Management</CardTitle>
          <CardDescription>
            Manage user accounts and permissions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of all registered users in the system.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(user.role)}
                            <span>{user.role}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="grant_writer">grant_writer</SelectItem>
                          <SelectItem value="manager">manager</SelectItem>
                          <SelectItem value="artist">artist</SelectItem>
                          <SelectItem value="user">user</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.active}
                        onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                      />
                      <Label>{user.active ? 'Active' : 'Inactive'}</Label>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {updateUserMutation.isPending && updateUserMutation.variables?.userId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {user.active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, false)}
                              className="h-8 px-2 text-xs"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, true)}
                              className="h-8 px-2 text-xs"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}