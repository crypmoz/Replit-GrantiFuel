import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Activity } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity as ActivityIcon, CheckCircle, Edit, Plus, Check, FileText, Clock, User, ArrowRightCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export default function RecentActivities() {
  const { user } = useAuth();
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ActivityIcon className="h-5 w-5 text-primary" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Latest updates on your grant applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
    <Card className="shadow-sm border-muted h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ActivityIcon className="h-5 w-5 text-primary" />
          Recent Activities
        </CardTitle>
        <CardDescription>
          Latest updates on your grant applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showActivities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No recent activities to show. Start by creating an application!</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              asChild
            >
              <Link to="/applications/new">Create application</Link>
            </Button>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8" aria-label="Activity Timeline">
              {showActivities.map((activity, idx) => {
                // Modify the icon styling
                const iconSize = "h-4 w-4";
                const baseClasses = "h-7 w-7 rounded-full flex items-center justify-center";
                let bgColor = "";
                let borderColor = "";
                let iconColor = "text-white";
                
                switch (activity.action) {
                  case 'completed':
                    bgColor = "bg-green-500";
                    borderColor = "border-green-200 dark:border-green-900/30";
                    break;
                  case 'updated':
                    bgColor = "bg-amber-500";
                    borderColor = "border-amber-200 dark:border-amber-900/30";
                    break;
                  case 'created':
                    bgColor = "bg-blue-500";
                    borderColor = "border-blue-200 dark:border-blue-900/30";
                    break;
                  case 'submitted':
                    bgColor = "bg-violet-500";
                    borderColor = "border-violet-200 dark:border-violet-900/30";
                    break;
                  case 'received':
                    bgColor = "bg-teal-500";
                    borderColor = "border-teal-200 dark:border-teal-900/30";
                    break;
                  case 'reviewed':
                    bgColor = "bg-yellow-500";
                    borderColor = "border-yellow-200 dark:border-yellow-900/30";
                    break;
                  case 'deadline':
                    bgColor = "bg-red-500";
                    borderColor = "border-red-200 dark:border-red-900/30";
                    break;
                  default:
                    bgColor = "bg-gray-500";
                    borderColor = "border-gray-200 dark:border-gray-700";
                }
                
                // Get the appropriate icon
                let icon;
                switch (activity.action) {
                  case 'completed': icon = <CheckCircle className={iconSize} />; break;
                  case 'updated': icon = <Edit className={iconSize} />; break;
                  case 'created': icon = <Plus className={iconSize} />; break;
                  case 'received': icon = <Check className={iconSize} />; break;
                  case 'submitted': icon = <ArrowRightCircle className={iconSize} />; break;
                  case 'reviewed': icon = <FileText className={iconSize} />; break;
                  case 'deadline': icon = <Clock className={iconSize} />; break;
                  default: icon = <User className={iconSize} />;
                }
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-6">
                      {idx < showActivities.length - 1 && (
                        <span 
                          className="absolute top-3.5 left-3.5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700/50" 
                          aria-hidden="true"
                        ></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className={cn(
                          baseClasses, 
                          bgColor, 
                          iconColor,
                          "border", 
                          borderColor
                        )}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium">
                              {getActivityMessage(activity)}
                            </p>
                            <time 
                              className="text-xs text-muted-foreground whitespace-nowrap ml-2"
                              dateTime={typeof activity.createdAt === 'string' 
                                ? activity.createdAt 
                                : (activity.createdAt instanceof Date 
                                  ? activity.createdAt.toISOString() 
                                  : new Date().toISOString())}
                            >
                              {formatDistanceToNow(
                                typeof activity.createdAt === 'string' 
                                  ? new Date(activity.createdAt) 
                                  : (activity.createdAt instanceof Date 
                                    ? activity.createdAt 
                                    : new Date()
                                  ), 
                                { addSuffix: true }
                              )}
                            </time>
                          </div>
                          {activity.entityId && (
                            <Link 
                              to={getEntityLink(activity)} 
                              className="text-xs text-primary hover:underline inline-flex items-center"
                            >
                              View details
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {showActivities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-muted">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-xs"
              asChild
            >
              <Link to="/applications">
                View all activities
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
