import { useQuery } from '@tanstack/react-query';
import { Application, Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, formatDistance } from 'date-fns';
import { Plus } from 'lucide-react';

interface ApplicationWithGrant extends Application {
  grant?: Grant;
}

export default function ApplicationProgress() {
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
  });

  const isLoading = isLoadingApplications || isLoadingGrants;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Application Progress</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your current applications.</p>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6">
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
        grant: grants?.find(g => g.id === app.grantId)
      }))
    : [];

  // Sort by progress (incomplete first)
  const sortedApplications = [...applicationsWithGrants].sort((a, b) => a.progress - b.progress);

  // Limit to top 3 for display
  const displayApplications = sortedApplications.slice(0, 3);

  // Mock applications when real data isn't available yet
  const mockApplications = [
    {
      id: 1,
      grantId: 1,
      progress: 75,
      startedAt: new Date('2023-06-15'),
      grant: {
        id: 1,
        name: 'Music Creation Grant',
        deadline: new Date('2023-06-30'),
        organization: 'National Arts Foundation',
        amount: '$10,000 - $25,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    },
    {
      id: 2,
      grantId: 2,
      progress: 15,
      startedAt: new Date('2023-06-26'),
      grant: {
        id: 2, 
        name: 'Recording Studio Fund',
        deadline: new Date('2023-07-11'),
        organization: 'Music Industry Association',
        amount: 'Up to $30,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    },
    {
      id: 3,
      grantId: 3,
      progress: 100,
      startedAt: new Date('2023-06-10'),
      grant: {
        id: 3,
        name: 'Touring Support Program',
        deadline: new Date('2023-07-04'),
        organization: 'City Arts Council',
        amount: '$5,000 - $15,000',
        description: '',
        requirements: '',
        createdAt: new Date()
      }
    }
  ];

  // Use real or mock data
  const activeApplications = displayApplications.length > 0 ? displayApplications : mockApplications;

  // Function to get the appropriate color class based on progress
  const getProgressColorClass = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 50) return "bg-primary-500";
    return "bg-blue-500";
  };

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Application Progress</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your current applications.</p>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        {activeApplications.map((app) => (
          <div key={app.id} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{app.grant?.name}</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">{app.progress}%</span>
            </div>
            <Progress value={app.progress} className="w-full h-2.5" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Started: {format(new Date(app.startedAt), 'MMM d, yyyy')}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Deadline: {format(new Date(app.grant?.deadline || new Date()), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-6">
          <Button 
            onClick={() => window.location.href = "/applications/new"}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
