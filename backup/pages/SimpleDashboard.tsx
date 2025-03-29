import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import { Link } from 'wouter';

export default function SimpleDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: grants = [] } = useQuery({
    queryKey: ['/api/grants'],
    queryFn: async () => {
      const res = await fetch('/api/grants');
      if (!res.ok) throw new Error('Failed to fetch grants');
      return res.json();
    }
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    }
  });

  // Calculate statistics
  const stats = {
    pendingApplications: applications.filter((app: any) => app.status === 'pending').length,
    approvedApplications: applications.filter((app: any) => app.status === 'approved').length,
    rejectedApplications: applications.filter((app: any) => app.status === 'rejected').length,
    totalGrants: grants.length,
  };

  // Get upcoming deadlines
  const upcomingDeadlines = grants
    .filter((grant: any) => new Date(grant.deadline) > new Date())
    .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GrantiFuel Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Pending Applications</h2>
            <p className="text-3xl font-bold text-blue-600">{stats.pendingApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Approved Applications</h2>
            <p className="text-3xl font-bold text-green-600">{stats.approvedApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Rejected Applications</h2>
            <p className="text-3xl font-bold text-red-600">{stats.rejectedApplications}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Available Grants</h2>
            <p className="text-3xl font-bold text-purple-600">{stats.totalGrants}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Upcoming Deadlines</h2>
              <Link href="/grants">
                <a className="text-sm text-blue-600 hover:text-blue-800">View All</a>
              </Link>
            </div>
            {upcomingDeadlines.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingDeadlines.map((grant: any) => (
                  <li key={grant.id} className="py-3">
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-800">{grant.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(grant.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{grant.organization}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming deadlines</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Recent Applications</h2>
              <Link href="/applications">
                <a className="text-sm text-blue-600 hover:text-blue-800">View All</a>
              </Link>
            </div>
            {applications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {applications.slice(0, 3).map((app: any) => (
                  <li key={app.id} className="py-3">
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-800">{app.grantName || 'Grant Application'}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          app.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Not submitted'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recent applications</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}