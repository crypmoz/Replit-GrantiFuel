import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Copy, 
  Edit, 
  FileText,
  FileCheck, 
  FileQuestion, 
  Layout, 
  MoreVertical 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // Filter templates based on search term and type
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleCreateNew = () => {
    window.location.href = '/templates/new';
  };

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

  // Handle filter click
  const handleFilterClick = (type: string) => {
    setTypeFilter(type === typeFilter ? 'all' : type);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Templates</h1>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 mr-3 sm:mr-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search templates..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateNew} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={typeFilter === 'all' ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleFilterClick('all')}
        >
          All
        </Button>
        <Button 
          variant={typeFilter === 'proposal' ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleFilterClick('proposal')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Proposals
        </Button>
        <Button 
          variant={typeFilter === 'biography' ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleFilterClick('biography')}
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Biographies
        </Button>
        <Button 
          variant={typeFilter === 'question' ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleFilterClick('question')}
        >
          <FileQuestion className="h-4 w-4 mr-2" />
          Questions
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getTemplateIcon(template.type)}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                          {template.name}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.location.href = `/templates/${template.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/templates/${template.id}/duplicate`}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
                      {template.description || 'No description provided.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        {getTypeBadge(template.type)}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.createdAt ? format(new Date(template.createdAt.toString()), 'MMM d, yyyy') : 'Unknown date'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.location.href = `/templates/${template.id}`}
                    >
                      Preview
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => window.location.href = `/applications/new?templateId=${template.id}`}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                  <Layout className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No templates found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || typeFilter !== 'all'
                    ? "No templates match your criteria"
                    : "You haven't created any templates yet"}
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
