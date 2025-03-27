import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, XCircle, Lightbulb, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import StatsCard, { StatsCardProps } from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import RecentActivities from '@/components/dashboard/RecentActivities';
import AIAssistant from '@/components/dashboard/AIAssistant';
import ApplicationProgress from '@/components/dashboard/ApplicationProgress';
import { OnboardingProgress } from '@/components/dashboard/OnboardingProgress';
import { Grant, Application } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const isLoading = isLoadingGrants || isLoadingApplications;

  // Calculate stats
  const stats = {
    activeGrants: grants?.length || 0,
    approvedApplications: applications?.filter(app => app.status === 'approved').length || 0,
    pendingApplications: applications?.filter(app => ['draft', 'inProgress'].includes(app.status || '')).length || 0,
    rejectedApplications: applications?.filter(app => app.status === 'rejected').length || 0,
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to Grantaroo Music Assist, your grant application management platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Grants"
          value={stats.activeGrants}
          icon={<DollarSign className="h-5 w-5" />}
          description="Total active grants available"
          variant="default"
        />
        <StatsCard
          title="Applications In Progress"
          value={stats.pendingApplications}
          icon={<Clock className="h-5 w-5" />}
          description="Applications being worked on"
          variant="secondary"
        />
        <StatsCard
          title="Approved Applications"
          value={stats.approvedApplications}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Applications approved"
          variant="success"
        />
        <StatsCard
          title="Rejected Applications"
          value={stats.rejectedApplications}
          icon={<XCircle className="h-5 w-5" />}
          description="Applications not approved"
          variant="destructive"
        />
      </div>

      {/* Main Content Grid - 3 column on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - AI Assistant */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lightbulb className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get intelligent help with your applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIAssistant />
            </CardContent>
          </Card>
          
          <OnboardingProgress />
        </div>

        {/* Middle Column - Applications */}
        <div className="lg:col-span-4 xl:col-span-5 space-y-6">
          <ApplicationProgress />
          
          {/* Add Quick Actions */}
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Common tasks to help you get started</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto py-4 px-3 flex flex-col items-center justify-center">
                <Link to="/applications/new">
                  <Clock className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">New Application</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 px-3 flex flex-col items-center justify-center">
                <Link to="/grants">
                  <DollarSign className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Browse Grants</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 px-3 flex flex-col items-center justify-center">
                <Link to="/templates">
                  <CheckCircle className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Templates</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 px-3 flex flex-col items-center justify-center">
                <Link to="/documents">
                  <Activity className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Documents</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Deadlines and Activities */}
        <div className="lg:col-span-4 space-y-6">
          <UpcomingDeadlines />
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}