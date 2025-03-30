import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define form schema for file upload
const fileUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.enum(['grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload']),
  tags: z.string().optional(),
  isPublic: z.boolean().default(false),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "File is required")
    .transform(files => files[0])
    .refine(
      (file) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        return validTypes.includes(file.type);
      },
      "Only PDF, DOCX, and TXT files are allowed"
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    ),
});

type FileUploadFormValues = z.infer<typeof fileUploadSchema>;

interface FileUploadFormProps {
  userRole: string;
  onSuccess?: () => void;
}

export default function FileUploadForm({ userRole, onSuccess }: FileUploadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FileUploadFormValues>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'user_upload',
      tags: '',
      isPublic: false,
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FileUploadFormValues) => {
      setIsSubmitting(true);
      
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('type', data.type);
        
        // Convert tags string to array and add to form data
        if (data.tags) {
          const tagsArray = data.tags.split(',').map(tag => tag.trim());
          formData.append('tags', JSON.stringify(tagsArray));
        } else {
          formData.append('tags', JSON.stringify([]));
        }
        
        formData.append('isPublic', data.isPublic.toString());
        
        // Use fetch directly for FormData
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload file');
        }
        
        return await response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
      
      // Reset form
      form.reset();
      
      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FileUploadFormValues) => {
    uploadMutation.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload a file to add to the knowledge base. Supported formats: PDF, DOCX, TXT.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter document title" />
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
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grant_info">Grant Information</SelectItem>
                      <SelectItem value="artist_guide">Artist Guide</SelectItem>
                      <SelectItem value="application_tips">Application Tips</SelectItem>
                      {userRole === 'admin' && (
                        <SelectItem value="admin_knowledge">Admin Knowledge</SelectItem>
                      )}
                      <SelectItem value="user_upload">User Upload</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the category that best describes this document.
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
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter a summary of the document content" 
                      className="min-h-[100px]" 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a summary or description of the document's content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter comma-separated tags (e.g. jazz, funding, orchestra)" 
                    />
                  </FormControl>
                  <FormDescription>
                    Tags help categorize and find documents. Separate with commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={(e) => onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a PDF, DOCX, or TXT file (max 10MB).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make Public</FormLabel>
                    <FormDescription>
                      Public documents can be seen by all users once approved
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}