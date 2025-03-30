import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Artist, Grant, Application } from "@shared/schema";
import Layout from "@/components/layout/Layout";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch user data
  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ["/api/grants"],
    queryFn: getQueryFn(),
  });

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    queryFn: getQueryFn(),
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    queryFn: getQueryFn(),
  });

  const { data: onboardingTasks, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: getQueryFn(),
  });

  const isLoading = isLoadingGrants || isLoadingArtists || isLoadingApplications || isLoadingOnboarding;

  // Calculate onboarding progress
  const completedTasks = onboardingTasks?.length || 0;
  const totalTasks = 10; // Total number of onboarding tasks
  const onboardingProgress = Math.min(Math.round((completedTasks / totalTasks) * 100), 100);

  const upcomingDeadlines = grants?.filter(grant => 
    new Date(grant.deadline) > new Date() && 
    new Date(grant.deadline) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // next 30 days
  ).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const recentActivity = applications?.filter(app => app.status === 'submitted')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name || user?.username || 'Artist'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Here's an overview of your music grant applications and opportunities.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/grants">
              <button className="btn-primary">
                Explore Grants
              </button>
            </Link>
            <Link href="/assistant">
              <button className="btn-secondary">
                AI Assistant
              </button>
            </Link>
          </div>
        </div>

        {/* Onboarding Progress */}
        {completedTasks < totalTasks && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Complete your profile setup
                </h2>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${onboardingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {completedTasks} of {totalTasks} tasks completed ({onboardingProgress}%)
                </p>
              </div>
              <Link href="/profile">
                <button className="btn-secondary">
                  Continue Setup
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Applications</h2>
              <span className="text-3xl font-bold text-purple-600">{applications?.length || 0}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Drafts</span>
                <span>{applications?.filter(a => a.status === 'draft').length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted</span>
                <span>{applications?.filter(a => a.status === 'submitted').length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>In Review</span>
                <span>{applications?.filter(a => a.status === 'in_review').length || 0}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/applications">
                <a className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                  View all applications →
                </a>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Artists</h2>
              <span className="text-3xl font-bold text-indigo-600">{artists?.length || 0}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Manage your artist profiles for grant applications.
            </p>
            <div className="mt-4">
              <Link href="/artists">
                <a className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                  View all artists →
                </a>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Grants</h2>
              <span className="text-3xl font-bold text-emerald-600">{grants?.length || 0}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Available grant opportunities for musicians.
            </p>
            <div className="mt-4">
              <Link href="/grants">
                <a className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                  Explore all grants →
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Upcoming Deadlines
            </h2>
            {isLoadingGrants ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 4).map((grant) => {
                  const daysLeft = Math.ceil((new Date(grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={grant.id} className="border-b dark:border-gray-700 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{grant.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{grant.organization}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          daysLeft <= 7 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </div>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(grant.deadline).toLocaleDateString()}
                        </span>
                        <Link href={`/grants/${grant.id}`}>
                          <a className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                            View details
                          </a>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines in the next 30 days</p>
                <Link href="/grants">
                  <a className="mt-2 inline-block text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                    View all grants
                  </a>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Recent Activity
            </h2>
            {isLoadingApplications ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((app) => {
                  const grant = grants?.find(g => g.id === app.grantId);
                  const artist = artists?.find(a => a.id === app.artistId);
                  return (
                    <div key={app.id} className="border-b dark:border-gray-700 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {artist?.name} - {grant?.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Application submitted
                          </p>
                        </div>
                        <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                          {app.status}
                        </div>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(app.submittedAt || app.startedAt).toLocaleDateString()}
                        </span>
                        <Link href={`/applications/${app.id}`}>
                          <a className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                            View details
                          </a>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">No recent application activity</p>
                <Link href="/applications/new">
                  <a className="mt-2 inline-block text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                    Start a new application
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Need help with your grant applications?</h2>
              <p className="text-purple-100">
                Our AI Assistant can help you draft compelling proposals, answer questions, and increase your chances of success.
              </p>
            </div>
            <Link href="/assistant">
              <button className="bg-white text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-md font-medium shadow-sm transition">
                Try AI Assistant
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}