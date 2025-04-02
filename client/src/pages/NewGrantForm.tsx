import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { queryClient } from '../lib/queryClient';
import { apiRequest } from '../lib/queryClient';
import { insertGrantSchema, type InsertGrant } from '@shared/schema';

// Extend the insert schema with validation
const createGrantSchema = z.object({
  name: z.string().min(3, "Grant name must be at least 3 characters"),
  organization: z.string().min(2, "Organization name is required"),
  amount: z.string().min(1, "Grant amount is required"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").or(z.string().length(0)).optional(),
  contactEmail: z.string().email("Please enter a valid email address").or(z.string().length(0)).optional(),
});

type CreateGrantValues = z.infer<typeof createGrantSchema>;

export default function NewGrantForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<CreateGrantValues>({
    resolver: zodResolver(createGrantSchema),
    defaultValues: {
      name: '',
      organization: '',
      amount: '',
      deadline: new Date().toISOString().slice(0, 10), // Today's date in YYYY-MM-DD format
      description: '',
      requirements: '',
      website: '',
      contactEmail: '',
    },
  });

  // Grant creation mutation
  const createGrantMutation = useMutation({
    mutationFn: async (data: Omit<InsertGrant, 'userId'>) => {
      const response = await apiRequest("POST", "/api/grants", data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch grants query
      queryClient.invalidateQueries({ queryKey: ['/api/grants'] });
      toast({
        title: "Grant created",
        description: "Grant has been successfully created",
      });
      navigate('/grants');
    },
    onError: (error: any) => {
      toast({
        title: "Error creating grant",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CreateGrantValues) => {
    setIsSubmitting(true);

    // The userId will be added by the server from the authenticated user
    // We use JSON to pass the date string, which will be parsed on the server
    const formattedData = {
      ...data,
      deadline: data.deadline, // Keep as string
    };

    // Use type assertion to bypass TypeScript's type check
    // This allows us to send a string to the server instead of a Date object
    createGrantMutation.mutate(formattedData as unknown as Omit<InsertGrant, 'userId'>);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-8 w-8"
          onClick={() => navigate('/grants')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to grants</span>
        </Button>
        <h1 className="text-2xl font-bold">Create New Grant</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Grant Details</CardTitle>
          <CardDescription>
            Add the details for the new grant opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Music Development Fund" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Arts Council" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Amount *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. $5,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.org/grant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="grants@example.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of the grant..." 
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
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List any specific requirements or eligibility criteria..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-between px-0 pb-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/grants')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createGrantMutation.isPending}
                >
                  {(isSubmitting || createGrantMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Grant'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}