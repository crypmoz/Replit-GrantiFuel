import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Activity } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, Plus, Check, FileText, Clock, User, ArrowRightCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function RecentActivities() {
  const { user } = useAuth();
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle className="text-xl">Recent Activities</CardTitle>
          <CardDescription>Latest updates on your grant applications</CardDescription>
        </CardHeader>
        <CardContent>
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

  // Icons for different activity types with improved accessibility
  const getActivityIcon = (activity: Activity) => {
    const iconSize = "h-5 w-5";
    const baseClasses = "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800";
    
    let bgColor = "";
    let icon = null;
    let label = "";
    
    switch (activity.action) {
      case 'completed':
        bgColor = "bg-green-500";
        icon = <CheckCircle className={iconSize} aria-hidden="true" />;
        label = "Completed";
        break;
      case 'updated':
        bgColor = "bg-amber-500";
        icon = <Edit className={iconSize} aria-hidden="true" />;
        label = "Updated";
        break;
      case 'created':
        bgColor = "bg-blue-500";
        icon = <Plus className={iconSize} aria-hidden="true" />;
        label = "Created";
        break;
      case 'received':
        bgColor = "bg-teal-500";
        icon = <Check className={iconSize} aria-hidden="true" />;
        label = "Received";
        break;
      case 'submitted':
        bgColor = "bg-violet-500";
        icon = <ArrowRightCircle className={iconSize} aria-hidden="true" />;
        label = "Submitted";
        break;
      case 'reviewed':
        bgColor = "bg-yellow-500";
        icon = <FileText className={iconSize} aria-hidden="true" />;
        label = "Reviewed";
        break;
      case 'deadline':
        bgColor = "bg-red-500";
        icon = <Clock className={iconSize} aria-hidden="true" />;
        label = "Deadline";
        break;
      default:
        bgColor = "bg-gray-500";
        icon = <User className={iconSize} aria-hidden="true" />;
        label = "Activity";
    }
    
    return (
      <span className={`${baseClasses} ${bgColor} text-white`} aria-label={label}>
        {icon}
      </span>
    );
  };

  // Get activity entity link
  const getEntityLink = (activity: Activity) => {
    switch (activity.entityType) {
      case 'application':
        return `/applications/${activity.entityId}`;
      case 'grant':
        return `/grants/${activity.entityId}`;
      case 'artist':
        return `/artists/${activity.entityId}`;
      case 'template':
        return `/templates/${activity.entityId}`;
      case 'document':
        return `/documents#doc-${activity.entityId}`;
      default:
        return '#';
    }
  };

  // Format activity message
  const getActivityMessage = (activity: Activity) => {
    const entityName = activity.details && typeof activity.details === 'object' && 'name' in activity.details 
      ? activity.details.name as string 
      : 'Unknown';
    const entityType = activity.entityType.charAt(0).toUpperCase() + activity.entityType.slice(1);
    
    switch (activity.action) {
      case 'completed':
        return <>Completed <strong>{entityType}</strong>: {entityName}</>;
      case 'updated':
        return <>Updated <strong>{entityType}</strong>: {entityName}</>;
      case 'created':
        return <>Created new <strong>{entityType}</strong>: {entityName}</>;
      case 'received':
        return <>Received notification for <strong>{entityType}</strong>: {entityName}</>;
      case 'submitted':
        return <>Submitted <strong>{entityType}</strong>: {entityName}</>;
      case 'reviewed':
        return <>Reviewed <strong>{entityType}</strong>: {entityName}</>;
      case 'deadline':
        return <><span className="text-red-500 font-semibold">Upcoming deadline</span> for <strong>{entityType}</strong>: {entityName}</>;
      default:
        return <>{activity.action} <strong>{entityType}</strong>: {entityName}</>;
    }
  };

  // Mock activities when real data isn't available yet
  const mockActivities = [
    {
      id: 1,
      userId: user?.id || 1,
      action: 'completed',
      entityType: 'application',
      entityId: 1,
      details: { name: 'Touring Support Program' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      userId: user?.id || 1,
      action: 'updated',
      entityType: 'application',
      entityId: 2,
      details: { name: 'Music Creation Grant' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
    {
      id: 3,
      userId: user?.id || 1,
      action: 'created',
      entityType: 'application',
      entityId: 3,
      details: { name: 'Recording Studio Fund' },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 4,
      userId: user?.id || 1,
      action: 'deadline',
      entityType: 'grant',
      entityId: 2,
      details: { name: 'City Arts Grant' },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ] as Activity[];

  const displayActivities = activities?.length ? activities : mockActivities;
  
  // Show max 5 activities on dashboard
  const showActivities = displayActivities.slice(0, 5);

  return (
    <Card className="shadow h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Recent Activities
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm font-normal"
            asChild
          >
            <Link to="/applications">View applications</Link>
          </Button>
        </CardTitle>
        <CardDescription>Latest updates on your grant applications</CardDescription>
      </CardHeader>
      <CardContent>
        {showActivities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No recent activities to show. Start by creating an application!</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8" aria-label="Activity Timeline">
              {showActivities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx < showActivities.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        {getActivityIcon(activity)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-foreground">
                            {getActivityMessage(activity)}
                          </p>
                          {activity.entityId && (
                            <Link 
                              to={getEntityLink(activity)} 
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              View details
                            </Link>
                          )}
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
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
        )}
        
        {showActivities.length > 0 && (
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <Link to="/applications">
                View all applications
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
