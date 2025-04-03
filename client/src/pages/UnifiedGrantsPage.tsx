import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageLayout } from '../components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArtistProfile, useGrantRecommendations, GrantRecommendation } from '@/hooks/use-grant-recommendations';
import { apiRequest } from '@/lib/queryClient';
import { Grant, GrantWithAIRecommendation, userRoleEnum } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Calendar, DollarSign, Filter, Plus, ExternalLink, FileText, Search, 
         RefreshCw, AlertCircle, Bookmark, Save, Loader2, UserCheck, User as UserIcon } from 'lucide-react';
import GrantRecommendationsForm from '@/components/grants/GrantRecommendationsForm';

// Enhanced type to represent both database grants and AI-recommended grants
interface GrantRecommendationExtended {
  id?: string | number;
  userId?: number;
  name: string;
  organization: string;
  amount: string;
  deadline?: string | Date;
  description?: string;
  requirements?: string | string[];
  eligibility?: string[];
  matchScore?: number;
  url?: string;
  website?: string;
}

type UnifiedGrant = (Grant | GrantRecommendationExtended | GrantWithAIRecommendation) & {
  aiRecommended?: boolean;
  matchScore?: number;
  url?: string;
  website?: string;
  userId?: number;
};

export default function UnifiedGrantsPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  
  // Artist profile update mutation
  const { mutate: updateArtistProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/artists/${data.id}`, data);
      if (!response.ok) {
        throw new Error('Failed to update artist profile');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch artist profile data
      queryClient.invalidateQueries({ queryKey: ['/api/artists/by-user', user?.id] });
      toast({
        title: 'Profile updated',
        description: 'Your artist profile has been updated in the database.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save profile',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  });
  
  // Artist profile creation mutation
  const { mutate: createArtistProfile, isPending: isCreatingProfile } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/artists`, data);
      if (!response.ok) {
        throw new Error('Failed to create artist profile');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch artist profile data
      queryClient.invalidateQueries({ queryKey: ['/api/artists/by-user', user?.id] });
      toast({
        title: 'Profile created',
        description: 'Your artist profile has been created. You can now get personalized grant recommendations.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create profile',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  });
  
  // State for artist profile and recommendations
  const {
    recommendations: aiRecommendations,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    profile,
    setProfile,
    fetchRecommendations,
    refreshRecommendations,
    isSubmitting: isSubmittingRecommendations
  } = useGrantRecommendations();

  // Get artist profile for recommendations
  const { 
    data: artistProfile,
    isLoading: isLoadingProfile,
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

  // Get all grants from database (both user-created and system grants)
  const { data: grantsData, isLoading: isLoadingGrants, error: grantsError } = useQuery({
    queryKey: ['/api/grants'],
    queryFn: async () => {
      const response = await fetch('/api/grants');
      if (!response.ok) {
        throw new Error('Failed to fetch grants');
      }
      return response.json();
    },
  });
  
  // State to track loading message for recommendations
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  
  // Combine database grants with AI recommendations
  const [combinedGrants, setCombinedGrants] = useState<UnifiedGrant[]>([]);
  
  useEffect(() => {
    let grants: UnifiedGrant[] = [];
    
    // Add database grants if available
    if (grantsData && grantsData.grants && Array.isArray(grantsData.grants)) {
      grants = [...grantsData.grants];
      
      // Check if there's a loading message for AI recommendations
      if (grantsData.generatingRecommendations && grantsData.loadingMessage) {
        setLoadingMessage(grantsData.loadingMessage);
      } else {
        setLoadingMessage(null);
      }
    }
    
    // Add AI recommendations that aren't already in the database
    const recommendationsArray = (aiRecommendations || []) as GrantRecommendationExtended[];
    if (recommendationsArray.length > 0) {
      recommendationsArray.forEach(rec => {
        // Check if this recommendation is already in our list (avoid duplicates)
        const existingIndex = grants.findIndex(g => 
          g.name?.toLowerCase() === rec.name?.toLowerCase() || 
          g.organization?.toLowerCase() === rec.organization?.toLowerCase()
        );
        
        if (existingIndex === -1) {
          // Add new recommendation
          grants.push({
            ...rec,
            aiRecommended: true
          });
        } else if (!grants[existingIndex].aiRecommended) {
          // Update existing grant with AI match score if not already an AI recommendation
          grants[existingIndex] = {
            ...grants[existingIndex],
            matchScore: rec.matchScore,
            aiRecommended: true
          };
        }
      });
    }
    
    setCombinedGrants(grants);
  }, [grantsData, aiRecommendations]);

  // Automatically use the artist profile data when available to fetch recommendations
  const [processedInitialProfile, setProcessedInitialProfile] = useState(false);
  
  useEffect(() => {
    // Define an async function to properly handle potential promise rejections
    const processProfileData = async () => {
      try {
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
            await fetchRecommendations(artistProfileData);
          }
        }
      } catch (error) {
        console.error("Error processing artist profile:", error);
        toast({
          title: "Error loading recommendations",
          description: "We encountered a problem getting your grant recommendations. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Execute the async function
    processProfileData();
  }, [artistProfile, processedInitialProfile, setProfile, fetchRecommendations, toast]);

  // Filter and sort the grants based on user input
  const filteredAndSortedGrants = combinedGrants
    .filter(grant => {
      // First apply tab filtering
      if (activeTab === 'ai-recommended' && !grant.aiRecommended) {
        return false;
      }
      if (activeTab === 'my-grants' && (grant.userId !== user?.id)) {
        return false;
      }
      
      // Apply filter for expired grants if the showExpired flag is false
      if (!showExpired && grant.deadline) {
        const deadlineDate = new Date(grant.deadline);
        // Skip invalid dates
        if (!isNaN(deadlineDate.getTime())) {
          // Reset time portion for more accurate date comparison
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const todayStr = now.toISOString().split('T')[0];
          
          const deadlineWithoutTime = new Date(deadlineDate);
          deadlineWithoutTime.setHours(0, 0, 0, 0);
          const deadlineStr = deadlineWithoutTime.toISOString().split('T')[0];
          
          // Determine if the deadline is in the past using string comparison for consistency
          const isPastDeadline = deadlineStr < todayStr;
          
          if (isPastDeadline) {
            console.log('Filtering out expired grant:', grant.name, 'Deadline:', deadlineStr, 'Today:', todayStr);
            return false;
          }
        }
      }
      
      // Then apply search filtering if there's a search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (grant.name || '').toLowerCase();
        const organization = (grant.organization || '').toLowerCase();
        const description = (grant.description || '').toLowerCase();
        
        return name.includes(query) || 
               organization.includes(query) || 
               description.includes(query);
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on the selected sort option
      switch (sortBy) {
        case 'relevance':
          // AI recommended grants first, then by match score
          if (a.aiRecommended && !b.aiRecommended) return -1;
          if (!a.aiRecommended && b.aiRecommended) return 1;
          
          // If both have match scores, compare them
          if (a.matchScore !== undefined && b.matchScore !== undefined) {
            return b.matchScore - a.matchScore;
          }
          
          // Fall back to name sorting
          return (a.name || '').localeCompare(b.name || '');
          
        case 'deadline':
          // Parse dates and handle non-date values
          const dateA = a.deadline ? new Date(a.deadline) : new Date(9999, 0, 1);
          const dateB = b.deadline ? new Date(b.deadline) : new Date(9999, 0, 1);
          
          // Check if valid dates
          const validDateA = !isNaN(dateA.getTime());
          const validDateB = !isNaN(dateB.getTime());
          
          // Handle invalid dates
          if (validDateA && !validDateB) return -1;
          if (!validDateA && validDateB) return 1;
          if (!validDateA && !validDateB) return 0;
          
          return dateA.getTime() - dateB.getTime();
          
        case 'amount':
          // Parse amount strings to numbers if possible
          const amountA = parseAmount(a.amount || '');
          const amountB = parseAmount(b.amount || '');
          return amountB - amountA;
          
        default:
          return 0;
      }
    });
  
  // Helper function to parse amount strings
  function parseAmount(amountStr: string): number {
    // Remove currency symbols and commas
    const cleaned = amountStr.replace(/[$,]/g, '');
    
    // Extract numbers from the string
    const match = cleaned.match(/(\d+(\.\d+)?)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    
    // If amount has "k" or "K" (thousands)
    if (/\d+(\.\d+)?k/i.test(amountStr)) {
      const match = amountStr.match(/(\d+(\.\d+)?)[kK]/);
      if (match && match[1]) {
        return parseFloat(match[1]) * 1000;
      }
    }
    
    // Return 0 if we can't parse it
    return 0;
  }
  
  // Format deadline for display
  function formatDeadline(deadline: string | Date | undefined): string {
    if (!deadline) return 'No deadline';
    
    try {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) return 'No deadline';
      
      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }
  
  // Handle refreshing AI recommendations with cache clearing
  const handleRefreshRecommendations = async () => {
    if (profile) {
      try {
        toast({
          title: "Refreshing recommendations",
          description: "Finding grant opportunities with future deadlines for you."
        });
        
        // Use the enhanced refresh function that clears both client and server caches
        await refreshRecommendations(profile);
        
        // Force UI refresh with a short delay
        setTimeout(() => {
          console.log('Refreshing UI after cache clear and AI recommendation refresh');
          setCombinedGrants([...combinedGrants]);
        }, 100);
      } catch (error) {
        console.error("Error refreshing recommendations:", error);
        toast({
          title: "Error refreshing recommendations",
          description: "We encountered a problem. Please try again later.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Profile needed",
        description: "Please set up your artist profile first to get recommendations.",
        variant: "destructive"
      });
    }
  };
  
  // Handle creating a new grant (for grant writers)
  const handleCreateGrant = () => {
    navigate('/grants/new');
  };
  
  const isLoading = isLoadingGrants || isLoadingRecommendations || isLoadingProfile;
  const error = grantsError || recommendationsError;

  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Music Grants Center
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mt-2">
                Discover, track, and prepare applications for music grants in one place
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {user && user.role === 'grant_writer' && (
                <Button onClick={handleCreateGrant} className="inline-flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Grant
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleRefreshRecommendations} 
                disabled={isLoading || isSubmittingRecommendations || !profile}
                className="inline-flex items-center"
              >
                {isLoadingRecommendations || isSubmittingRecommendations ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSubmittingRecommendations ? 'Refreshing...' : 'Refresh Recommendations'} 
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" id="profile-dialog-trigger" className="inline-flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Artist Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Your Artist Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile to get better grant recommendations
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isLoadingProfile ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Loading your artist profile...</p>
                    </div>
                  ) : (
                    <GrantRecommendationsForm 
                      onFormSubmit={(values) => {
                        setProfile(values);
                        fetchRecommendations(values);
                        
                        // Save to the database - update or create profile
                        if (artistProfile && artistProfile.id) {
                          // Update existing profile
                          updateArtistProfile({
                            id: artistProfile.id,
                            genres: values.genre,
                            careerStage: values.careerStage,
                            primaryInstrument: values.instrumentOrRole,
                            location: values.location,
                            projectType: values.projectType
                          });
                        } else if (user?.id) {
                          // Create new profile if user doesn't have one
                          createArtistProfile({
                            userId: user.id,
                            name: user.username || 'Artist',
                            genres: values.genre,
                            careerStage: values.careerStage,
                            primaryInstrument: values.instrumentOrRole,
                            location: values.location,
                            projectType: values.projectType
                          });
                        }
                        
                        setActiveTab('ai-recommended');
                        toast({
                          title: "Profile updated",
                          description: "Generating new grant recommendations based on your profile."
                        });
                      }} 
                      defaultValues={profile || undefined} 
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        
        <div className="space-y-6">
          {/* Filter and Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10" 
                placeholder="Search grants by name or organization..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-40">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by">
                    <span className="flex items-center">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <span className="text-sm">Sort by</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Best Match</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-expired" 
                  checked={showExpired} 
                  onCheckedChange={(checked) => {
                    console.log('Setting showExpired to:', checked);
                    setShowExpired(checked);
                    // Force UI refresh with a short delay to ensure state update completes
                    setTimeout(() => {
                      console.log('Refreshing grants list with showExpired =', checked);
                      setCombinedGrants([...combinedGrants]);
                    }, 50);
                  }}
                />
                <Label htmlFor="show-expired" className="text-sm">
                  Show expired grants
                </Label>
              </div>
            </div>
          </div>
          
          {/* Grant Categories */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">All Grants</TabsTrigger>
              <TabsTrigger value="ai-recommended">AI Matches</TabsTrigger>
              <TabsTrigger value="my-grants">My Grants</TabsTrigger>
            </TabsList>
            
            {/* Profile Card for AI Recommendations */}
            {activeTab === 'ai-recommended' && profile && (
              <Card className="bg-muted/30 mb-4">
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
                      onClick={() => document.getElementById('profile-dialog-trigger')?.click()}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Grants Display Area */}
            <TabsContent value="all" className="space-y-6">
              {renderGrantsList()}
            </TabsContent>
            
            <TabsContent value="ai-recommended" className="space-y-6">
              {!profile && !aiRecommendations && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No profile submitted</AlertTitle>
                  <AlertDescription>
                    Please update your <Button variant="link" className="p-0 h-auto" onClick={() => document.getElementById('profile-dialog-trigger')?.click()}>artist profile</Button> to get grant recommendations.
                  </AlertDescription>
                </Alert>
              )}
              {renderGrantsList()}
            </TabsContent>
            
            <TabsContent value="my-grants" className="space-y-6">
              {renderGrantsList()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
  
  // Helper function to render grants list with loading states
  function renderGrantsList() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load grants. Please try again later.'}
          </AlertDescription>
        </Alert>
      );
    }
    
    // Display loading message banner when AI is generating recommendations
    if (loadingMessage) {
      return (
        <>
          <Alert className="bg-primary/5 border-primary/20 mb-6">
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
            <AlertTitle>AI is processing</AlertTitle>
            <AlertDescription>
              {loadingMessage}
            </AlertDescription>
          </Alert>
          
          {/* Continue to display available grants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGrants.map((grant) => (
              <Card 
                key={`grant-list-item-${typeof grant.id === 'number' ? grant.id : `${grant.name}-${grant.organization}-${Math.random().toString(36).substring(2, 9)}`.replace(/\s+/g, '-').toLowerCase()}`} 
                className={`hover:shadow-md transition-shadow ${grant.aiRecommended 
                  ? 'border-l-4 border-l-primary' 
                  : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle 
                        className="text-lg font-bold hover:text-primary transition-colors"
                        onClick={() => {
                          // For database grants, go to detail page
                          if (typeof grant.id === 'number' && grant.id > 0) {
                            navigate(`/grants/${grant.id}`);
                          } else if (grant.url) {
                            // For AI recommendations with URL, open in new tab
                            window.open(grant.url, '_blank');
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {grant.name}
                      </CardTitle>
                      <CardDescription>{grant.organization}</CardDescription>
                    </div>
{/* AI Match badge removed as requested */}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-sm line-clamp-3 text-muted-foreground">
                    {grant.description || 'No description provided.'}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                      <span>
                        {formatDeadline(grant.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                      <span>
                        {grant.amount || 'Amount varies'}
                      </span>
                    </div>
                  </div>
                  
                  {grant.matchScore !== undefined && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Match Score:</span>
                      <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${Math.min(Math.max(Math.round(
                              // Convert any matchScore format to a percentage between 0-100%
                              typeof grant.matchScore === 'number' 
                                ? (grant.matchScore > 1 ? grant.matchScore : grant.matchScore * 100) 
                                : 50
                            ), 0), 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {Math.min(Math.max(Math.round(
                          // Convert any matchScore format to a percentage between 0-100%
                          typeof grant.matchScore === 'number' 
                            ? (grant.matchScore > 1 ? grant.matchScore : grant.matchScore * 100) 
                            : 50
                        ), 0), 100)}%
                      </span>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between space-x-2 bg-muted/20 py-3">
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <div className="space-x-2">
    {/* Website button removed as requested */}
                    <Button size="sm" onClick={() => {
                      if (!grant.id || typeof grant.id !== 'number' || grant.id < 0) {
                        try {
                          const grantData = {
                            name: grant.name,
                            organization: grant.organization,
                            amount: grant.amount,
                            deadline: grant.deadline,
                            description: grant.description,
                            requirements: grant.requirements,
                            url: grant.url || grant.website,
                            aiRecommended: true
                          };
                          console.log("Storing grant data in sessionStorage:", grantData);
                          sessionStorage.setItem('selectedGrant', JSON.stringify(grantData));
                          navigate('/applications/new');
                        } catch (err) {
                          console.error('Error storing grant data:', err);
                          toast({
                            title: 'Error',
                            description: 'Failed to prepare application. Please try again.',
                            variant: 'destructive'
                          });
                        }
                      } else {
                        navigate(`/applications/new?grantId=${grant.id}`);
                      }
                    }}>
                      <FileText className="h-4 w-4 mr-1" />
                      Prepare App
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      );
    }
    
    if (filteredAndSortedGrants.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">No grants found</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'my-grants'
              ? "You haven't created any grants yet."
              : activeTab === 'ai-recommended'
              ? "There are no AI recommended grants matching your profile."
              : "There are no grants matching your search criteria."}
          </p>
          {activeTab === 'my-grants' && user && user.role === 'grant_writer' && (
            <Button onClick={handleCreateGrant}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first grant
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedGrants.map((grant) => (
          <Card 
            key={`grant-grid-item-${typeof grant.id === 'number' ? grant.id : `${grant.name}-${grant.organization}-${Math.random().toString(36).substring(2, 9)}`.replace(/\s+/g, '-').toLowerCase()}`} 
            className={`hover:shadow-md transition-shadow ${grant.aiRecommended 
              ? 'border-l-4 border-l-primary' 
              : ''}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle 
                    className="text-lg font-bold hover:text-primary transition-colors"
                    onClick={() => {
                      // For database grants, go to detail page
                      if (typeof grant.id === 'number' && grant.id > 0) {
                        navigate(`/grants/${grant.id}`);
                      } else if (grant.url) {
                        // For AI recommendations with URL, open in new tab
                        window.open(grant.url, '_blank');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {grant.name}
                  </CardTitle>
                  <CardDescription>{grant.organization}</CardDescription>
                </div>
{/* AI Match badge removed as requested */}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm line-clamp-3 text-muted-foreground">
                {grant.description || 'No description provided.'}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                  <span>
                    {formatDeadline(grant.deadline)}
                  </span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                  <span>
                    {grant.amount || 'Amount varies'}
                  </span>
                </div>
              </div>
              
              {grant.matchScore !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Match Score:</span>
                  <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${Math.min(Math.max(Math.round(
                          // Convert any matchScore format to a percentage between 0-100%
                          typeof grant.matchScore === 'number' 
                            ? (grant.matchScore > 1 ? grant.matchScore : grant.matchScore * 100) 
                            : 50
                        ), 0), 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.min(Math.max(Math.round(
                      // Convert any matchScore format to a percentage between 0-100%
                      typeof grant.matchScore === 'number' 
                        ? (grant.matchScore > 1 ? grant.matchScore : grant.matchScore * 100) 
                        : 50
                    ), 0), 100)}%
                  </span>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between space-x-2 bg-muted/20 py-3">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
              <div className="space-x-2">
{/* Website button removed as requested */}
                <Button size="sm" onClick={() => {
                  // When preparing an application for an AI-recommended grant without an ID, 
                  // we need to store the grant data in sessionStorage
                  if (!grant.id || typeof grant.id !== 'number' || grant.id < 0) {
                    try {
                      // Store the grant details in session storage for the application form to use
                      const grantData = {
                        name: grant.name,
                        organization: grant.organization,
                        amount: grant.amount,
                        deadline: grant.deadline,
                        description: grant.description,
                        requirements: grant.requirements,
                        url: grant.url || grant.website,
                        aiRecommended: true
                      };
                      console.log("Storing grant data in sessionStorage:", grantData);
                      sessionStorage.setItem('selectedGrant', JSON.stringify(grantData));
                      
                      // Navigate to the new application form without an ID parameter
                      navigate('/applications/new');
                    } catch (err) {
                      console.error('Error storing grant data:', err);
                      toast({
                        title: 'Error',
                        description: 'Failed to prepare application. Please try again.',
                        variant: 'destructive'
                      });
                    }
                  } else {
                    // For database grants with valid IDs, use the ID in the URL
                    navigate(`/applications/new?grantId=${grant.id}`);
                  }
                }}>
                  <FileText className="h-4 w-4 mr-1" />
                  Prepare App
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}