import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, XCircle, Lightbulb, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import StatsCard, { StatsCardProps } from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import AIAssistant from '@/components/dashboard/AIAssistant';
import ApplicationProgress from '@/components/dashboard/ApplicationProgress';
import { Grant, Application } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingState, setLoadingState] = useState<'initial' | 'slow' | 'complete'>('initial');
  const [activeTab, setActiveTab] = useState('general');

  // Load non-AI dependent data first
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  // Load potentially slow AI-dependent data with a separate query
  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
    // Increase timeout for this specific query
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update loading progress
  useEffect(() => {
    // Start with 20% progress immediately
    setLoadingProgress(20);

    // If loading takes more than 5 seconds, mark as "slow"
    const slowTimer = setTimeout(() => {
      if (isLoadingGrants) {
        setLoadingState('slow');
        setLoadingProgress(50);
      }
    }, 5000);

    // If applications are loaded but grants are still loading, show 60% progress
    if (!isLoadingApplications && isLoadingGrants) {
      setLoadingProgress(60);
    }

    // When both are loaded, complete the progress
    if (!isLoadingApplications && !isLoadingGrants) {
      setLoadingProgress(100);
      setLoadingState('complete');
    }

    return () => clearTimeout(slowTimer);
  }, [isLoadingApplications, isLoadingGrants]);

  // Calculate stats
  const stats = {
    activeGrants: grants?.length || 0,
    approvedApplications: applications?.filter(app => app.status === 'approved').length || 0,
    pendingApplications: applications?.filter(app => ['draft', 'inProgress'].includes(app.status || '')).length || 0,
    rejectedApplications: applications?.filter(app => app.status === 'rejected').length || 0,
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to GrantiFuel Music Assist, your grant application management platform
          </p>
        </div>
        <Link href="/progress">
          <button className="mt-3 sm:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center">
            <span className="mr-2">Track Your Progress</span>
            <span aria-hidden="true">→</span>
          </button>
        </Link>
      </div>

      {/* Loading Progress for AI-dependent content */}
      {loadingState !== 'complete' && isLoadingGrants && (
        <div className="mb-6">
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Loading dashboard data</p>
                    <p className="text-xs text-muted-foreground">
                      {loadingState === 'slow' ? 
                        "AI-powered grant recommendations are being processed..." :
                        "Preparing your personalized dashboard..."
                      }
                    </p>
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <Progress value={loadingProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Deadlines - Top Priority */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Stats Cards - Improved for mobile */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatsCard
          title="Active Grants"
          value={isLoadingGrants ? undefined : stats.activeGrants}
          icon={<DollarSign className="h-5 w-5" />}
          description="Available grants"
          variant="default"
          loading={isLoadingGrants}
        />
        <StatsCard
          title="In Progress"
          value={isLoadingApplications ? undefined : stats.pendingApplications}
          icon={<Clock className="h-5 w-5" />}
          description="Being worked on"
          variant="secondary"
          loading={isLoadingApplications}
        />
        <StatsCard
          title="Approved"
          value={isLoadingApplications ? undefined : stats.approvedApplications}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Successfully approved"
          variant="success"
          loading={isLoadingApplications}
        />
        <StatsCard
          title="Rejected"
          value={isLoadingApplications ? undefined : stats.rejectedApplications}
          icon={<XCircle className="h-5 w-5" />}
          description="Not approved"
          variant="destructive"
          loading={isLoadingApplications}
        />
      </div>

      {/* Main Content - Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Application Progress */}
        <div>
          {loadingState === 'slow' && isLoadingGrants ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Application Progress
                </CardTitle>
                <CardDescription>
                  Your application progress information is loading...
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  <Skeleton className="h-[125px] w-full rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ApplicationProgress />
          )}
        </div>

        {/* Right Column - AI Assistant (minimal design) */}
        <div>
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <AIAssistant />
            </CardContent>
            {loadingState === 'slow' && (
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                <p>
                  <InfoIcon className="h-3 w-3 inline mr-1" />
                  Some AI-powered features are still loading in the background
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}