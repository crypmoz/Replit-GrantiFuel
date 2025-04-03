import { useState } from 'react';
import { format, isAfter, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Define the personalized grants response type
interface PersonalizedGrantsResponse {
  grants: (Grant & { matchScore?: number })[];
  isPersonalized: boolean;
  profileComplete: boolean;
  missingInfo?: 'artistProfile' | 'genres';
}

interface ApplicationStatus {
  [key: string]: {
    label: string;
    variant: "success" | "warning" | "info" | "destructive" | "default" | "secondary" | "outline" | "accent" | null | undefined;
  }
}

const applicationStatus: ApplicationStatus = {
  draft: { label: 'Draft', variant: 'secondary' },
  inProgress: { label: 'In Progress', variant: 'warning' },
  complete: { label: 'Complete', variant: 'success' },
  submitted: { label: 'Submitted', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  approved: { label: 'Approved', variant: 'success' },
};

export default function UpcomingDeadlines() {
  const [page, setPage] = useState(1);
  const [showExpired, setShowExpired] = useState(false);
  const itemsPerPage = 4;
  const { completeTask, hasCompletedTask } = useOnboarding();

  const { data: grantsResponse, isLoading } = useQuery<PersonalizedGrantsResponse | Grant[]>({
    queryKey: ['/api/grants'],
  });

  // Process the grants data based on the response format
  const grantsArray = Array.isArray(grantsResponse) 
    ? grantsResponse 
    : grantsResponse?.grants || [];

  // Safe function to mark first grant viewed
  const safeMarkGrantViewed = (grantId: number) => {
    try {
      if (!hasCompletedTask("first_grant_viewed")) {
        completeTask("first_grant_viewed", { grantId, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Error marking grant as viewed:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>
            Stay on top of important grant dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-gray-200 dark:bg-gray-700 h-10 w-10 rounded-md"></div>
                <div className="space-y-2 flex-1">
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

  // Filter grants based on deadline and sort by nearest deadline first
  const sortedGrants = grantsArray.length > 0
    ? [...grantsArray]
        .filter(grant => {
          // Skip grants with no deadline
          if (!grant.deadline) return false;
          
          // Convert deadline to Date object
          const deadlineDate = new Date(grant.deadline);
          
          // Skip invalid dates
          if (isNaN(deadlineDate.getTime())) return false;
          
          // If showExpired is true, include all grants with valid deadlines
          if (showExpired) return true;
          
          // Otherwise, only include grants with deadlines in the future
          const now = new Date();
          return isAfter(deadlineDate, now);
        })
        .sort((a, b) => {
          // Sort by deadline (nearest first)
          const dateA = new Date(a.deadline).getTime();
          const dateB = new Date(b.deadline).getTime();
          return dateA - dateB;
        })
    : [];

  // Calculate total pages
  const totalPages = Math.ceil((sortedGrants?.length || 0) / itemsPerPage);
  
  // Get current page items
  const currentItems = sortedGrants.slice(
    (page - 1) * itemsPerPage, 
    page * itemsPerPage
  );

  // Function to render deadline status text and color
  const getDeadlineStatus = (deadlineDate: Date) => {
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    
    if (isAfter(today, deadlineDate)) {
      return { 
        text: 'Expired', 
        className: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-900/30'
      };
    } else if (daysRemaining <= 3) {
      return { 
        text: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`, 
        className: 'text-red-600 dark:text-red-400 font-medium',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-900/30' 
      };
    } else if (daysRemaining <= 7) {
      return { 
        text: `${daysRemaining} days left`, 
        className: 'text-amber-600 dark:text-amber-400 font-medium',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-900/30'
      };
    } else {
      return { 
        text: `${daysRemaining} days left`, 
        className: 'text-muted-foreground font-medium',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        borderColor: 'border-gray-200 dark:border-gray-700'
      };
    }
  };

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarClock className="h-5 w-5 text-primary" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>
              Stay on top of important grant deadlines
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-expired-deadlines" 
              checked={showExpired} 
              onCheckedChange={(checked) => {
                console.log('UpcomingDeadlines: Setting showExpired to:', checked);
                setShowExpired(checked);
                // Force a re-render
                setPage(1); // Reset to page 1 when toggling
              }}
              className="scale-75"
            />
            <Label htmlFor="show-expired-deadlines" className="text-xs">
              Show expired
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((grant) => {
              const deadlineDate = new Date(grant.deadline);
              const deadlineStatus = getDeadlineStatus(deadlineDate);
              // Determine mock status based on deadline (would be real status in production)
              const daysToDeadline = differenceInDays(deadlineDate, new Date());
              let status = 'draft';
              if (daysToDeadline < 0) status = 'submitted';
              else if (daysToDeadline < 7) status = 'inProgress';
              else if (daysToDeadline < 14) status = 'draft';
              
              return (
                <div 
                  key={grant.id} 
                  className={cn(
                    "p-3 rounded-lg border border-l-4",
                    deadlineStatus.borderColor
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">
                        <Link 
                          to={`/grants/${grant.id}`} 
                          className="hover:text-primary hover:underline"
                          onClick={() => safeMarkGrantViewed(grant.id)}
                        >
                          {grant.name}
                        </Link>
                      </h4>
                      <p className="text-xs text-muted-foreground">{grant.organization}</p>
                    </div>
                    <Badge variant={applicationStatus[status].variant} className="text-xs">
                      {applicationStatus[status].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center text-xs">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(deadlineDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className={cn("text-xs font-medium", deadlineStatus.className)}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {deadlineStatus.text}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs px-2 hover:bg-primary/10"
                      asChild
                    >
                      <Link 
                        to={`/applications/new?grantId=${grant.id}`}
                        onClick={() => safeMarkGrantViewed(grant.id)}
                      >
                        Apply now
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No upcoming deadlines found.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                asChild
              >
                <Link to="/grants">Browse grants</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-center pt-0 border-t">
          <div className="flex items-center space-x-1">
            <Button
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
              variant="outline"
              size="icon"
              className="h-7 w-7"
            >
              <span className="sr-only">Previous</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                onClick={() => setPage(i + 1)}
                variant={page === i + 1 ? "default" : "outline"}
                size="icon"
                className="h-7 w-7"
              >
                <span>{i + 1}</span>
              </Button>
            ))}
            <Button
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page === totalPages}
              variant="outline"
              size="icon"
              className="h-7 w-7"
            >
              <span className="sr-only">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
