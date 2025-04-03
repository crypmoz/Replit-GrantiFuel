import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useToast } from '../hooks/use-toast';
import { Loader2, Save, User, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Artist } from '@shared/schema';
import { ProfileRequirements } from '../components/profile/ProfileRequirements';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user's artist profile if it exists
  const { data: artistProfile, isLoading: artistLoading } = useQuery<Artist | null>({
    queryKey: ['/api/artists/profile'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/artists/by-user/${user.id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch artist profile');
        return res.json();
      } catch (error) {
        console.error('Error fetching artist profile:', error);
        return null;
      }
    },
    enabled: !!user,
  });
  
  // Initialize form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    // Artist-specific fields for grant matching
    genres: [] as string[],
    careerStage: '',
    instrument: '',
    location: '',
    projectType: '',
  });

  if (!user) {
    return null;
  }

  // Initialize form with artist profile data when it loads
  useEffect(() => {
    if (artistProfile) {
      setFormData(prev => ({
        ...prev,
        name: artistProfile.name || user?.name || '',
        email: artistProfile.email || user?.email || '',
        bio: artistProfile.bio || user?.bio || '',
        genres: artistProfile.genres || [],
        // Handle optional properties that may not exist in the type
        careerStage: (artistProfile as any).careerStage || '',
        instrument: (artistProfile as any).primaryInstrument || '',
        location: (artistProfile as any).location || '',
        projectType: (artistProfile as any).projectType || '',
      }));
    }
  }, [artistProfile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenresChange = (value: string) => {
    const genresList = value.split(',').map(genre => genre.trim()).filter(genre => genre !== '');
    setFormData(prev => ({ ...prev, genres: genresList }));
  };

  // Create/update artist profile only
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Skip updating user info as that requires admin permissions
      // Only update or create artist profile
      
      // Check if artist profile exists and create/update accordingly
      if (artistProfile) {
        // Update existing artist profile
        const artistResponse = await apiRequest('PATCH', `/api/artists/${artistProfile.id}`, {
          name: data.name,
          email: data.email,
          bio: data.bio,
          genres: data.genres,
          careerStage: data.careerStage,
          primaryInstrument: data.instrument,
          location: data.location,
          projectType: data.projectType
        });
        
        if (!artistResponse.ok) {
          throw new Error('Failed to update artist profile');
        }
        
        return artistResponse.json();
      } else {
        // Create new artist profile
        const artistResponse = await apiRequest('POST', '/api/artists', {
          userId: user.id,
          name: data.name,
          email: data.email,
          bio: data.bio,
          genres: data.genres,
          careerStage: data.careerStage,
          primaryInstrument: data.instrument,
          location: data.location,
          projectType: data.projectType
        });
        
        if (!artistResponse.ok) {
          throw new Error('Failed to create artist profile');
        }
        
        return artistResponse.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/artists/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  // Format genres array to string for display
  const genresString = formData.genres.join(', ');
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>This is your public profile image</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar || undefined} alt={user.name || user.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Change
            </Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter your full name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  placeholder="Tell us about your background and experience" 
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
            
            <CardHeader className="pt-0">
              <CardTitle>Artist Information</CardTitle>
              <CardDescription>
                These details help us match you with relevant grant opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="genres">Music Genres (comma-separated)</Label>
                <Input 
                  id="genres" 
                  value={genresString} 
                  onChange={(e) => handleGenresChange(e.target.value)} 
                  placeholder="e.g. Jazz, Classical, Hip-Hop" 
                />
                <p className="text-sm text-muted-foreground">
                  Enter the musical genres you work in, separated by commas
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="careerStage">Career Stage</Label>
                <Select 
                  value={formData.careerStage} 
                  onValueChange={(value) => handleSelectChange('careerStage', value)}
                >
                  <SelectTrigger id="careerStage">
                    <SelectValue placeholder="Select your career stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging">Emerging Artist</SelectItem>
                    <SelectItem value="mid-career">Mid-Career</SelectItem>
                    <SelectItem value="established">Established Artist</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instrument">Primary Instrument or Role</Label>
                <Select 
                  value={formData.instrument} 
                  onValueChange={(value) => handleSelectChange('instrument', value)}
                >
                  <SelectTrigger id="instrument">
                    <SelectValue placeholder="Select your primary role" />
                  </SelectTrigger>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. New York, USA" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectType">Typical Project Type</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => handleSelectChange('projectType', value)}
                >
                  <SelectTrigger id="projectType">
                    <SelectValue placeholder="Select your typical project" />
                  </SelectTrigger>
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
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending || isLoading}
                className="w-full"
              >
                {updateProfileMutation.isPending || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Artist Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="col-span-1 md:col-span-3 lg:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="flex-1">
              <CardTitle>Grant Matching Information</CardTitle>
              <CardDescription>
                How your profile information helps you find grants
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/grant-recommendations'}
            >
              <Music className="mr-2 h-4 w-4" />
              Find Grants
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                The information in your profile is used by our AI system to match you with relevant grant opportunities.
                Make sure to fill out your artist information as completely as possible for the best recommendations.
              </p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Music Genres:</strong> Helps match you with genre-specific funding</li>
                <li><strong>Career Stage:</strong> Many grants target specific career stages (emerging, established, etc.)</li>
                <li><strong>Primary Instrument/Role:</strong> Some grants are specific to instrumentalists, composers, etc.</li>
                <li><strong>Location:</strong> Regional grants may only be available in certain areas</li>
                <li><strong>Project Type:</strong> Grants often fund specific types of musical activities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-3 lg:col-span-1">
          <ProfileRequirements 
            completedFields={[
              // Base fields
              ...(formData.name ? ['Full Name'] : []),
              ...(formData.email ? ['Email'] : []),
              ...(formData.bio ? ['Bio'] : []),
              // Grant matching fields
              ...(formData.genres.length > 0 ? ['Music Genres'] : []),
              ...(formData.careerStage ? ['Career Stage'] : []),
              ...(formData.instrument ? ['Primary Instrument'] : []),
              ...(formData.location ? ['Location'] : []),
              ...(formData.projectType ? ['Project Type'] : [])
            ]}
            onFieldClick={(fieldName) => {
              // Scroll to the relevant field
              const fieldMap: Record<string, string> = {
                'Full Name': 'name',
                'Email': 'email',
                'Bio': 'bio',
                'Music Genres': 'genres',
                'Career Stage': 'careerStage',
                'Primary Instrument': 'instrument',
                'Location': 'location',
                'Project Type': 'projectType'
              };
              
              const elementId = fieldMap[fieldName];
              if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Add a brief highlight effect
                  element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
                  }, 2000);
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}