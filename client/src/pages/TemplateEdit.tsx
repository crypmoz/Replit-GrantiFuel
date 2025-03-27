import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Template } from '@shared/schema';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft,
  Save,
  Loader,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Template content is required"),
  type: z.string().min(1, "Template type is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TemplateEdit() {
  // Get template ID from URL
  const [, params] = useRoute<{ id: string }>('/templates/:id/edit');
  const templateId = params?.id ? parseInt(params.id) : null;
  const isNewTemplate = !templateId;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch template data if editing
  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['/api/templates', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.json();
    }
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "",
      type: "proposal",
    },
  });
  
  // Update form when template data is fetched
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        content: template.content,
        type: template.type,
      });
    }
  }, [template, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Determine whether to create or update
      const method = isNewTemplate ? 'POST' : 'PUT';
      const url = isNewTemplate ? '/api/templates' : `/api/templates/${templateId}`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      const savedTemplate = await response.json();
      
      // Create activity for the action
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Default user
          action: isNewTemplate ? 'CREATED' : 'UPDATED',
          entityType: 'TEMPLATE',
          entityId: savedTemplate.id,
          details: {
            templateName: values.name,
            templateType: values.type
          }
        }),
      });
      
      // Invalidate queries and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: `Template ${isNewTemplate ? 'created' : 'updated'} successfully`,
        description: `Your template "${values.name}" has been saved.`,
      });
      
      // Redirect to the template detail page
      window.location.href = `/templates/${savedTemplate.id}`;
      
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template. Please try again.');
      
      toast({
        title: "Error saving template",
        description: "There was a problem saving your template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => window.history.back()} className="mb-6">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isNewTemplate ? 'Create New Template' : 'Edit Template'}
      </h1>
      
      {isLoading && !isNewTemplate ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isNewTemplate ? 'Create New Template' : 'Edit Template'}</CardTitle>
            <CardDescription>
              Templates can be used as starting points for creating grant applications, artist bios, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a name for your template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="biography">Biography</SelectItem>
                            <SelectItem value="question">Question</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This determines how the template is categorized and used.
                        </FormDescription>
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a brief description of this template"
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Add context to help users understand when to use this template.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your template content here"
                          className="min-h-[300px] font-mono" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Content can include markdown formatting for richer text.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}