import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Grant, 
  Artist, 
  insertApplicationSchema,
  GrantWithAIRecommendation 
} from "@shared/schema";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  CheckCircle, 
  Globe,
  Building,
  DollarSign,
  CalendarDays,
  FileText,
  User,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EnhancedApplicationFormProps {
  grant: GrantWithAIRecommendation;
  onApplicationCreated?: (applicationId: number) => void;
  className?: string;
}

// Extended schema with additional fields for our form
const applicationFormSchema = z.object({
  userId: z.number(),
  grantId: z.number(),
  artistId: z.number(),
  status: z.string().default("draft"),
  answers: z.record(z.string()).default({}),
  
  // These are form-specific fields that won't be sent directly to the API
  projectTitle: z.string().min(1, "Project title is required"),
  projectSummary: z.string().min(10, "Please provide a project summary"),
  budget: z.string().min(1, "Budget information is required"),
  timeline: z.string().min(1, "Timeline information is required"),
  goals: z.string().min(1, "Please outline your project goals"),
  impact: z.string().min(1, "Please describe the impact of your project"),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export function EnhancedApplicationForm({
  grant,
  onApplicationCreated,
  className
}: EnhancedApplicationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("project-info");

  // Fetch artists for the dropdown
  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      userId: user?.id || 0,
      grantId: grant.id,
      artistId: 0, // Will be set when user selects an artist
      status: "draft",
      answers: {},
      
      // Form fields with empty defaults
      projectTitle: "",
      projectSummary: "",
      budget: "",
      timeline: "",
      goals: "",
      impact: "",
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      // Transform the form data to match the API schema
      const applicationData = {
        userId: data.userId,
        grantId: data.grantId,
        artistId: data.artistId,
        status: data.status,
        // Store form fields in the answers JSON field
        answers: {
          projectTitle: data.projectTitle,
          projectSummary: data.projectSummary,
          budget: data.budget,
          timeline: data.timeline,
          goals: data.goals,
          impact: data.impact,
        }
      };
      
      const response = await apiRequest("POST", "/api/applications", applicationData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create application");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application started",
        description: "Your application has been created successfully.",
      });
      if (onApplicationCreated) {
        onApplicationCreated(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    if (!data.artistId) {
      toast({
        title: "Artist required",
        description: "Please select an artist profile to continue",
        variant: "destructive",
      });
      return;
    }
    
    createApplicationMutation.mutate(data);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Common field container style
  const fieldContainerClass = "space-y-1.5";

  if (isLoadingArtists) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-primary/10 rounded-md w-1/3"></div>
        <div className="h-32 bg-primary/5 rounded-md"></div>
        <div className="h-16 bg-primary/5 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Grant Details</CardTitle>
          <CardDescription>Review the grant details before starting your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{grant.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{grant.organization}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{grant.amount || "Amount not specified"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {format(new Date(grant.deadline), "PPP")}</span>
                </div>
                {grant.website && (
                  <div className="flex items-center text-sm">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a 
                      href={grant.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      Visit grant website <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Requirements</h4>
              <p className="text-sm text-muted-foreground">
                {grant.requirements || "No specific requirements listed."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
              <CardDescription>Fill out the required information for your grant application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="artistId"
                  render={({ field }) => (
                    <FormItem className={fieldContainerClass}>
                      <FormLabel>Artist Profile</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an artist profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(artists || []).map((artist) => (
                            <SelectItem key={artist.id} value={artist.id.toString()}>
                              {artist.name} - {artist.primaryInstrument || "Artist"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <FormDescription>
                        Choose which artist profile to use for this application
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="project-info">Project Information</TabsTrigger>
                    <TabsTrigger value="details">Additional Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="project-info" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="projectTitle"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your project title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectSummary"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Project Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a summary of your project"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            Briefly summarize your project in 2-3 paragraphs
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Budget Overview</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a high-level breakdown of your project budget"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end mt-4">
                      <Button type="button" onClick={() => handleTabChange("details")}>
                        Continue to Additional Details
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Project Timeline</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Outline the timeline for your project"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Project Goals</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What are the specific goals of your project?"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem className={fieldContainerClass}>
                          <FormLabel>Project Impact</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the expected impact of your project"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            How will your project benefit your career and the wider community?
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between mt-4">
                      <Button type="button" variant="outline" onClick={() => handleTabChange("project-info")}>
                        Back to Project Information
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button 
                type="submit" 
                disabled={createApplicationMutation.isPending}
              >
                {createApplicationMutation.isPending ? "Submitting..." : "Start Application"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}