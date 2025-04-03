import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { 
  Artist, 
  Application, 
  Grant,
  Activity,
  insertArtistSchema
} from '@shared/schema';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Clock, 
  Edit, 
  Plus,
  ChevronLeft,
  Activity as ActivityIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ArtistProfileCard } from '@/components/profile/ArtistProfileCard';
import { ArtistProfileEdit } from '@/components/profile/ArtistProfileEdit';

// Form state type
type ArtistFormValues = Omit<z.infer<typeof insertArtistSchema>, 'userId'>;

// Activity details interface
interface ActivityDetails {
  [key: string]: string | number | boolean | null | object;
}

export default function ArtistDetail() {
  // Get artist ID from URL
  const [, params] = useRoute<{ id: string }>('/artists/:id');
  const artistId = params?.id ? parseInt(params.id) : null;
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  const { data: artist, isLoading: artistLoading } = useQuery<Artist>({
    queryKey: ['/api/artists', artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const res = await fetch(`/api/artists/${artistId}`);
      if (!res.ok) throw new Error('Failed to fetch artist');
      return res.json();
    }
  });
  
  // Edit artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async (data: ArtistFormValues) => {
      const response = await apiRequest('PATCH', `/api/artists/${artistId}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update artist');
      }
      return response.json();
    },
    onSuccess: () => {
      // Close the dialog
      setEditDialogOpen(false);
      // Show success message
      toast({
        title: "Artist updated",
        description: "The artist profile has been updated successfully.",
      });
      // Invalidate cache to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/artists', artistId] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch applications for this artist
  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    select: (data) => data.filter(app => app.artistId === artistId)
  });
  
  // Fetch all grants for reference
  const { data: grants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
  });
  
  // Fetch activities related to this artist
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
    select: (data) => data.filter(
      activity => activity.entityType === 'ARTIST' && activity.entityId === artistId
    ).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt.toString()).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt.toString()).getTime() : 0;
      return dateB - dateA;
    })
  });

  // If artist has no genres, provide a placeholder
  const genres = artist?.genres || [];
  
  // Get grant names for applications
  const getGrantName = (grantId: number) => {
    return grants?.find(g => g.id === grantId)?.name || 'Unknown Grant';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'draft': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'submitted': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };
  
  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Artists
        </Button>
        
        {artistLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              {artist?.name}
              {genres.length > 0 && (
                <Badge variant="outline" className="ml-3">{genres[0]}</Badge>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Artist details and application history
            </p>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Artist Info Card - Using our reusable component */}
        {artist && (
          <ArtistProfileCard 
            artist={artist} 
            isLoading={artistLoading}
            showEditButton={true}
            onEditClick={() => setEditDialogOpen(true)}
            className="lg:col-span-1"
          />
        )}
        
        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Artist Profile</DialogTitle>
              <DialogDescription>
                Update the artist's profile information.
              </DialogDescription>
            </DialogHeader>
            {artist && (
              <ArtistProfileEdit 
                artist={artist} 
                onSubmit={(data) => updateArtistMutation.mutate(data)}
                isSubmitting={updateArtistMutation.isPending}
                onCancel={() => setEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Tabs for Applications and Activities */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="applications" className="space-y-4">
            <TabsList>
              <TabsTrigger value="applications" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>
            
            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Grant Applications</CardTitle>
                    <Button size="sm" onClick={() => window.location.href = `/applications/new?artistId=${artistId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Application
                    </Button>
                  </div>
                  <CardDescription>
                    All applications submitted by this artist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {applications && applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.map(app => (
                        <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {getGrantName(app.grantId)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Started on {app.startedAt ? format(new Date(app.startedAt.toString()), 'MMMM d, yyyy') : 'Unknown date'}
                                </p>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium lowercase ${getStatusColor(app.status)}`}>
                                {app.status}
                              </div>
                            </div>
                          </CardHeader>
                          <CardFooter className="p-4 pt-2 flex justify-between">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {app.startedAt ? format(new Date(app.startedAt.toString()), 'MMM d, yyyy') : 'Unknown'}
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => window.location.href = `/applications/${app.id}`}>
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Applications Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        This artist hasn't started any grant applications
                      </p>
                      <Button onClick={() => window.location.href = `/applications/new?artistId=${artistId}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Application
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <ActivityIcon className="h-5 w-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Actions taken related to this artist profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
                            <ActivityIcon className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.action.toLowerCase()} {activity.entityType.toLowerCase()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.createdAt ? format(new Date(activity.createdAt.toString()), 'MMMM d, yyyy h:mm a') : 'Unknown date'}
                            </p>
                            {activity.details && typeof activity.details === 'object' && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {(() => {
                                  const details = activity.details as ActivityDetails;
                                  return Object.entries(details).map(([key, value]) => {
                                    const displayValue = typeof value === 'object' && value !== null 
                                      ? JSON.stringify(value) 
                                      : String(value);
                                    
                                    return (
                                      <div key={key} className="flex items-start gap-2">
                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span>{displayValue}</span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ActivityIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Activity</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        There is no recorded activity for this artist yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}