import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArtistProfile, useGrantRecommendations } from "@/hooks/use-grant-recommendations";
import { Loader2, Search } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  genre: z.string().min(1, "Genre is required"),
  careerStage: z.string().min(1, "Career stage is required"),
  instrumentOrRole: z.string().min(1, "Instrument or role is required"),
  location: z.string().optional(),
  projectType: z.string().optional(),
});

interface GrantRecommendationsFormProps {
  onFormSubmit?: (profile: ArtistProfile) => void;
  defaultValues?: Partial<ArtistProfile>;
}

export default function GrantRecommendationsForm({ 
  onFormSubmit,
  defaultValues 
}: GrantRecommendationsFormProps) {
  const { fetchRecommendations, isSubmitting } = useGrantRecommendations();
  
  // Initialize form with validation
  const form = useForm<ArtistProfile>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      genre: "",
      careerStage: "",
      instrumentOrRole: "",
      location: "",
      projectType: "",
    },
  });

  // Handle form submission
  function onSubmit(values: ArtistProfile) {
    fetchRecommendations(values);
    if (onFormSubmit) {
      onFormSubmit(values);
    }
  }

  return (
    <Card className="w-full shadow-sm">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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