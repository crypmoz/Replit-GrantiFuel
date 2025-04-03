import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Define schema for batch upload (admin only)
const batchUploadSchema = z.object({
  isPublic: z.boolean().default(false),
  useAI: z.boolean().default(true),
  files: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "At least one file is required")
    .refine(
      (files) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        return Array.from(files).every(file => validTypes.includes(file.type));
      },
      "Only PDF, DOCX, and TXT files are allowed"
    )
    .refine(
      (files) => Array.from(files).every(file => file.size <= 10 * 1024 * 1024),
      "All files must be less than 10MB each"
    ),
});

type BatchUploadFormValues = z.infer<typeof batchUploadSchema>;

interface BatchUploadFormProps {
  onSuccess?: () => void;
}

export default function BatchUploadForm({ onSuccess }: BatchUploadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const form = useForm<BatchUploadFormValues>({
    resolver: zodResolver(batchUploadSchema),
    defaultValues: {
      isPublic: false,
      useAI: true,
    }
  });

  const batchUploadMutation = useMutation({
    mutationFn: async (data: BatchUploadFormValues) => {
      setIsSubmitting(true);
      setProgress(0);
      setUploadedCount(0);
      
      const files = Array.from(data.files);
      setTotalFiles(files.length);
      
      const results = [];
      
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setCurrentFile(file.name);
          
          // Create FormData for individual file upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('autoClassify', data.useAI.toString());
          formData.append('isPublic', data.isPublic.toString());
          formData.append('isBatchUpload', 'true');
          
          // Use fetch directly for FormData
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to upload ${file.name}: ${errorData.error || 'Unknown error'}`);
          }
          
          const result = await response.json();
          results.push(result);
          
          // Update progress
          setUploadedCount(i + 1);
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
        
        return { count: results.length, results };
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Upload Complete",
        description: `Successfully uploaded ${data.count} documents.`,
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
        title: "Batch Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: BatchUploadFormValues) => {
    batchUploadMutation.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Batch Upload Documents
        </CardTitle>
        <CardDescription>
          Upload multiple files at once to quickly populate the knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="files"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Select Files</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={(e) => onChange(e.target.files)}
                      className="h-24 pt-10"
                    />
                  </FormControl>
                  <FormDescription>
                    Select multiple PDF, DOCX, or TXT files (max 10MB each).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="useAI"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-primary font-semibold">Use AI Auto-Classification</FormLabel>
                    <FormDescription>
                      Let AI automatically extract document title, content, type and tags from each file
                    </FormDescription>
                  </div>
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
            
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading {currentFile}</span>
                  <span>{uploadedCount} of {totalFiles}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Batch...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <span>All files will be processed using the same settings. For more control, upload files individually.</span>
        </div>
      </CardFooter>
    </Card>
  );
}