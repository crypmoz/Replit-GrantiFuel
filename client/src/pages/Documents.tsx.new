import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Document } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, 
  FileText, 
  Edit, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Eye, 
  Info, 
  Upload, 
  FileUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import FileUploadForm from '@/components/documents/FileUploadForm';

// Define form schema for document creation/editing
const documentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.enum(['grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload']),
  tags: z.string().optional(),
  isPublic: z.boolean().default(false),
  isApproved: z.boolean().default(false)
});

type DocumentFormValues = z.infer<typeof documentSchema>;

// Component to display individual document in a table row
const DocumentRow = ({ 
  document, 
  onEdit, 
  onDelete, 
  onApprove, 
  userRole
}: { 
  document: Document, 
  onEdit: (doc: Document) => void, 
  onDelete: (id: number) => void, 
  onApprove: (id: number) => void,
  userRole: string
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const typeLabels: Record<string, string> = {
    'grant_info': 'Grant Information',
    'artist_guide': 'Artist Guide',
    'application_tips': 'Application Tips',
    'admin_knowledge': 'Admin Knowledge',
    'user_upload': 'User Upload'
  };

  // Format created at date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{document.title}</TableCell>
      <TableCell>
        <Badge variant={document.type === 'admin_knowledge' ? 'destructive' : 'secondary'}>
          {typeLabels[document.type] || document.type}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(document.createdAt)}</TableCell>
      <TableCell>
        {document.isApproved ? (
          <Badge variant="success" className="bg-green-600">Approved</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </TableCell>
      <TableCell>
        {document.isPublic ? (
          <Badge variant="secondary">Public</Badge>
        ) : (
          <Badge variant="outline">Private</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:w-[600px] md:w-[900px]">
              <SheetHeader>
                <SheetTitle>{document.title}</SheetTitle>
                <SheetDescription>
                  Type: {typeLabels[document.type]} | 
                  Created: {formatDate(document.createdAt)} | 
                  {document.isApproved ? ' Approved' : ' Pending Approval'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap">{document.content}</pre>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button size="sm" variant="outline" onClick={() => onEdit(document)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button size="sm" variant="destructive" onClick={() => onDelete(document.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          
          {userRole === 'admin' && !document.isApproved && (
            <Button size="sm" variant="default" onClick={() => onApprove(document.id)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

// Document Form Component
const DocumentForm = ({ 
  defaultValues, 
  onSubmit, 
  userRole
}: { 
  defaultValues: DocumentFormValues, 
  onSubmit: (data: DocumentFormValues) => void,
  userRole: string 
}) => {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues
  });

  return (
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
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter document content" 
                  className="min-h-[200px]" 
                />
              </FormControl>
              <FormDescription>
                The content will be used by the AI assistant to provide accurate information.
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
        
        {userRole === 'admin' && (
          <FormField
            control={form.control}
            name="isApproved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Approve Document</FormLabel>
                  <FormDescription>
                    Approved documents can be used by the AI assistant
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}
        
        <DialogFooter>
          <Button type="submit">Save Document</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Main Documents Page Component
export default function Documents() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingDocument, setEditingDocument] = useState<DocumentFormValues & { id?: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Default values for new document
  const defaultValues: DocumentFormValues = {
    title: '',
    content: '',
    type: 'user_upload',
    tags: '',
    isPublic: false,
    isApproved: false
  };

  // Query documents
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/documents');
      const data = await res.json();
      return data;
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (newDocument: DocumentFormValues) => {
      // Convert tags string to array
      const tagsArray = newDocument.tags ? newDocument.tags.split(',').map(tag => tag.trim()) : [];
      
      const documentData = {
        ...newDocument,
        userId: user!.id,
        tags: tagsArray
      };
      
      const res = await apiRequest('POST', '/api/documents', documentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Created",
        description: "Your document has been created successfully.",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Document",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (updatedDocument: DocumentFormValues & { id: number }) => {
      const { id, ...data } = updatedDocument;
      
      // Convert tags string to array
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
      
      const documentData = {
        ...data,
        tags: tagsArray
      };
      
      const res = await apiRequest('PUT', `/api/documents/${id}`, documentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Updated",
        description: "Your document has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingDocument(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Document",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/documents/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Document",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Approve document mutation
  const approveDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/documents/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Approved",
        description: "The document has been approved successfully and can now be used by the AI assistant.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Approving Document",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (data: DocumentFormValues) => {
    if (editingDocument && editingDocument.id) {
      updateDocumentMutation.mutate({ ...data, id: editingDocument.id });
    } else {
      createDocumentMutation.mutate(data);
    }
  };

  // Handle edit document
  const handleEdit = (document: Document) => {
    // Convert tags array to string for the form
    const tagsString = document.tags ? document.tags.join(', ') : '';
    
    // Create a copy of the document with the proper structure for the form
    const formDocument = {
      id: document.id,
      title: document.title,
      content: document.content,
      type: document.type,
      tags: tagsString,
      isPublic: document.isPublic,
      isApproved: document.isApproved
    };
    
    setEditingDocument(formDocument);
    setIsDialogOpen(true);
  };

  // Close dialog and reset state
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <h2 className="text-lg font-semibold text-red-600">Error Loading Documents</h2>
        <p>{(error as Error).message}</p>
        <Button 
          className="mt-4" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/documents'] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Filter documents by type
  const textDocuments = documents.filter((doc: Document) => !doc.fileType || doc.fileType === 'none');
  const fileDocuments = documents.filter((doc: Document) => doc.fileType && doc.fileType !== 'none');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage your documents and knowledge base for the AI assistant
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDocument(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Document' : 'Create New Document'}
              </DialogTitle>
              <DialogDescription>
                {editingDocument 
                  ? 'Update the document details below.' 
                  : 'Add a new document to the knowledge base to help the AI assistant provide better answers.'}
              </DialogDescription>
            </DialogHeader>
            
            <DocumentForm 
              defaultValues={editingDocument || defaultValues} 
              onSubmit={handleSubmit}
              userRole={user?.role || 'user'}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4">
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Text Documents
            </TabsTrigger>
            <TabsTrigger value="uploads" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" /> File Uploads
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Base Documents</CardTitle>
                <CardDescription>
                  Documents that can be used by the AI assistant to provide accurate information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {textDocuments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {textDocuments.map((doc: Document) => (
                        <DocumentRow 
                          key={doc.id} 
                          document={doc} 
                          onEdit={handleEdit}
                          onDelete={(id) => deleteDocumentMutation.mutate(id)}
                          onApprove={(id) => approveDocumentMutation.mutate(id)}
                          userRole={user?.role || 'user'}
                        />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No documents found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start adding documents to build your knowledge base.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Your First Document
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mr-1" />
                  {user?.role === 'admin' 
                    ? 'As an admin, you can approve documents for use by the AI assistant.'
                    : 'Your documents will need approval before they can be used by the AI assistant.'}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="uploads">
            <div className="grid grid-cols-1 gap-6">
              <div className="col-span-1">
                <FileUploadForm 
                  userRole={user?.role || 'user'} 
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                    toast({
                      title: "File Uploaded",
                      description: "Your file has been uploaded and converted to a document successfully.",
                    });
                  }}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Files</CardTitle>
                  <CardDescription>
                    Files are automatically converted to searchable documents for the AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fileDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>File Type</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fileDocuments.map((doc: Document) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {doc.fileType?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {doc.isApproved ? (
                                <Badge variant="success" className="bg-green-600">Approved</Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {doc.filePath && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    asChild
                                  >
                                    <a href={`/uploads/documents/${doc.filePath}`} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                                
                                {user?.role === 'admin' && !doc.isApproved && (
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={() => approveDocumentMutation.mutate(doc.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center">
                      <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No files uploaded</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload PDF, DOCX, or TXT files to add to your knowledge base.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t p-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mr-1" />
                    Files are processed and their contents are extracted for use by the AI assistant.
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}