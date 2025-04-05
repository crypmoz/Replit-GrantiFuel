import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Grant, GrantWithAIRecommendation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArtistProfile, useGrantRecommendations } from "@/hooks/use-grant-recommendations";

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  DollarSign, 
  Globe, 
  Star, 
  Building, 
  ExternalLink, 
  Search,
  AlertCircle as AlertCircleIcon,
  Loader2,
  RefreshCw
} from "lucide-react";

// Form validation schema
const profileFormSchema = z.object({
  genre: z.string().min(1, "Genre is required"),
  careerStage: z.string().min(1, "Career stage is required"),
  instrumentOrRole: z.string().min(1, "Instrument or role is required"),
  location: z.string().optional(),
  projectType: z.string().optional(),
});

export type GrantManagerMode = 'form' | 'list' | 'detail';

interface UnifiedGrantManagerProps {
  defaultProfile?: Partial<ArtistProfile>;
  defaultGrantId?: number;
  onSelectGrant?: (grant: GrantWithAIRecommendation) => void;
  onProfileUpdate?: (profile: ArtistProfile) => void;
  className?: string;
  mode?: GrantManagerMode;
}

export function UnifiedGrantManager({ 
  defaultProfile,
  defaultGrantId,
  onSelectGrant,
  onProfileUpdate,
  className = "",
  mode: initialMode = 'list'
}: UnifiedGrantManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [mode, setMode] = useState<GrantManagerMode>(initialMode);
  const [activeTab, setActiveTab] = useState<string>("ai-recommendations");
  const [selectedGrant, setSelectedGrant] = useState<GrantWithAIRecommendation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get grant recommendations hook
  const {
    recommendations: aiRecommendations,
    isLoading: isLoadingRecommendations,
    profile,
    setProfile,
    fetchRecommendations,
    refreshRecommendations,
    isSubmitting
  } = useGrantRecommendations();

  // Setup form
  const form = useForm<ArtistProfile>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfile || {
      genre: profile?.genre || "",
      careerStage: profile?.careerStage || "",
      instrumentOrRole: profile?.instrumentOrRole || "",
      location: profile?.location || "",
      projectType: profile?.projectType || "",
    },
  });

  // Fetch grants
  const { data: grantsData, isLoading: isLoadingGrants } = useQuery<{
    grants: Grant[];
    isPersonalized?: boolean;
    profileComplete?: boolean;
    aiEnhanced?: boolean;
  }>({
    queryKey: ["/api/grants"],
    enabled: !!user,
  });
  
  // Extract grants from response
  const grants = grantsData?.grants || [];

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        genre: profile.genre || "",
        careerStage: profile.careerStage || "",
        instrumentOrRole: profile.instrumentOrRole || "",
        location: profile.location || "",
        projectType: profile.projectType || "",
      });
    }
  }, [profile, form]);

  // Set the default grant if provided
  useEffect(() => {
    if (defaultGrantId) {
      const foundGrant = grants.find(g => g.id === defaultGrantId);
      if (foundGrant) {
        setSelectedGrant({
          ...foundGrant,
          matchScore: 0,
          aiRecommended: false,
          website: null
        });
        setMode('detail');
      }
    }
  }, [defaultGrantId, grants]);

  // Combine regular grants with AI recommendations
  const allGrants: GrantWithAIRecommendation[] = [
    ...(aiRecommendations || []).map((rec, index) => ({
      // Ensure a unique ID for each recommendation; if the ID is -1 or missing, create a unique negative ID based on index
      id: typeof rec.id === 'string' 
        ? (parseInt(rec.id, 10) || -(index + 1)) 
        : (rec.id || -(index + 1)),
      userId: user?.id || 0,
      name: rec.name,
      organization: rec.organization,
      amount: rec.amount,
      deadline: new Date(rec.deadline),
      description: rec.description,
      requirements: Array.isArray(rec.requirements) ? rec.requirements.join('\n') : rec.requirements,
      createdAt: new Date(),
      matchScore: rec.matchScore,
      aiRecommended: true,
      website: rec.url
    } as GrantWithAIRecommendation)),
    ...grants.filter(grant => 
      !(aiRecommendations || []).some(rec => 
        rec.name.toLowerCase() === grant.name.toLowerCase() ||
        rec.organization.toLowerCase() === grant.organization.toLowerCase()
      )
    ).map(grant => ({
      ...grant,
      matchScore: 0,
      aiRecommended: false,
      website: grant.website || null
    } as GrantWithAIRecommendation))
  ];

  // Apply search filter
  const filteredGrants = allGrants.filter(grant => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      grant.name.toLowerCase().includes(searchLower) ||
      grant.organization.toLowerCase().includes(searchLower) ||
      (grant.description && grant.description.toLowerCase().includes(searchLower))
    );
  });

  // Sort grants by match score when on AI recommendations tab
  const displayedGrants = activeTab === "ai-recommendations"
    ? filteredGrants.filter(grant => grant.aiRecommended)
      .sort((a, b) => {
        if ((a.matchScore ?? 0) > (b.matchScore ?? 0)) return -1;
        if ((a.matchScore ?? 0) < (b.matchScore ?? 0)) return 1;
        return 0;
      })
    : filteredGrants;

  // Handle form submission for grant profile
  const handleSubmitProfile = (values: ArtistProfile) => {
    // Update profile in the hook
    setProfile(values);
    
    // Fetch recommendations with the new profile
    fetchRecommendations(values);
    
    // Notify parent if callback provided
    if (onProfileUpdate) {
      onProfileUpdate(values);
    }
    
    // Change mode to show grants list
    setMode('list');
  };

  // Handle grant selection
  const handleSelectGrant = (grant: GrantWithAIRecommendation) => {
    setSelectedGrant(grant);
    setMode('detail');
  };

  // Handle confirm selection to parent component
  const handleConfirmSelection = () => {
    if (selectedGrant && onSelectGrant) {
      onSelectGrant(selectedGrant);
    }
  };

  // Handle refreshing recommendations
  const handleRefreshRecommendations = () => {
    if (profile) {
      refreshRecommendations(profile);
      toast({
        title: "Refreshing recommendations",
        description: "Finding grant opportunities with future deadlines for you."
      });
    } else {
      toast({
        title: "Profile needed",
        description: "Please set up your artist profile first to get recommendations.",
      });
    }
  };

  // ------------------ Render Logic ------------------
  
  // Loading state
  if ((isLoadingGrants || isLoadingRecommendations) && mode !== 'form') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={`unified-grant-skeleton-${i}`} className="rounded-lg overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-3/5 mt-2" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Profile Form mode
  if (mode === 'form') {
    return (
      <Card className={`w-full shadow-sm ${className}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Find Your Perfect Grant Match
          </CardTitle>
          <CardDescription>
            Tell us about your musical profile and we'll use AI to recommend grants tailored to your needs.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitProfile)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Music Genre</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your primary genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="classical">Classical</SelectItem>
                          <SelectItem value="jazz">Jazz</SelectItem>
                          <SelectItem value="folk">Folk</SelectItem>
                          <SelectItem value="indie">Indie</SelectItem>
                          <SelectItem value="rock">Rock</SelectItem>
                          <SelectItem value="pop">Pop</SelectItem>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                          <SelectItem value="r&b">R&B</SelectItem>
                          <SelectItem value="world">World Music</SelectItem>
                          <SelectItem value="experimental">Experimental</SelectItem>
                          <SelectItem value="mixed-media">Mixed Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="careerStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Career Stage</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your career stage" />
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
                  name="instrumentOrRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Instrument or Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
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
                      <FormLabel>Location <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Country or region (e.g., USA, Europe)" 
                          {...field} 
                          value={field.value || ""}
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
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Project Type <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type (optional)" />
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
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding grants...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Grant Opportunities
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Grant List mode
  if (mode === 'list') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            {profile && (
              <h2 className="text-xl font-semibold">
                Grants for {profile.genre} {profile.instrumentOrRole}
              </h2>
            )}
            <p className="text-muted-foreground">
              We've found {displayedGrants.length} grants that match your profile
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedGrant && (
              <Button onClick={handleConfirmSelection}>
                Continue with selected grant
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setMode('form')}>
              Edit Profile
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefreshRecommendations} 
              disabled={isSubmitting}
              title="Refresh recommendations"
            >
              <RefreshCw 
                className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} 
              />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search grants..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="ai-recommendations" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ai-recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="all-grants">All Grants</TabsTrigger>
          </TabsList>
          <TabsContent value="ai-recommendations">
            {displayedGrants.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-2">
                  <AlertCircleIcon className="h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No AI recommendations available</h3>
                  <p className="text-muted-foreground">
                    Try updating your artist profile with more details or check the "All Grants" tab
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedGrants.map((grant, index) => (
                  <GrantCard
                    key={`recommended-grant-${grant.id}-${index}`}
                    grant={grant}
                    isSelected={selectedGrant?.id === grant.id}
                    onSelect={() => handleSelectGrant(grant)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all-grants">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedGrants.length === 0 ? (
                <Card className="col-span-full bg-muted/50">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-2">
                    <AlertCircleIcon className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No grants found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or check back later for new grants
                    </p>
                  </CardContent>
                </Card>
              ) : (
                displayedGrants.map((grant, index) => (
                  <GrantCard
                    key={`all-grants-${grant.id}-${index}`}
                    grant={grant}
                    isSelected={selectedGrant?.id === grant.id}
                    onSelect={() => handleSelectGrant(grant)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Grant Detail mode
  if (mode === 'detail' && selectedGrant) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => setMode('list')}
        >
          ← Back to grants
        </Button>
      
        <Card>
          <CardHeader>
            <CardTitle>Grant Details</CardTitle>
            <CardDescription>
              Review details before proceeding with your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedGrant.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{selectedGrant.organization}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{selectedGrant.amount || "Amount not specified"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Deadline: {format(new Date(selectedGrant.deadline), "PPP")}</span>
                  </div>
                  {selectedGrant.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedGrant.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center"
                      >
                        Visit website <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedGrant.description || "No description available."}
                </p>
                
                <h4 className="font-medium mb-2">Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedGrant.requirements || "No specific requirements listed."}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setMode('list')}>
              Back to grants
            </Button>
            <Button onClick={handleConfirmSelection}>
              Continue with this grant
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback (shouldn't happen)
  return (
    <div className={`${className}`}>
      <Button onClick={() => setMode('form')}>Find Grants</Button>
    </div>
  );
}

interface GrantCardProps {
  grant: GrantWithAIRecommendation;
  isSelected: boolean;
  onSelect: () => void;
}

function GrantCard({ grant, isSelected, onSelect }: GrantCardProps) {
  return (
    <Card 
      className={`rounded-lg overflow-hidden hover:border-primary cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base line-clamp-1">{grant.name}</CardTitle>
            <CardDescription className="line-clamp-1">{grant.organization}</CardDescription>
          </div>
          {grant.aiRecommended && (
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Star className="h-3 w-3 mr-1 fill-primary text-primary" /> AI Match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              <span>{grant.amount || "Not specified"}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{format(new Date(grant.deadline), "MMM d, yyyy")}</span>
            </div>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-xs min-h-[2rem]">
            {grant.description || "No description available."}
          </p>
          {grant.website && (
            <div className="flex items-center text-xs">
              <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
              <a 
                href={grant.website} 
                className="text-primary hover:underline truncate max-w-[200px]"
                onClick={(e) => e.stopPropagation()}
                target="_blank" 
                rel="noopener noreferrer"
              >
                {grant.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}>
          {isSelected ? "Selected" : "Select Grant"}
        </Button>
      </CardFooter>
    </Card>
  );
}