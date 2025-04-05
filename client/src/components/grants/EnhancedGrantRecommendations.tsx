import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Grant, GrantWithAIRecommendation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
  AlertCircle as AlertCircleIcon
} from "lucide-react";

interface ArtistProfile {
  genre: string;
  careerStage: string;
  instrumentOrRole: string;
  location?: string;
  projectType?: string;
}

interface EnhancedGrantRecommendationsProps {
  artistProfile: ArtistProfile;
  onSelectGrant: (grant: GrantWithAIRecommendation) => void;
}

export function EnhancedGrantRecommendations({
  artistProfile,
  onSelectGrant,
}: EnhancedGrantRecommendationsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("ai-recommendations");
  const [selectedGrant, setSelectedGrant] = useState<GrantWithAIRecommendation | null>(null);

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

  // Get AI recommendations
  const getRecommendationsMutation = useMutation({
    mutationFn: async (profile: ArtistProfile) => {
      const response = await apiRequest("POST", "/api/ai/grant-recommendations", profile);
      if (!response.ok) throw new Error("Failed to get grant recommendations");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recommendations loaded",
        description: "We've found grants that match your profile",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error getting recommendations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // State for AI recommendations
  const [aiRecommendations, setAiRecommendations] = useState<GrantWithAIRecommendation[]>([]);
  
  // Fetch recommendations when component loads
  useEffect(() => {
    if (artistProfile && user) {
      getRecommendationsMutation.mutate(artistProfile);
    }
  }, [artistProfile, user]);
  
  // Update AI recommendations when mutation completes
  useEffect(() => {
    if (getRecommendationsMutation.data?.recommendations) {
      // Process recommendations to ensure unique IDs
      const processedRecommendations = getRecommendationsMutation.data.recommendations.map((rec: Partial<GrantWithAIRecommendation>, index: number) => ({
        ...rec,
        // Ensure a unique ID for each recommendation; if the ID is -1 or missing, create a unique negative ID based on index
        id: typeof rec.id === 'string' 
          ? (parseInt(rec.id, 10) || -(index + 1)) 
          : (rec.id || -(index + 1))
      }));
      
      setAiRecommendations(processedRecommendations);
    }
  }, [getRecommendationsMutation.data]);
  
  // Combine regular grants with AI recommended grants
  const allGrants: GrantWithAIRecommendation[] = [
    ...aiRecommendations,
    ...grants.filter(grant => 
      !aiRecommendations.some(rec => rec.id === grant.id)
    ).map(grant => ({
      ...grant,
      matchScore: 0,
      aiRecommended: false,
      website: grant.website || null
    } as GrantWithAIRecommendation))
  ];

  // Sort grants by match score when on AI recommendations tab
  const displayedGrants = activeTab === "ai-recommendations"
    ? [...allGrants].filter(grant => grant.aiRecommended)
      .sort((a, b) => {
        if ((a.matchScore ?? 0) > (b.matchScore ?? 0)) return -1;
        if ((a.matchScore ?? 0) < (b.matchScore ?? 0)) return 1;
        return 0;
      })
    : allGrants;

  const handleSelectGrant = (grant: GrantWithAIRecommendation) => {
    setSelectedGrant(grant);
  };

  const handleConfirmSelection = () => {
    if (selectedGrant) {
      onSelectGrant(selectedGrant);
    }
  };

  if (isLoadingGrants || getRecommendationsMutation.isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={`grant-recommendation-skeleton-${i}`} className="rounded-lg overflow-hidden">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Grants for {artistProfile.genre} {artistProfile.instrumentOrRole}</h2>
          <p className="text-muted-foreground">
            We've found {displayedGrants.length} grants that match your profile
          </p>
        </div>
        {selectedGrant && (
          <Button onClick={handleConfirmSelection}>
            Continue with selected grant
          </Button>
        )}
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
                  key={`ai-rec-${grant.id}-${index}`}
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
            {allGrants.map((grant, index) => (
              <GrantCard
                key={`all-grants-${grant.id}-${index}`}
                grant={grant}
                isSelected={selectedGrant?.id === grant.id}
                onSelect={() => handleSelectGrant(grant)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedGrant && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Selected Grant</CardTitle>
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
              <Button variant="outline" onClick={() => setSelectedGrant(null)}>
                Cancel selection
              </Button>
              <Button onClick={handleConfirmSelection}>
                Continue with this grant
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
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