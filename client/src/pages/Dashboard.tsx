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

      {/* Upcoming Deadlines - Top Priority */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Stats Cards - Improved for mobile */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatsCard
          title="Active Grants"
          value={stats.activeGrants}
          icon={<DollarSign className="h-5 w-5" />}
          description="Available grants"
          variant="default"
        />
        <StatsCard
          title="In Progress"
          value={stats.pendingApplications}
          icon={<Clock className="h-5 w-5" />}
          description="Being worked on"
          variant="secondary"
        />
        <StatsCard
          title="Approved"
          value={stats.approvedApplications}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Successfully approved"
          variant="success"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejectedApplications}
          icon={<XCircle className="h-5 w-5" />}
          description="Not approved"
          variant="destructive"
        />
      </div>

      {/* Main Content - Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Application Progress */}
        <div>
          <ApplicationProgress />
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
          </Card>
        </div>
      </div>
    </div>
  );
}