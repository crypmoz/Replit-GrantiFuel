import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Artist, 
  Application, 
  Grant,
  Activity
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
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Music, 
  FileText, 
  Clock, 
  Edit, 
  Plus,
  Award,
  Star,
  ChevronLeft,
  Activity as ActivityIcon
} from 'lucide-react';
import { format } from 'date-fns';

export default function ArtistDetail() {
  // Get artist ID from URL
  const [, params] = useRoute<{ id: string }>('/artists/:id');
  const artistId = params?.id ? parseInt(params.id) : null;
  
  const { data: artist, isLoading: artistLoading } = useQuery<Artist>({
    queryKey: ['/api/artists', artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const res = await fetch(`/api/artists/${artistId}`);
      if (!res.ok) throw new Error('Failed to fetch artist');
      return res.json();
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
        {/* Artist Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Artist Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {artistLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary-500 dark:text-primary-400" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700 dark:text-gray-300">{artist?.email}</p>
                  </div>
                  
                  {artist?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700 dark:text-gray-300">{artist?.phone}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Joined {artist?.createdAt ? format(new Date(artist.createdAt), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="pt-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Music className="h-4 w-4 mr-1 text-gray-400" />
                      Genres
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {genres.length > 0 ? (
                        genres.map((genre, i) => (
                          <Badge key={i} variant="secondary">
                            {genre}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No genres specified</span>
                      )}
                    </div>
                  </div>
                  
                  {artist?.bio && (
                    <div className="pt-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Biography</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-line">
                        {artist.bio}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
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
                              <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(app.status)}`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2" 
                                  style={{ width: `${app.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-3">
                                {app.progress}%
                              </span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => window.location.href = `/applications/${app.id}`}
                            >
                              View Application
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No applications yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        This artist hasn't started any grant applications
                      </p>
                      <Button onClick={() => window.location.href = `/applications/new?artistId=${artistId}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Application
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
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions and updates related to this artist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div 
                          key={activity.id} 
                          className="flex items-start space-x-3 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <ActivityIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">{activity.action}</span> {activity.entityType.toLowerCase()}
                              {activity.details ? (
                                <span className="text-gray-500 dark:text-gray-400"> - {typeof activity.details === 'object' ? JSON.stringify(activity.details) : String(activity.details)}</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {activity.createdAt && format(new Date(activity.createdAt), 'MMMM d, yyyy, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No activity yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        There's no recent activity for this artist
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