import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  Activity as ActivityIcon,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';

// Form validation schema
const artistFormSchema = insertArtistSchema.pick({
  name: true,
  email: true,
  phone: true,
  bio: true,
  genres: true,
  careerStage: true,
  primaryInstrument: true,
  location: true,
  projectType: true
});

// Form state type
type ArtistFormValues = z.infer<typeof artistFormSchema>;

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
                  
                  {/* Grant matching information section */}
                  <div className="pt-5 border-t border-gray-100 dark:border-gray-800 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-primary" />
                      Grant Matching Information
                    </h4>
                    
                    <div className="space-y-3 text-sm">
                      {artist?.careerStage && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Career Stage:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {artist.careerStage ? (artist.careerStage.charAt(0).toUpperCase() + artist.careerStage.slice(1).replace('-', ' ')) : ''}
                          </span>
                        </div>
                      )}
                      
                      {artist?.primaryInstrument && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Primary Role:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {artist.primaryInstrument ? (artist.primaryInstrument.charAt(0).toUpperCase() + artist.primaryInstrument.slice(1)) : ''}
                          </span>
                        </div>
                      )}
                      
                      {artist?.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Location:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {artist.location}
                          </span>
                        </div>
                      )}
                      
                      {artist?.projectType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Project Type:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {artist.projectType ? (artist.projectType.charAt(0).toUpperCase() + artist.projectType.slice(1).replace('-', ' ')) : ''}
                          </span>
                        </div>
                      )}
                      
                      {!artist?.careerStage && !artist?.primaryInstrument && !artist?.location && !artist?.projectType && (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          No grant matching information provided yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardFooter>
          
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
                <ArtistEditForm 
                  artist={artist} 
                  onSubmit={(data) => updateArtistMutation.mutate(data)}
                  isSubmitting={updateArtistMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
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

// Artist Edit Form Component
interface ArtistEditFormProps {
  artist: Artist;
  onSubmit: (data: ArtistFormValues) => void;
  isSubmitting: boolean;
}

function ArtistEditForm({ artist, onSubmit, isSubmitting }: ArtistEditFormProps) {
  // Set up the form with react-hook-form
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: artist.name,
      email: artist.email,
      phone: artist.phone ?? '',
      bio: artist.bio ?? '',
      genres: artist.genres ?? [],
      careerStage: artist.careerStage ?? '',
      primaryInstrument: artist.primaryInstrument ?? '',
      location: artist.location ?? '',
      projectType: artist.projectType ?? '',
    },
  });

  // Manage genres as a comma-separated string for simplicity
  const [genresInput, setGenresInput] = useState(artist.genres?.join(', ') || '');

  // Handle form submission
  function handleSubmit(data: ArtistFormValues) {
    // Convert the comma-separated genres string back to an array
    const genresArray = genresInput.split(',')
      .map(genre => genre.trim())
      .filter(genre => genre !== '');
    
    // Submit the form data with the processed genres
    onSubmit({
      ...data,
      genres: genresArray,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Artist name"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Email address" 
                  type="email"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Phone number" 
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Genres as a comma-separated input for simplicity */}
        <div className="space-y-2">
          <FormLabel>Genres (comma-separated)</FormLabel>
          <Input
            placeholder="e.g. Jazz, Classical, Hip-Hop"
            value={genresInput}
            onChange={(e) => setGenresInput(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter genres separated by commas
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about this artist..."
                  className="min-h-[120px]"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-1 pt-2">
          <h3 className="text-sm font-medium">Grant Matching Information</h3>
          <p className="text-xs text-muted-foreground">
            These details help match the artist with relevant grant opportunities
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="careerStage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Career Stage</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select career stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="emerging">Emerging Artist</SelectItem>
                  <SelectItem value="mid-career">Mid-Career</SelectItem>
                  <SelectItem value="established">Established Artist</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="primaryInstrument"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Instrument or Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="composer">Composer</SelectItem>
                  <SelectItem value="vocalist">Vocalist</SelectItem>
                  <SelectItem value="pianist">Pianist</SelectItem>
                  <SelectItem value="guitarist">Guitarist</SelectItem>
                  <SelectItem value="drummer">Drummer</SelectItem>
                  <SelectItem value="strings">String Instrumentalist</SelectItem>
                  <SelectItem value="woodwind">Woodwind</SelectItem>
                  <SelectItem value="brass">Brass</SelectItem>
                  <SelectItem value="producer">Producer</SelectItem>
                  <SelectItem value="conductor">Conductor</SelectItem>
                  <SelectItem value="dj">DJ</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="multi-instrumentalist">Multi-Instrumentalist</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. New York, USA" 
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Typical Project Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="recording">Recording Project</SelectItem>
                  <SelectItem value="touring">Touring/Performance</SelectItem>
                  <SelectItem value="composition">Composition</SelectItem>
                  <SelectItem value="education">Education/Workshop</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="community">Community Engagement</SelectItem>
                  <SelectItem value="interdisciplinary">Interdisciplinary Arts</SelectItem>
                  <SelectItem value="residency">Artist Residency</SelectItem>
                  <SelectItem value="festival">Festival/Event</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}