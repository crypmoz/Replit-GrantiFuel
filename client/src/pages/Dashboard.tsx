import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import StatsCard from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import RecentActivities from '@/components/dashboard/RecentActivities';
import ApplicationProgress from '@/components/dashboard/ApplicationProgress';
import { OnboardingProgress } from '@/components/dashboard/OnboardingProgress';
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

  // Filter functionality will be implemented later

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <Button className="inline-flex items-center" size="sm" asChild>
              <Link to="/grants/new">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Grant
              </Link>
            </Button>
            <Button variant="outline" className="inline-flex items-center" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active Grants"
            value={isLoading ? "Loading..." : stats.activeGrants}
            icon={<DollarSign className="h-6 w-6" />}
            iconBgColor="bg-primary-50 dark:bg-primary-900"
            iconColor="text-primary-500 dark:text-primary-400"
            viewAllHref="/grants"
          />
          
          <StatsCard
            title="Approved Applications"
            value={isLoading ? "Loading..." : stats.approvedApplications}
            icon={<CheckCircle className="h-6 w-6" />}
            iconBgColor="bg-green-50 dark:bg-green-900"
            iconColor="text-green-500 dark:text-green-400"
            viewAllHref="/applications?status=approved"
          />
          
          <StatsCard
            title="Pending Applications"
            value={isLoading ? "Loading..." : stats.pendingApplications}
            icon={<Clock className="h-6 w-6" />}
            iconBgColor="bg-yellow-50 dark:bg-yellow-900"
            iconColor="text-yellow-500 dark:text-yellow-400"
            viewAllHref="/applications?status=pending"
          />
          
          <StatsCard
            title="Rejected Applications"
            value={isLoading ? "Loading..." : stats.rejectedApplications}
            icon={<XCircle className="h-6 w-6" />}
            iconBgColor="bg-red-50 dark:bg-red-900"
            iconColor="text-red-500 dark:text-red-400"
            viewAllHref="/applications?status=rejected"
          />
        </div>
      </div>

      {/* Main Dashboard Content - Reorganized for better priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column - High Priority Items (AI Assistant, Application Progress) */}
        <div className="lg:col-span-3 lg:order-1 space-y-6">
          <AIAssistant />
          <ApplicationProgress />
          <OnboardingProgress />
        </div>
        
        {/* Center & Right - Core Content */}
        <div className="lg:col-span-9 lg:order-2 space-y-6">
          {/* Upcoming Deadlines - Most time-sensitive information first */}
          <UpcomingDeadlines />
          
          {/* Recent Activities - Activity feed */}
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
