import { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import GrantRecommendationsForm from '@/components/grants/GrantRecommendationsForm';
import GrantRecommendationsList from '@/components/grants/GrantRecommendationsList';
import { ArtistProfile, useGrantRecommendations } from '@/hooks/use-grant-recommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export default function GrantRecommendationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    recommendations,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    profile,
    setProfile,
    fetchRecommendations
  } = useGrantRecommendations();
  
  // Fetch the user's artist profile
  const { 
    data: artistProfile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchArtistProfile
  } = useQuery({
    queryKey: ['/api/artists/by-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/artists/by-user/${user.id}`);
      if (!res.ok) {
        throw new Error('Could not fetch artist profile');
      }
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  const isLoading = isLoadingRecommendations || isLoadingProfile;
  const error = recommendationsError || profileError;
  
  // Track if we've already processed the artist profile
  const [processedInitialProfile, setProcessedInitialProfile] = useState(false);
  
  // Automatically use the artist profile data when available
  useEffect(() => {
    // Only run once when artistProfile is first loaded and not null
    if (artistProfile && typeof artistProfile === 'object' && !processedInitialProfile) {
      setProcessedInitialProfile(true);
      
      // Map artist profile fields to ArtistProfile format
      // Handle both array and string formats for genres
      let genreStr = '';
      if (artistProfile.genres) {
        if (Array.isArray(artistProfile.genres)) {
          genreStr = artistProfile.genres.join(', ');
        } else if (typeof artistProfile.genres === 'string') {
          genreStr = artistProfile.genres;
        }
      }
      
      const careerStage = artistProfile.careerStage || '';
      const instrumentOrRole = artistProfile.primaryInstrument || '';
      
      const artistProfileData: ArtistProfile = {
        genre: genreStr,
        careerStage: typeof careerStage === 'string' ? careerStage : '',
        instrumentOrRole: typeof instrumentOrRole === 'string' ? instrumentOrRole : '',
        location: artistProfile.location || '',
        projectType: artistProfile.projectType || '',
      };
      
      // Update profile data
      setProfile(artistProfileData);
      
      // Only fetch if we have some data
      if (artistProfileData.genre || artistProfileData.careerStage || artistProfileData.instrumentOrRole) {
        // We directly call the API without setting the profile again
        fetch('/api/ai/grant-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(artistProfileData)
        })
        .then(res => res.json())
        .then(data => {
          // Manually update the cache with the recommendations
          queryClient.setQueryData(
            ['/api/ai/grant-recommendations'], 
            data.recommendations
          );
          
          // Save to sessionStorage for the application form
          try {
            sessionStorage.setItem('ai-grant-recommendations', JSON.stringify(data.recommendations));
          } catch (err) {
            console.error('Error saving recommendations to sessionStorage:', err);
          }
        })
        .catch(err => {
          toast({
            title: "Error fetching recommendations",
            description: err.message,
            variant: "destructive"
          });
        });
      } else {
        toast({
          title: "Profile incomplete",
          description: "Your artist profile is missing key information. Please update your profile to get better recommendations.",
          variant: "destructive"
        });
      }
    }
  }, [artistProfile, processedInitialProfile, setProfile, queryClient, toast]);

  const handleFormSubmit = (values: ArtistProfile) => {
    setProfile(values);
    fetchRecommendations(values);
  };

  const handleRetry = () => {
    if (profile) {
      fetchRecommendations(profile);
      toast({
        title: "Refreshing recommendations",
        description: "We're finding the latest grant opportunities for you.",
      });
    }
  };

  // Get user's artist ID for saving profile
  const { 
    data: userArtist,
    isLoading: isLoadingUserArtist
  } = useQuery({
    queryKey: ['/api/artists/by-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/artists/by-user/${user.id}`);
      if (!res.ok) {
        throw new Error('Could not fetch artist profile');
      }
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { mutate: updateArtist, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!userArtist || typeof userArtist !== 'object' || !('id' in userArtist) || !userArtist.id) {
        throw new Error('No artist profile found');
      }
      
      const artistId = String(userArtist.id);
      const response = await fetch(`/api/artists/${artistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update artist profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile saved",
        description: "Your artist profile has been saved successfully.",
      });
      
      // Invalidate the artist profile query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/artists/by-user', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveProfile = () => {
    if (!profile) return;
    
    // Map from recommendation profile format to artist profile format
    updateArtist({
      genres: profile.genre,
      careerStage: profile.careerStage,
      primaryInstrument: profile.instrumentOrRole,
      location: profile.location,
      projectType: profile.projectType,
    });
  };

  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI Grant Recommendations
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Let our AI assistant find perfect grant opportunities for your unique artistic profile. 
            Get personalized recommendations that match your career stage, genre, and artistic focus.
          </p>
        </header>

        <Tabs 
          defaultValue="results" 
          className="space-y-6"
          onValueChange={() => {}} // Prevent unused variable warning
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Your Profile</TabsTrigger>
            <TabsTrigger 
              value="results"
            >
              Recommendations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="max-w-3xl mx-auto">
              {isLoadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading your artist profile...</p>
                </div>
              ) : (
                <>
                  <GrantRecommendationsForm onFormSubmit={handleFormSubmit} defaultValues={profile || undefined} />
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-6">
              {profile && (
                <Card className="bg-muted/30 mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Your Artist Profile</CardTitle>
                    <CardDescription>
                      Recommendations are based on these details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Genre</div>
                        <div className="text-muted-foreground capitalize">{profile.genre}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Career Stage</div>
                        <div className="text-muted-foreground capitalize">{profile.careerStage}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Instrument/Role</div>
                        <div className="text-muted-foreground capitalize">{profile.instrumentOrRole}</div>
                      </div>
                      {profile.location && (
                        <div className="space-y-1">
                          <div className="font-medium">Location</div>
                          <div className="text-muted-foreground">{profile.location}</div>
                        </div>
                      )}
                      {profile.projectType && (
                        <div className="space-y-1">
                          <div className="font-medium">Project Type</div>
                          <div className="text-muted-foreground capitalize">{profile.projectType}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex mt-4 space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs" 
                        asChild
                      >
                        <a href="#profile">Edit Profile</a>
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs" 
                        onClick={handleSaveProfile}
                        disabled={isUpdating || !userArtist}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Save Profile
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs ml-auto" 
                        onClick={handleRetry}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!profile && !recommendations && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No profile submitted</AlertTitle>
                  <AlertDescription>
                    Please create an artist profile first to get grant recommendations.
                  </AlertDescription>
                </Alert>
              )}
              
              <GrantRecommendationsList 
                recommendations={recommendations} 
                isLoading={isLoading} 
                error={error} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}