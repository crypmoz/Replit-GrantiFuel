import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  Copy, 
  Edit, 
  FileText,
  FileCheck, 
  FileQuestion, 
  Layout
} from 'lucide-react';
import { format } from 'date-fns';

export default function TemplateDetail() {
  // Get template ID from URL
  const [, params] = useRoute<{ id: string }>('/templates/:id');
  const templateId = params?.id ? parseInt(params.id) : null;
  
  const { toast } = useToast();
  
  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['/api/templates', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.json();
    }
  });
  
  // Get icon for template type
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'proposal':
        return <FileText className="h-6 w-6 text-primary-500" />;
      case 'biography':
        return <FileCheck className="h-6 w-6 text-blue-500" />;
      case 'question':
        return <FileQuestion className="h-6 w-6 text-yellow-500" />;
      default:
        return <Layout className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Get badge for template type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'proposal':
        return <Badge variant="default">Proposal</Badge>;
      case 'biography':
        return <Badge variant="info">Biography</Badge>;
      case 'question':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Question</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };
  
  // Copy template content to clipboard
  const copyToClipboard = () => {
    if (template) {
      navigator.clipboard.writeText(template.content).then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Template content has been copied to your clipboard",
        });
      }).catch(() => {
        toast({
          title: "Failed to copy",
          description: "There was an error copying to clipboard",
          variant: "destructive"
        });
      });
    }
  };
  
  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => window.history.back()} className="mb-6">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Templates
      </Button>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : template ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                {getTemplateIcon(template.type)}
                <span className="ml-3">{template.name}</span>
              </h1>
              <div className="flex items-center mt-2">
                {getTypeBadge(template.type)}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-3">
                  Created on {template.createdAt ? format(new Date(template.createdAt.toString()), 'MMMM d, yyyy') : 'Unknown date'}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = `/templates/${template.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  // For now, we'll simply add the content to a new application
                  // This would typically go to a new application form
                  const createApplication = async () => {
                    try {
                      // Get the first grant and artist as defaults
                      const [grantsRes, artistsRes] = await Promise.all([
                        fetch('/api/grants'),
                        fetch('/api/artists')
                      ]);
                      
                      const grants = await grantsRes.json();
                      const artists = await artistsRes.json();
                      
                      if (grants.length === 0 || artists.length === 0) {
                        throw new Error('No grants or artists available');
                      }
                      
                      const firstGrant = grants[0];
                      const firstArtist = artists[0];
                      
                      // Create a new application with the template content
                      const response = await fetch('/api/applications', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          grantId: firstGrant.id,
                          artistId: firstArtist.id,
                          status: 'draft',
                          progress: 25,
                          answers: {
                            proposal: template.content,
                            templateUsed: template.name
                          }
                        }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to create application');
                      }
                      
                      const newApplication = await response.json();
                      
                      // Create activity for using template
                      await fetch('/api/activities', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          userId: 1,
                          action: 'CREATED',
                          entityType: 'APPLICATION',
                          entityId: newApplication.id,
                          details: {
                            grantName: firstGrant.name,
                            artistName: firstArtist.name,
                            templateUsed: template.name
                          }
                        }),
                      });
                      
                      toast({
                        title: 'Application created',
                        description: `New application started using template: ${template.name}`,
                      });
                      
                      // Redirect to applications page
                      window.location.href = '/applications';
                      
                    } catch (error) {
                      console.error('Error creating application:', error);
                      toast({
                        title: 'Error creating application',
                        description: 'Failed to create a new application. Please try again.',
                        variant: 'destructive'
                      });
                    }
                  };
                  
                  createApplication();
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
          
          {template.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md whitespace-pre-wrap font-mono text-sm border border-gray-200 dark:border-gray-700 overflow-auto max-h-[500px]">
                {template.content}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Content
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
              <Layout className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Template not found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The template you're looking for does not exist or has been deleted
            </p>
            <Button onClick={() => window.location.href = '/templates'}>
              Back to Templates
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}