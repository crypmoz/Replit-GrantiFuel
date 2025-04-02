
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const applicationFormSchema = z.object({
  projectTitle: z.string().min(1, "Project title is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  budget: z.string().min(1, "Budget is required"),
  timeline: z.string().min(1, "Timeline is required"),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export default function NewApplicationForm() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get grantId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const grantId = searchParams.get('grantId');

  // Fetch grant details
  const { data: grant, isLoading: isLoadingGrant } = useQuery({
    queryKey: [`/api/grants/${grantId}`],
    enabled: !!grantId,
    queryFn: async () => {
      const response = await fetch(`/api/grants/${grantId}`);
      if (!response.ok) throw new Error('Failed to fetch grant');
      return response.json();
    }
  });

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      projectTitle: '',
      projectDescription: '',
      budget: '',
      timeline: '',
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantId: Number(grantId),
          ...data,
          status: 'draft',
          progress: 25,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application created",
        description: "Your application has been started successfully.",
      });
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

  if (!grantId) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p>No grant selected. Please select a grant to apply for.</p>
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

  if (!grant) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <p>Grant not found. Please select a valid grant to apply for.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>New Application</CardTitle>
          <CardDescription>
            Applying for: {grant.name} - {grant.organization}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your project budget" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Timeline</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Outline your project timeline..."
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Application...
                    </>
                  ) : (
                    'Create Application'
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
