import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, XCircle, Lightbulb } from 'lucide-react';
import { Link } from 'wouter';
import StatsCard, { StatsCardProps } from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import AIAssistant from '@/components/dashboard/AIAssistant';
import ApplicationProgress from '@/components/dashboard/ApplicationProgress';
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to Grantaroo Music Assist, your grant application management platform
        </p>
      </div>

      {/* Upcoming Deadlines - Top Priority */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Main Content - Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Application Progress */}
        <div>
          <ApplicationProgress />
        </div>

        {/* Right Column - AI Assistant */}
        <div>
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
        </div>
      </div>
    </div>
  );
}