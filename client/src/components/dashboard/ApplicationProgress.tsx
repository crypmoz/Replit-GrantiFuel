import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Application, Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, formatDistanceToNow } from 'date-fns';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Define the personalized grants response type
interface PersonalizedGrantsResponse {
  grants: (Grant & { matchScore?: number })[];
  isPersonalized: boolean;
  profileComplete: boolean;
  missingInfo?: 'artistProfile' | 'genres';
}

interface ApplicationWithGrant extends Application {
  grant?: Grant;
}

export default function ApplicationProgress() {
  const { user } = useAuth();
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: grantsResponse, isLoading: isLoadingGrants } = useQuery<PersonalizedGrantsResponse | Grant[]>({
    queryKey: ['/api/grants'],
  });

  const isLoading = isLoadingApplications || isLoadingGrants;

  // Process the grants data based on the response format
  console.log("Grants response:", grantsResponse);
  
  let grantsArray: Grant[] = [];
  if (grantsResponse) {
    if (Array.isArray(grantsResponse)) {
      grantsArray = grantsResponse;
    } else if (grantsResponse.grants && Array.isArray(grantsResponse.grants)) {
      grantsArray = grantsResponse.grants;
    }
  }
  
  console.log("Processed grants array:", grantsArray);

  if (isLoading) {
    return (
      <Card className="shadow mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Application Progress</CardTitle>
          <CardDescription>Track your current applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine applications with grant data
  const applicationsWithGrants: ApplicationWithGrant[] = applications
    ? applications.map(app => ({
        ...app,
        grant: grantsArray.find(g => g.id === app.grantId)
      }))
    : [];

  // Sort by deadline (closest deadlines first) and then by progress (incomplete first)
  const sortedApplications = [...applicationsWithGrants].sort((a, b) => {
    // If we have deadlines, sort by those first
    if (a.grant?.deadline && b.grant?.deadline) {
      return new Date(a.grant.deadline).getTime() - new Date(b.grant.deadline).getTime();
    }
    // Then sort by progress
    return a.progress - b.progress;
  });

  // Filter applications in progress (not 100% complete)
  const inProgressApplications = sortedApplications.filter(app => app.progress < 100);
  
  // Limit to top 3 for display
  const displayApplications = inProgressApplications.slice(0, 3);

  // Mock applications when real data isn't available yet
  const mockApplications = [
    {
      id: 1,
      userId: user?.id || 1,
      grantId: 1,
      status: 'inProgress',
      progress: 75,
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      grant: {
        id: 1,
        name: 'Music Creation Grant',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        organization: 'National Arts Foundation',
        amount: '$10,000 - $25,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    },
    {
      id: 2,
      userId: user?.id || 1,
      grantId: 2,
      status: 'draft',
      progress: 15,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      grant: {
        id: 2, 
        name: 'Recording Studio Fund',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        organization: 'Music Industry Association',
        amount: 'Up to $30,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    },
    {
      id: 3,
      userId: user?.id || 1,
      grantId: 3,
      status: 'inProgress',
      progress: 45,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      grant: {
        id: 3,
        name: 'Touring Support Program',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        organization: 'City Arts Council',
        amount: '$5,000 - $15,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    }
  ] as ApplicationWithGrant[];

  // Use real or mock data
  const activeApplications = displayApplications.length > 0 ? displayApplications : mockApplications;

  // Function to get the appropriate color class based on progress and deadline proximity
  const getProgressColor = (app: ApplicationWithGrant) => {
    // First check deadlines - if within 7 days, use warning colors
    if (app.grant?.deadline) {
      const daysToDeadline = Math.ceil((new Date(app.grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysToDeadline <= 3) {
        return "bg-red-600"; // Critical - less than 3 days
      }
      
      if (daysToDeadline <= 7) {
        return "bg-amber-500"; // Warning - less than a week
      }
    }
    
    // Then check progress
    if (app.progress >= 75) return "bg-green-500"; // Almost done
    if (app.progress >= 50) return "bg-primary-500"; // Good progress
    if (app.progress >= 25) return "bg-blue-500"; // Getting started
    return "bg-gray-500"; // Just started
  };

  // Get time remaining display with appropriate formatting
  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return <span className="text-red-500 font-medium">Past deadline</span>;
    }
    
    if (daysRemaining <= 3) {
      return <span className="text-red-500 font-medium">
        <AlertCircle className="inline h-3 w-3 mr-1" />
        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
      </span>;
    }
    
    if (daysRemaining <= 7) {
      return <span className="text-amber-500 font-medium">
        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
      </span>;
    }
    
    return <span>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>;
  };

  return (
    <Card className="shadow mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Application Progress
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm font-normal"
            asChild
          >
            <Link to="/grants">View grants</Link>
          </Button>
        </CardTitle>
        <CardDescription>Track your in-progress applications</CardDescription>
      </CardHeader>
      <CardContent>
        {activeApplications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No active applications. Start by creating one!</p>
          </div>
        ) : (
          activeApplications.map((app) => (
            <div key={app.id} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">
                  <Link to={`/applications/${app.id}`} className="hover:text-primary hover:underline">
                    {app.grant?.name}
                  </Link>
                </h4>
                <span className="text-sm">
                  {app.progress}% complete
                </span>
              </div>
              <Progress 
                value={app.progress} 
                className={`w-full h-2.5 ${getProgressColor(app)}`} 
                aria-label={`${app.progress}% complete on ${app.grant?.name}`}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  Started {formatDistanceToNow(new Date(typeof app.startedAt === 'string' ? app.startedAt : (app.startedAt instanceof Date ? app.startedAt : Date.now())), { addSuffix: true })}
                </span>
                <span>
                  {app.grant?.deadline ? (
                    getTimeRemaining(new Date(app.grant.deadline))
                  ) : (
                    "No deadline set"
                  )}
                </span>
              </div>
            </div>
          ))
        )}

        <div className="mt-6">
          <Button 
            className="w-full inline-flex items-center justify-center"
            asChild
          >
            <Link to="/applications/new">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
