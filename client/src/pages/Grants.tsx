import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Grant, GrantWithAIRecommendation } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, RefreshCw, Trash2, AlertTriangle, UserPlus, FileText, UserRoundCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { useLocation, Link } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { useAuth } from '../hooks/use-auth';
import { AdminGuard } from '../components/auth/RoleGuard';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// Define types for the personalized grants response
interface PersonalizedGrantsResponse {
  grants: GrantWithAIRecommendation[];
  isPersonalized: boolean;
  profileComplete: boolean;
  missingInfo?: 'artistProfile' | 'genres';
  aiEnhanced?: boolean;
}

export default function Grants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [grantToDelete, setGrantToDelete] = useState<GrantWithAIRecommendation | null>(null);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: grantsResponse, isLoading, error, refetch } = useQuery<PersonalizedGrantsResponse | GrantWithAIRecommendation[]>({
    queryKey: ['/api/grants'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    enabled: true,
    staleTime: 0, // Don't use cached data
    gcTime: 1000, // Keep data in cache for 1 second
    refetchInterval: 0
  });
  
  // Process the response to get the grants array and metadata
  const grants = Array.isArray(grantsResponse) ? grantsResponse : grantsResponse?.grants || [];
  const isPersonalized = !Array.isArray(grantsResponse) && grantsResponse?.isPersonalized;
  const profileComplete = !Array.isArray(grantsResponse) && grantsResponse?.profileComplete;
  const missingInfo = !Array.isArray(grantsResponse) ? grantsResponse?.missingInfo : undefined;
  const aiEnhanced = !Array.isArray(grantsResponse) && grantsResponse?.aiEnhanced;
  
  // Delete mutation for grants (admin only)
  const deleteGrantMutation = useMutation({
    mutationFn: async (grantId: number) => {
      const response = await apiRequest('DELETE', `/api/grants/${grantId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete grant');
      }
      return grantId;
    },
    onSuccess: () => {
      // Invalidate the grants query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/grants'] });
      toast({
        title: "Grant Deleted",
        description: "The grant has been successfully deleted.",
      });
      setGrantToDelete(null);
    },
    onError: (error: any) => {
      console.error("Error deleting grant:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "There was a problem deleting the grant.",
        variant: "destructive",
      });
    }
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
  
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Grants Refreshed",
        description: "The grants list has been updated.",
      });
    } catch (err) {
      console.error("Error refreshing grants:", err);
      toast({
        title: "Refresh Failed",
        description: "There was a problem refreshing the grants list.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Grants</h1>
        <div className="flex space-x-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 mr-2 sm:mr-0">
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
          <Button variant="outline" onClick={handleRefresh} className="flex items-center" size="icon" title="Refresh grants list">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Grant
          </Button>
        </div>
      </div>
      
      {/* Profile completion alert */}
      {user && missingInfo && (
        <Alert className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <UserPlus className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Complete your profile for personalized grants</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            {missingInfo === 'artistProfile' ? (
              <>
                Create an artist profile to get personalized grant recommendations. 
                <Button variant="link" className="text-amber-600 dark:text-amber-400 p-0 h-auto" asChild>
                  <Link to="/artists/new">Create your profile now</Link>
                </Button>
              </>
            ) : (
              <>
                Add your music genres to get personalized grant recommendations.
                <Button variant="link" className="text-amber-600 dark:text-amber-400 p-0 h-auto" asChild>
                  <Link to="/profile">Update your profile</Link>
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Personalization indicator */}
      {user && isPersonalized && profileComplete && (
        <Alert className={`mb-6 ${aiEnhanced ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/30' : 'border-green-300 bg-green-50 dark:bg-green-950/30'}`}>
          {aiEnhanced ? (
            <>
              <FileText className="h-4 w-4 text-purple-500" />
              <AlertTitle className="text-purple-700 dark:text-purple-400">AI-enhanced grant recommendations</AlertTitle>
              <AlertDescription className="text-purple-700 dark:text-purple-400">
                These grants are intelligently matched to your artist profile using AI. Recommendations with a higher match score are most relevant to your profile and career goals.
              </AlertDescription>
            </>
          ) : (
            <>
              <UserRoundCheck className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 dark:text-green-400">Personalized grants for you</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                These grants are tailored to match your artist profile.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

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
                <Card 
                  key={grant.id} 
                  className={`hover:shadow-md transition-shadow ${grant.aiRecommended 
                    ? 'border-purple-200 dark:border-purple-800/40' 
                    : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{grant.name}</h3>
                      {grant.aiRecommended && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded-sm">
                          AI
                        </span>
                      )}
                    </div>
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
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="mt-2">
                        {grant.deadline && new Date(grant.deadline) > new Date() ? 'Active' : 'Closed'}
                      </Badge>
                      
                      {/* Show match score for personalized grants */}
                      {'matchScore' in grant && typeof grant.matchScore === 'number' && (
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${grant.aiRecommended 
                            ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400' 
                            : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
                          }`}
                        >
                          {`${grant.matchScore}% Match`}
                          {grant.aiRecommended && <span className="ml-1">✨</span>}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-between pt-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/grants/${grant.id}`)}>
                        View Details
                      </Button>
                      <AdminGuard>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                Delete Grant
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{grant.name}"? This action cannot be undone.
                                <p className="mt-2 font-medium text-gray-700 dark:text-gray-300">
                                  Any applications for this grant will be orphaned.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => deleteGrantMutation.mutate(grant.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </AdminGuard>
                    </div>
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