import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Activity } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, Plus, Check } from 'lucide-react';

export default function RecentActivities() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Activities</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest updates on your grant applications.</p>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Icons for different activity types
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'completed':
        return (
          <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
            <CheckCircle className="h-5 w-5 text-white" />
          </span>
        );
      case 'updated':
        return (
          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
            <Edit className="h-5 w-5 text-white" />
          </span>
        );
      case 'created':
        return (
          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
            <Plus className="h-5 w-5 text-white" />
          </span>
        );
      case 'received':
        return (
          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
            <Check className="h-5 w-5 text-white" />
          </span>
        );
      default:
        return (
          <span className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
            <CheckCircle className="h-5 w-5 text-white" />
          </span>
        );
    }
  };

  // Mock activities when real data isn't available yet
  const mockActivities = [
    {
      id: 1,
      userId: 1,
      action: 'completed',
      entityType: 'application',
      entityId: 1,
      details: { name: 'Touring Support Program' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      userId: 2,
      action: 'updated',
      entityType: 'application',
      entityId: 2,
      details: { name: 'Music Creation Grant', user: 'Sarah Smith' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
    {
      id: 3,
      userId: 1,
      action: 'created',
      entityType: 'application',
      entityId: 3,
      details: { name: 'Recording Studio Fund' },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 4,
      userId: 1,
      action: 'received',
      entityType: 'confirmation',
      entityId: 4,
      details: { name: 'City Arts Grant' },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ];

  const displayActivities = activities?.length ? activities : mockActivities;

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Activities</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest updates on your grant applications.</p>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {displayActivities.map((activity, idx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx < displayActivities.length - 1 && (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.action === 'updated' && activity.details?.user 
                            ? `${activity.details.user} updated `
                            : ''
                          }
                          {activity.action === 'completed' && 'Completed application for '}
                          {activity.action === 'created' && 'Started new application for '}
                          {activity.action === 'received' && 'Received confirmation email for '}
                          <span className="font-medium">{activity.details?.name}</span>
                          {activity.action === 'updated' && ' application'}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time dateTime={typeof activity.createdAt === 'string' ? activity.createdAt : (activity.createdAt instanceof Date ? activity.createdAt.toISOString() : new Date().toISOString())}>
                          {formatDistanceToNow(typeof activity.createdAt === 'string' ? new Date(activity.createdAt) : (activity.createdAt instanceof Date ? activity.createdAt : new Date()), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/activities"}>
            View all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
