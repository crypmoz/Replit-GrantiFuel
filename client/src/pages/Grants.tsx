import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { useLocation, Link } from 'wouter';
import { useToast } from '../hooks/use-toast';

export default function Grants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const { data: grants, isLoading, error } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
    refetchOnMount: true,
    refetchOnFocus: true,
    refetchOnWindowFocus: true
  });

  // Show error toast if data fetching fails
  if (error) {
    console.error("Error fetching grants:", error);
    toast({
      title: "Error fetching grants",
      description: "There was a problem loading the grants. Please try again.",
      variant: "destructive",
    });
  }

  // Filter grants based on search term
  const filteredGrants = grants?.filter(grant => 
    grant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grant.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/grants/new');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Grants</h1>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 mr-3 sm:mr-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search grants..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateNew} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Grant
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredGrants && filteredGrants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGrants.map((grant) => (
                <Card key={grant.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{grant.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{grant.organization}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Amount: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{grant.amount}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Deadline: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {grant.deadline ? format(new Date(grant.deadline), 'MMM d, yyyy') : 'No deadline set'}
                      </span>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mt-2">
                        {grant.deadline && new Date(grant.deadline) > new Date() ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/grants/${grant.id}`)}>
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      asChild
                    >
                      <Link to={`/applications/new?grantId=${grant.id}`}>
                        Apply
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No grants found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm
                    ? `No grants matching "${searchTerm}"`
                    : "You haven't added any grants yet"}
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Grant
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}