import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import StatsCard from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import RecentActivities from '@/components/dashboard/RecentActivities';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { Grant, Application } from '@shared/schema';

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
    <div className="container mx-auto p-6">
      {/* Upcoming Deadlines - Moved to top */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Stats Cards - Right under deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Grants"
          value={stats.activeGrants}
          icon={<DollarSign className="h-4 w-4" />}
          description="Total active grants available"
        />
        <StatsCard
          title="Approved Applications"
          value={stats.approvedApplications}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Applications approved"
        />
        <StatsCard
          title="Pending Applications"
          value={stats.pendingApplications}
          icon={<Clock className="h-4 w-4" />}
          description="Applications in progress"
        />
        <StatsCard
          title="Rejected Applications"
          value={stats.rejectedApplications}
          icon={<XCircle className="h-4 w-4" />}
          description="Applications not approved"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Assistant - Left Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-lg shadow p-6">
            <AIAssistant />
          </div>
        </div>

        {/* Recent Activities - Right Column */}
        <div className="lg:col-span-9 space-y-6">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}