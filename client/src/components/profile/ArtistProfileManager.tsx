import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChatbot, GrantProfileType } from '@/context/ChatbotContext';
import { Artist, insertArtistSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Components
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Music, 
  Award,
  Edit,
  MapPin,
  FileType,
  Save,
  Loader2,
  Info,
  Tag,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";

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

type DisplayMode = 'view' | 'edit' | 'create' | 'wizard';

interface ArtistProfileManagerProps {
  defaultArtist?: Artist | null;
  onCreated?: (artist: Artist) => void;
  onUpdated?: (artist: Artist) => void;
  displayMode?: DisplayMode;
  className?: string;
  showAiProfileSync?: boolean;
}

export function ArtistProfileManager({
  defaultArtist = null,
  onCreated,
  onUpdated,
  displayMode = 'view',
  className = "",
  showAiProfileSync = false
}: ArtistProfileManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useChatbot();
  const [mode, setMode] = useState<DisplayMode>(displayMode);
  const [activeTab, setActiveTab] = useState<string>("basic-info");
  const [genresInput, setGenresInput] = useState(defaultArtist?.genres?.join(', ') || '');
  
  // Get artist profiles for the current user
  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ['/api/artists/user'],
    enabled: displayMode === 'view' && !defaultArtist
  });
  
  // If we don't have a defaultArtist but have artists data, use the first one
  const artist = defaultArtist || (Array.isArray(artistsData) && artistsData.length > 0 ? artistsData[0] : null);
  
  // Format data for display
  const genres = artist?.genres || [];
  const formattedCareerStage = artist?.careerStage 
    ? artist.careerStage.charAt(0).toUpperCase() + artist.careerStage.slice(1).replace('-', ' ')
    : null;
  const formattedInstrument = artist?.primaryInstrument 
    ? artist.primaryInstrument.charAt(0).toUpperCase() + artist.primaryInstrument.slice(1)
    : null;
  const formattedProjectType = artist?.projectType 
    ? artist.projectType.charAt(0).toUpperCase() + artist.projectType.slice(1).replace('-', ' ')
    : null;

  // Set up the form with react-hook-form
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: artist?.name || '',
      email: artist?.email || '',
      phone: artist?.phone ?? '',
      bio: artist?.bio ?? '',
      genres: artist?.genres || [],
      careerStage: artist?.careerStage ?? '',
      primaryInstrument: artist?.primaryInstrument ?? '',
      location: artist?.location ?? '',
      projectType: artist?.projectType ?? '',
    },
  });

  // Update form when artist changes
  useEffect(() => {
    if (artist) {
      form.reset({
        name: artist.name,
        email: artist.email,
        phone: artist.phone ?? '',
        bio: artist.bio ?? '',
        genres: artist.genres || [],
        careerStage: artist.careerStage ?? '',
        primaryInstrument: artist.primaryInstrument ?? '',
        location: artist.location ?? '',
        projectType: artist.projectType ?? '',
      });
      setGenresInput(artist.genres?.join(', ') || '');
    }
  }, [artist, form]);

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/artists", data);
      if (!response.ok) {
        throw new Error("Failed to create artist profile");
      }
      return await response.json();
    },
    onSuccess: (data: Artist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({
        title: "Success!",
        description: "Artist profile created successfully.",
        variant: "success",
      });
      
      if (showAiProfileSync) {
        syncWithAiProfile(data);
      }
      
      if (onCreated) {
        onCreated(data);
      }
      
      setMode('view');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!artist?.id) throw new Error("No artist ID provided");
      
      const response = await apiRequest("PATCH", `/api/artists/${artist.id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update artist profile");
      }
      return await response.json();
    },
    onSuccess: (data: Artist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({
        title: "Success!",
        description: "Artist profile updated successfully.",
        variant: "success",
      });
      
      if (showAiProfileSync) {
        syncWithAiProfile(data);
      }
      
      if (onUpdated) {
        onUpdated(data);
      }
      
      setMode('view');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync artist profile with AI profile context
  const syncWithAiProfile = (artistData: Artist) => {
    const careerStage = artistData.careerStage || '';
    const genre = artistData.genres && artistData.genres.length > 0 ? artistData.genres[0] : '';
    const instrumentOrRole = artistData.primaryInstrument || '';
    
    if (careerStage && genre && instrumentOrRole) {
      setUserProfile({
        careerStage,
        genre,
        instrumentOrRole
      });
      
      toast({
        title: "AI Profile Synced",
        description: "Your artist profile has been synced with AI assistance",
      });
    }
  };

  // Handle form submission
  const handleSubmit = (data: ArtistFormValues) => {
    // Convert the comma-separated genres string back to an array
    const genresArray = genresInput.split(',')
      .map(genre => genre.trim())
      .filter(genre => genre !== '');
    
    const formData = {
      ...data,
      genres: genresArray,
      userId: user?.id || artist?.userId || 0,
    };
    
    if (mode === 'create' || mode === 'wizard') {
      createArtistMutation.mutate(formData);
    } else {
      updateArtistMutation.mutate(formData);
    }
  };

  // Handle editing or creating a new artist
  const handleEdit = () => {
    setMode('edit');
  };

  const handleCreate = () => {
    form.reset({
      name: '',
      email: '',
      phone: '',
      bio: '',
      genres: [],
      careerStage: '',
      primaryInstrument: '',
      location: '',
      projectType: '',
    });
    setGenresInput('');
    setMode('create');
  };

  const handleCancel = () => {
    if (artist) {
      setMode('view');
      form.reset();
    } else {
      // If there's no artist to view, stay in create mode but reset the form
      form.reset();
    }
  };

  // Loading state
  if (artistsLoading && mode === 'view') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Artist Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-full w-24 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  if (mode === 'view') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Artist Profile
          </CardTitle>
          <CardDescription>
            Personal and grant matching information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!artist ? (
            <div className="text-center py-6 space-y-4">
              <User className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium">No Artist Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create an artist profile to improve grant matching
                </p>
              </div>
              <Button onClick={handleCreate}>Create Artist Profile</Button>
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
                  <p className="text-gray-700 dark:text-gray-300">{artist.email}</p>
                </div>
                
                {artist.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700 dark:text-gray-300">{artist.phone}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Joined {artist.createdAt ? format(new Date(artist.createdAt), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Music className="h-4 w-4 mr-1 text-gray-400" />
                    Genres
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {genres.length > 0 ? (
                      genres.map((genre: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {genre}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No genres specified</span>
                    )}
                  </div>
                </div>
                
                {artist.bio && (
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
                    {formattedCareerStage ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Career Stage:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formattedCareerStage}
                        </span>
                      </div>
                    ) : null}
                    
                    {formattedInstrument ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Primary Role:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formattedInstrument}
                        </span>
                      </div>
                    ) : null}
                    
                    {artist.location ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Location:
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {artist.location}
                        </span>
                      </div>
                    ) : null}
                    
                    {formattedProjectType ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          <FileType className="h-3 w-3 inline mr-1" />
                          Project Type:
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formattedProjectType}
                        </span>
                      </div>
                    ) : null}
                    
                    {!formattedCareerStage && !formattedInstrument && !artist.location && !formattedProjectType && (
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
        
        {artist && (
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Wizard mode (tabbed)
  if (mode === 'wizard') {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Create Artist Profile</CardTitle>
          <CardDescription>
            Fill out your artist information to help us find relevant grants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                  <TabsTrigger value="music-details">Music Details</TabsTrigger>
                  <TabsTrigger value="career">Career</TabsTrigger>
                </TabsList>

                <TabsContent value="basic-info" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <User className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Input placeholder="Your full name or stage name" {...field} />
                          </div>
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
                          <div className="flex">
                            <Mail className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Input placeholder="Your contact email" {...field} />
                          </div>
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Phone className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Input placeholder="Your phone number" {...field} />
                          </div>
                        </FormControl>
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
                          <div className="flex">
                            <MapPin className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Input placeholder="Your city and country" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          This helps match you with location-specific grants
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end mt-4">
                    <Button type="button" onClick={() => setActiveTab("music-details")}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="music-details" className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Musical Genres (comma-separated)</FormLabel>
                    <div className="flex">
                      <Music className="mr-2 h-4 w-4 opacity-70 mt-3" />
                      <Input
                        placeholder="e.g. Jazz, Classical, Hip-Hop"
                        value={genresInput}
                        onChange={(e) => setGenresInput(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter genres separated by commas
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="primaryInstrument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Instrument or Role</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Tag className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your primary instrument or role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Vocals">Vocals</SelectItem>
                                <SelectItem value="Guitar">Guitar</SelectItem>
                                <SelectItem value="Piano">Piano</SelectItem>
                                <SelectItem value="Violin">Violin</SelectItem>
                                <SelectItem value="Drums">Drums</SelectItem>
                                <SelectItem value="Bass">Bass</SelectItem>
                                <SelectItem value="Saxophone">Saxophone</SelectItem>
                                <SelectItem value="Trumpet">Trumpet</SelectItem>
                                <SelectItem value="Producer">Producer</SelectItem>
                                <SelectItem value="Composer">Composer</SelectItem>
                                <SelectItem value="DJ">DJ</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                        <FormLabel>Project Type</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Briefcase className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your project type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Album Recording">Album Recording</SelectItem>
                                <SelectItem value="Live Performance">Live Performance</SelectItem>
                                <SelectItem value="Tour">Tour</SelectItem>
                                <SelectItem value="Music Video">Music Video</SelectItem>
                                <SelectItem value="Composition">Composition</SelectItem>
                                <SelectItem value="Workshop">Workshop</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Community Project">Community Project</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic-info")}
                    >
                      Previous
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("career")}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="career" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="careerStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Career Stage</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Calendar className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your career stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Emerging">Emerging (1-3 years)</SelectItem>
                                <SelectItem value="Mid-Career">Mid-Career (4-10 years)</SelectItem>
                                <SelectItem value="Established">Established (10+ years)</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Bio</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Info className="mr-2 h-4 w-4 opacity-70 mt-3" />
                            <Textarea
                              placeholder="Share a brief biography highlighting your musical background and accomplishments"
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          This helps us understand your artistic journey and tailor our recommendations
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("music-details")}
                    >
                      Previous
                    </Button>
                    <Button
                      type="submit"
                      disabled={createArtistMutation.isPending}
                    >
                      {createArtistMutation.isPending ? "Creating..." : "Create Profile"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Edit or Create mode (non-wizard)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? 'Edit Artist Profile' : 'Create Artist Profile'}
        </CardTitle>
        <CardDescription>
          {mode === 'edit' 
            ? 'Update your profile information' 
            : 'Complete your artist profile to improve grant matching'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      id="artist-name"
                      className="form-field-highlight"
                      {...field}
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
                      id="artist-email"
                      className="form-field-highlight"
                      {...field}
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
                      {...field}
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
                id="artist-genres"
                className="form-field-highlight"
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
                      className="min-h-[120px] form-field-highlight"
                      id="artist-bio"
                      {...field}
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
                      <SelectTrigger id="artist-careerStage" className="form-field-highlight">
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
                      <SelectTrigger id="artist-primaryInstrument" className="form-field-highlight">
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
                      id="artist-location"
                      className="form-field-highlight"
                      {...field}
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
                      <SelectTrigger id="artist-projectType" className="form-field-highlight">
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
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={createArtistMutation.isPending || updateArtistMutation.isPending}>
                {(createArtistMutation.isPending || updateArtistMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'edit' ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}