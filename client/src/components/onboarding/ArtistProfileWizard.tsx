import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Artist, insertArtistSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Music,
  MapPin,
  Tag,
  Briefcase,
  Info,
  Calendar
} from "lucide-react";

interface ArtistProfileWizardProps {
  onArtistCreated: (artist: Artist) => void;
}

export function ArtistProfileWizard({ onArtistCreated }: ArtistProfileWizardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("basic-info");

  // Artist Creation Form
  const form = useForm({
    resolver: zodResolver(insertArtistSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      email: "",
      phone: "",
      bio: "",
      location: "",
      genres: [] as string[],
      careerStage: "",
      primaryInstrument: "",
      projectType: ""
    },
  });

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
        variant: "default",
      });
      onArtistCreated(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    createArtistMutation.mutate(data);
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormField
                  control={form.control}
                  name="genres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Musical Genres</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Music className="mr-2 h-4 w-4 opacity-70 mt-3" />
                          <MultiSelect
                            options={[
                              { label: "Classical", value: "Classical" },
                              { label: "Jazz", value: "Jazz" },
                              { label: "Rock", value: "Rock" },
                              { label: "Pop", value: "Pop" },
                              { label: "Electronic", value: "Electronic" },
                              { label: "Hip Hop", value: "Hip Hop" },
                              { label: "R&B", value: "R&B" },
                              { label: "Folk", value: "Folk" },
                              { label: "World", value: "World" },
                              { label: "Experimental", value: "Experimental" },
                            ]}
                            placeholder="Select genres (can select multiple)"
                            selected={field.value || []}
                            onChange={(selectedValues: string[]) => {
                              form.setValue("genres", selectedValues);
                            }}
                          />
                        </div>
                      </FormControl>
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

// Icon components for the form
function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}