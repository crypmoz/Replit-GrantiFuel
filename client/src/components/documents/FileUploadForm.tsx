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
  const [useAI, setUseAI] = useState(userRole === 'admin');
  const isAdmin = userRole === 'admin';

  // Create a schema for AI-enabled admin uploads (only file required)
  const aiEnabledSchema = z.object({
    file: fileUploadSchema.shape.file,
    isPublic: fileUploadSchema.shape.isPublic,
    // Make other fields optional when AI is used
    title: z.string().optional(),
    content: z.string().optional(),
    type: z.enum(['grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload']).optional(),
    tags: z.string().optional(),
  });
  
  const form = useForm<FileUploadFormValues>({
    resolver: zodResolver(isAdmin && useAI ? aiEnabledSchema : fileUploadSchema),
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
        
        // If admin is using AI classification, only the file is required
        if (isAdmin && useAI) {
          formData.append('autoClassify', 'true');
          formData.append('isPublic', data.isPublic.toString());
          
          // Still add form data in case AI classification fails
          formData.append('title', data.title || '');
          formData.append('content', data.content || '');
          formData.append('type', data.type || 'user_upload');
          if (data.tags) {
            const tagsArray = data.tags.split(',').map(tag => tag.trim());
            formData.append('tags', JSON.stringify(tagsArray));
          } else {
            formData.append('tags', JSON.stringify([]));
          }
        } else {
          // Regular upload process
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
          formData.append('autoClassify', 'false');
        }
        
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
                  <FormLabel className="flex gap-2 items-center">
                    Title {isAdmin && useAI && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Auto-filled by AI</span>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter document title" 
                      disabled={isAdmin && useAI}
                      className={isAdmin && useAI ? "bg-muted/50 text-muted-foreground" : ""}
                    />
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
                  <FormLabel className="flex gap-2 items-center">
                    Document Type {isAdmin && useAI && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Auto-detected by AI</span>}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isAdmin && useAI}
                  >
                    <FormControl>
                      <SelectTrigger className={isAdmin && useAI ? "bg-muted/50 text-muted-foreground" : ""}>
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
                    {isAdmin && useAI 
                      ? "AI will automatically detect the document type."
                      : "Select the category that best describes this document."}
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
                  <FormLabel className="flex gap-2 items-center">
                    Summary {isAdmin && useAI && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Auto-generated by AI</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter a summary of the document content" 
                      className={`min-h-[100px] ${isAdmin && useAI ? "bg-muted/50 text-muted-foreground" : ""}`}
                      disabled={isAdmin && useAI}
                    />
                  </FormControl>
                  <FormDescription>
                    {isAdmin && useAI 
                      ? "AI will automatically generate a summary of the document content."
                      : "Provide a summary or description of the document's content."}
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
                  <FormLabel className="flex gap-2 items-center">
                    Tags {isAdmin && useAI && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Auto-generated by AI</span>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter comma-separated tags (e.g. jazz, funding, orchestra)" 
                      disabled={isAdmin && useAI}
                      className={isAdmin && useAI ? "bg-muted/50 text-muted-foreground" : ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {isAdmin && useAI 
                      ? "AI will automatically extract relevant tags from the document."
                      : "Tags help categorize and find documents. Separate with commas."}
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
            
            {isAdmin && (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                <FormControl>
                  <Checkbox
                    checked={useAI}
                    onCheckedChange={(checked) => {
                      setUseAI(!!checked);
                      
                      // If AI is enabled, we only need file and isPublic
                      // If it's disabled, all fields are required
                      if (checked) {
                        // Clear validation errors for fields AI will handle
                        form.clearErrors(['title', 'content', 'type', 'tags']);
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-primary font-semibold">Use AI Auto-Classification</FormLabel>
                  <FormDescription>
                    Let AI automatically extract document title, content, type and tags
                  </FormDescription>
                </div>
              </FormItem>
            )}
            
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