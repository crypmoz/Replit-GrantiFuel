
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Sparkles, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useOnboarding } from '@/hooks/use-onboarding';

const applicationFormSchema = z.object({
  projectTitle: z.string().min(1, "Project title is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  artistGoals: z.string().min(1, "Artist goals are required"),
  projectImpact: z.string().min(1, "Project impact is required"),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export default function NewApplicationForm() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { completeTask } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('essentials');
  const [copied, setCopied] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    projectTitle?: string;
    projectDescription?: string;
    artistGoals?: string;
    projectImpact?: string;
  }>({});

  // Get grantId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const grantId = searchParams.get('grantId');

  // Fetch grant details
  const { data: grant, isLoading: isLoadingGrant } = useQuery({
    queryKey: [`/api/grants/${grantId}`],
    enabled: !!grantId && !grantId.startsWith('doc-based-'),
    queryFn: async () => {
      const response = await fetch(`/api/grants/${grantId}`);
      if (!response.ok) throw new Error('Failed to fetch grant');
      return response.json();
    }
  });
  
  // Check if we have a document-based recommendation (AI-generated grant)
  const isDocBasedGrant = grantId && grantId.startsWith('doc-based-');
  
  // Get grant data from sessionStorage if it's an AI recommendation
  const [aiGrant, setAiGrant] = useState<any>(null);
  
  useEffect(() => {
    console.log('Checking for grants in sessionStorage');
    // First check if we have a directly selected grant from UnifiedGrantsPage
    const selectedGrantStr = sessionStorage.getItem('selectedGrant');
    if (selectedGrantStr) {
      try {
        console.log('Raw selectedGrant from sessionStorage:', selectedGrantStr);
        const selectedGrant = JSON.parse(selectedGrantStr);
        console.log('Parsed selected grant in sessionStorage:', selectedGrant);
        setAiGrant(selectedGrant);
        
        // Clear the storage to avoid reusing this data accidentally
        sessionStorage.removeItem('selectedGrant');
        return;
      } catch (error) {
        console.error('Error parsing selected grant:', error);
      }
    } else {
      console.log('No selectedGrant found in sessionStorage');
    }
    
    // If no directly selected grant, check for doc-based grants
    if (isDocBasedGrant) {
      // Try to get grant data from the cached recommendations
      const cachedRecommendations = sessionStorage.getItem('ai-grant-recommendations');
      if (cachedRecommendations) {
        try {
          const recommendations = JSON.parse(cachedRecommendations);
          
          // We need to find the right recommendation from the array that matches our ID
          let matchingGrant;
          
          // First, extract the index from the grantId (doc-based-xxx-INDEX)
          const indexMatch = grantId.match(/(\d+)$/);
          let index = -1;
          
          if (indexMatch && indexMatch[1]) {
            index = parseInt(indexMatch[1], 10);
            // If we have a valid index, use it directly
            if (!isNaN(index) && index >= 0 && index < recommendations.length) {
              matchingGrant = recommendations[index];
              console.log(`Found grant by index ${index}:`, matchingGrant.name);
            }
          }
          
          // If no match by index, try hostname matching
          if (!matchingGrant) {
            // Extract the hostname from grantId if possible
            let targetHostname = '';
            const hostnameMatch = grantId.match(/doc-based-(.*?)-/);
            
            if (hostnameMatch && hostnameMatch[1] && hostnameMatch[1] !== 'recommendation') {
              targetHostname = hostnameMatch[1];
              console.log('Looking for grant with hostname:', targetHostname);
              
              // Try to find an exact match by hostname
              matchingGrant = recommendations.find((rec: any) => {
                if (!rec.url) return false;
                
                try {
                  // Extract hostname from URL and normalize it
                  const hostname = new URL(
                    rec.url.startsWith('http') ? rec.url : `https://${rec.url}`
                  ).hostname.replace(/^www\./, '');
                  
                  const normalizedTarget = targetHostname.replace(/^www\./, '');
                  
                  // Check for exact match or partial match in either direction
                  return hostname === normalizedTarget || 
                         hostname.includes(normalizedTarget) || 
                         normalizedTarget.includes(hostname);
                } catch (e) {
                  console.error('Error parsing URL:', rec.url, e);
                  return false;
                }
              });
              
              if (matchingGrant) {
                console.log('Found grant by hostname:', matchingGrant.name);
              }
            }
          }
          
          // If no match yet, use the first recommendation (fallback)
          if (!matchingGrant && recommendations.length > 0) {
            matchingGrant = recommendations[0];
            console.log('No matching grant found, using first recommendation:', matchingGrant.name);
          }
          
          // If still no match, just use the first recommendation as fallback
          if (!matchingGrant && recommendations.length > 0) {
            matchingGrant = recommendations[0];
            console.log('No exact match found, using first recommendation as fallback');
          }
          
          if (matchingGrant) {
            console.log('Found matching grant:', matchingGrant.name);
            setAiGrant(matchingGrant);
          }
        } catch (error) {
          console.error('Error parsing cached recommendations:', error);
        }
      }
    }
  }, [grantId, isDocBasedGrant]);

  // Fetch artist profiles
  const { data: artists } = useQuery({
    queryKey: ['/api/artists'],
    enabled: !!user,
  });

  // Get first artist if available
  const primaryArtist = artists && Array.isArray(artists) && artists.length > 0 ? artists[0] : null;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      projectTitle: '',
      projectDescription: '',
      artistGoals: '',
      projectImpact: '',
    },
  });

  // Use generated content when available
  useEffect(() => {
    if (generatedContent.projectTitle) {
      form.setValue('projectTitle', generatedContent.projectTitle);
    }
    if (generatedContent.projectDescription) {
      form.setValue('projectDescription', generatedContent.projectDescription);
    }
    if (generatedContent.artistGoals) {
      form.setValue('artistGoals', generatedContent.artistGoals);
    }
    if (generatedContent.projectImpact) {
      form.setValue('projectImpact', generatedContent.projectImpact);
    }
  }, [generatedContent, form]);

  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      // If we have a non-database grant (from AI or session storage), create a new grant first
      if (!grantId || (grantId && isNaN(Number(grantId))) || (grantId && grantId.startsWith("doc-based-")) || 
          (effectiveGrant && (typeof effectiveGrant.id !== 'number' || effectiveGrant.id < 0))) {
        
        // This is a non-database grant, we need to create it first
        try {
          console.log("Creating new grant from recommendation:", effectiveGrant);
          
          // Create a new grant from the recommendation
          const grantResponse = await apiRequest('POST', '/api/grants', {
            name: effectiveGrant?.name || "AI Recommended Grant",
            organization: effectiveGrant?.organization || "Unknown Organization", 
            amount: effectiveGrant?.amount || "$0",
            deadline: effectiveGrant?.deadline || new Date().toISOString(),
            description: effectiveGrant?.description || "",
            requirements: typeof effectiveGrant?.requirements === 'string' ? effectiveGrant.requirements : 
                         Array.isArray(effectiveGrant?.requirements) ? effectiveGrant.requirements.join(", ") : "",
            website: effectiveGrant?.website || effectiveGrant?.url || "",
          });
          
          if (!grantResponse.ok) {
            throw new Error('Failed to create grant from recommendation');
          }
          
          const newGrant = await grantResponse.json();
          console.log("Created new grant:", newGrant);
          
          // Now create the application using the new grant
          const response = await apiRequest('POST', '/api/applications', {
            grantId: newGrant.id,
            artistId: primaryArtist?.id,
            ...data,
            status: 'draft',
            progress: 40,
          });
          
          if (!response.ok) {
            throw new Error('Failed to create application');
          }
          
          return await response.json();
        } catch (error) {
          console.error("Error creating grant from recommendation:", error);
          throw new Error("Failed to create application: " + (error instanceof Error ? error.message : String(error)));
        }
      } else {
        // Normal flow for existing grants with valid database IDs
        try {
          console.log("Creating application for existing grant ID:", grantId);
          const response = await apiRequest('POST', '/api/applications', {
            grantId: Number(grantId),
            artistId: primaryArtist?.id,
            ...data,
            status: 'draft',
            progress: 40,
          });

          if (!response.ok) {
            throw new Error('Failed to create application');
          }

          return await response.json();
        } catch (error) {
          console.error("Error creating application:", error);
          throw new Error("Failed to create application: " + (error instanceof Error ? error.message : String(error)));
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Application prepared",
        description: "Your application draft has been saved successfully.",
      });
      
      // Complete onboarding task if needed
      try {
        completeTask('first_application_created');
      } catch (error) {
        console.error('Error completing onboarding task:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      navigate('/applications');
    },
    onError: (error: any) => {
      toast({
        title: "Error creating application",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      await createApplicationMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIContent = async () => {
    if (!effectiveGrant || !primaryArtist) {
      toast({
        title: "Missing information",
        description: "Grant details or artist profile information is missing.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // For AI-recommended grants that don't have a database ID, we use name and other fields directly
      const requestData = {
        // Only include grantId if it's a valid number (database ID)
        ...(typeof effectiveGrant.id === 'number' && effectiveGrant.id > 0 ? { grantId: effectiveGrant.id } : {}),
        artistId: primaryArtist.id,
        grantName: effectiveGrant.name,
        grantOrganization: effectiveGrant.organization,
        grantRequirements: effectiveGrant.requirements?.join?.(', ') || 
                           (typeof effectiveGrant.requirements === 'string' ? effectiveGrant.requirements : ''),
        // Additional info that might be helpful for AI
        grantDescription: effectiveGrant.description || '',
        grantAmount: effectiveGrant.amount || '',
        grantDeadline: effectiveGrant.deadline ? new Date(effectiveGrant.deadline).toLocaleDateString() : '',
        // Artist info
        artistName: primaryArtist.name,
        artistBio: primaryArtist.bio || '',
        artistGenre: primaryArtist.genres?.join(', ') || '',
      };
      
      console.log("Generating content with data:", requestData);
      
      const response = await apiRequest('POST', '/api/ai/generate-application-content', requestData);

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      setGeneratedContent(result.content || {});
      
      toast({
        title: "Content generated",
        description: "AI-generated content is ready for your review and editing.",
      });
      
      // Complete onboarding task if needed
      try {
        completeTask('ai_assistant_used', { feature: 'application_content_generation' });
      } catch (error) {
        console.error('Error completing onboarding task:', error);
      }
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      toast({
        title: "Error generating content",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = `
# ${form.getValues('projectTitle')}

## Project Description
${form.getValues('projectDescription')}

## Artist Goals
${form.getValues('artistGoals')}

## Project Impact
${form.getValues('projectImpact')}
    `;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Application content copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive"
      });
    });
  };

  // Only show the no grant selected message if we don't have a grantId AND don't have an aiGrant
  // The aiGrant could be loaded from sessionStorage even without a grantId
  if (!grantId && !aiGrant) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p>No grant selected. Please select a grant to prepare an application for.</p>
            <Button onClick={() => navigate('/grants')} className="mt-4">
              View Grants
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingGrant) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading grant details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use AI grant data if available, otherwise use the fetched grant
  const effectiveGrant = grant || aiGrant;
  
  if (!effectiveGrant) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p>Grant not found. Please select a valid grant to prepare for.</p>
            <Button onClick={() => navigate('/grants')} className="mt-4">
              View Grants
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" className="pl-0" onClick={() => navigate('/grants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Grants
        </Button>
      </div>

      <Alert className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900">
        <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center">
          <ExternalLink className="h-4 w-4 mr-2" />
          Preparation Tool Only
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          This tool helps you prepare your application content for <strong>{effectiveGrant.name}</strong>. 
          You'll need to submit the final application through their 
          <a 
            href={(() => {
              // Get the URL from either field
              const url = effectiveGrant.url || effectiveGrant.website;
              if (!url) return "#";
              
              try {
                // Ensure URL is properly formatted
                const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
                new URL(formattedUrl); // Will throw if invalid
                return formattedUrl;
              } catch (e) {
                console.error('Invalid URL in grant:', url);
                return "#";
              }
            })()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mx-1 text-primary underline hover:text-primary/80"
            onClick={(e) => {
              const url = effectiveGrant.url || effectiveGrant.website;
              if (!url) {
                e.preventDefault();
                // Could show a toast here
              }
            }}
          >
            official website
          </a>.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Prepare Application</span>
            <Button 
              variant="outline"
              size="sm"
              onClick={generateAIContent}
              disabled={isGenerating || !primaryArtist}
              className="ml-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                  Generate with AI
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {effectiveGrant.name} - {effectiveGrant.organization}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="essentials">Essential Information</TabsTrigger>
              <TabsTrigger value="preview">Preview & Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="essentials">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your project title" {...field} />
                        </FormControl>
                        <FormDescription>
                          A concise, memorable title for your grant project.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your project in detail..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A comprehensive description of what your project entails and how it will be executed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="artistGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Goals</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your goals as an artist for this project?"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain your personal or professional goals that this grant would help you achieve.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Impact</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the impact this project will have..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain how your project will impact your audience, community, or the music field.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/grants')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Draft...
                        </>
                      ) : (
                        'Save Draft'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="space-y-6">
                <div className="space-y-4 border border-border rounded-md p-6 bg-card/50">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{form.getValues('projectTitle') || 'Project Title'}</h3>
                    <div className="h-px w-full bg-border mb-4"></div>
                    
                    <h4 className="text-sm uppercase font-semibold text-muted-foreground mt-4 mb-2">Project Description</h4>
                    <p className="whitespace-pre-line">{form.getValues('projectDescription') || 'No project description provided.'}</p>
                    
                    <h4 className="text-sm uppercase font-semibold text-muted-foreground mt-4 mb-2">Artist Goals</h4>
                    <p className="whitespace-pre-line">{form.getValues('artistGoals') || 'No artist goals provided.'}</p>
                    
                    <h4 className="text-sm uppercase font-semibold text-muted-foreground mt-4 mb-2">Project Impact</h4>
                    <p className="whitespace-pre-line">{form.getValues('projectImpact') || 'No project impact provided.'}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={copyToClipboard}
                    className="w-full" 
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Get the URL from either field
                      const url = effectiveGrant.url || effectiveGrant.website;
                      if (!url) {
                        toast({
                          title: "No website available",
                          description: "This grant doesn't have an official website link.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      try {
                        // Ensure URL is properly formatted before opening
                        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
                        new URL(formattedUrl); // Will throw if invalid
                        window.open(formattedUrl, '_blank');
                      } catch (e) {
                        console.error('Invalid URL in grant:', url);
                        toast({
                          title: "Invalid website URL",
                          description: "Unable to open the website due to an invalid URL format.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="w-full"
                    disabled={!effectiveGrant.url && !effectiveGrant.website}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Official Application Portal
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('essentials')}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Editing
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
