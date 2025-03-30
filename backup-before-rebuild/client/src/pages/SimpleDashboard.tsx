import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import { Link } from 'wouter';

export default function SimpleDashboard() {
  const { user } = useAuth();

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

  // Get in-progress applications
  const inProgressApplications = applications
    .filter((app: any) => app.status === 'in_progress' || app.status === 'draft' || app.status === 'pending')
    .slice(0, 3);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Hero Section */}
      <div className="mb-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl overflow-hidden">
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <h1 className="text-white font-bold mb-2">Welcome back, {user?.name || 'Friend'}!</h1>
          <p className="text-purple-100 text-lg mb-6 max-w-2xl">
            Track your grant applications, discover new opportunities, and get AI assistance with your music funding journey.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/applications/new">
              <a className="px-6 py-3 bg-white text-purple-700 rounded-lg font-medium shadow-md hover:shadow-lg transition duration-300">
                Start New Application
              </a>
            </Link>
            <Link href="/assistant">
              <a className="px-6 py-3 bg-purple-700 text-white rounded-lg font-medium shadow-md hover:bg-purple-800 transition duration-300">
                Ask AI Assistant
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-md card-hover">
          <h2 className="text-lg font-semibold mb-2 gradient-text">Pending Applications</h2>
          <p className="text-3xl font-bold text-purple-600">{stats.pendingApplications}</p>
          <div className="h-2 w-24 bg-gray-200 rounded-full mt-3">
            <div className="h-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">In review process</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md card-hover">
          <h2 className="text-lg font-semibold mb-2 gradient-text">Approved Applications</h2>
          <p className="text-3xl font-bold text-green-600">{stats.approvedApplications}</p>
          <div className="h-2 w-24 bg-gray-200 rounded-full mt-3">
            <div className="h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: '30%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Successfully funded</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md card-hover">
          <h2 className="text-lg font-semibold mb-2 gradient-text">Total Applications</h2>
          <p className="text-3xl font-bold text-indigo-600">{applications.length}</p>
          <div className="h-2 w-24 bg-gray-200 rounded-full mt-3">
            <div className="h-2 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" style={{ width: '80%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Created to date</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md card-hover">
          <h2 className="text-lg font-semibold mb-2 gradient-text">Available Grants</h2>
          <p className="text-3xl font-bold text-purple-600">{stats.totalGrants}</p>
          <div className="h-2 w-24 bg-gray-200 rounded-full mt-3">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Funding opportunities</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1 card-hover">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">Upcoming Deadlines</h2>
            <Link href="/grants">
              <a className="text-sm text-purple-600 hover:text-purple-800">View All →</a>
            </Link>
          </div>
          {upcomingDeadlines.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {upcomingDeadlines.map((grant: any) => (
                <li key={grant.id} className="py-4">
                  <div className="flex justify-between">
                    <p className="font-semibold text-gray-800">{grant.name}</p>
                    <p className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-md">
                      {new Date(grant.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{grant.organization}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Amount: {grant.amount || 'Varies'}</span>
                    <Link href={`/applications/new?grantId=${grant.id}`}>
                      <a className="text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 rounded-full hover:from-purple-700 hover:to-indigo-700">
                        Apply Now
                      </a>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-center">No upcoming deadlines to display</p>
              <Link href="/grants">
                <a className="mt-3 text-sm text-purple-600 hover:text-purple-800">
                  Browse available grants
                </a>
              </Link>
            </div>
          )}
        </div>

        {/* Application Progress */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 card-hover">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">Your Application Progress</h2>
            <Link href="/applications">
              <a className="text-sm text-purple-600 hover:text-purple-800">View All →</a>
            </Link>
          </div>
          {inProgressApplications.length > 0 ? (
            <div className="space-y-4">
              {inProgressApplications.map((app: any) => (
                <div key={app.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">{app.grantName || 'Grant Application'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-purple-600">
                          Progress: {app.progress || 0}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-purple-600">
                          {app.submittedAt ? 'Submitted' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
                      <div style={{ width: `${app.progress || 0}%` }} 
                           className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-indigo-600">
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Started: {new Date(app.startedAt).toLocaleDateString()}
                    </span>
                    <Link href={`/applications/${app.id}`}>
                      <a className="px-3 py-1 text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700">
                        Continue
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-center">You haven't started any applications yet</p>
              <Link href="/applications/new">
                <a className="mt-4 px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700">
                  Start Your First Application
                </a>
              </Link>
            </div>
          )}
        </div>

        {/* AI Assistant Quick Access */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-6 rounded-xl shadow-md lg:col-span-3 card-hover overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold text-white mb-2">AI Assistant</h2>
              <p className="text-indigo-100 max-w-xl">
                Get help with grant writing, application reviews, or expert advice for your music career funding journey.
              </p>
            </div>
            <Link href="/assistant">
              <a className="px-6 py-3 bg-white text-purple-700 rounded-lg font-medium shadow-lg hover:shadow-xl transition duration-300">
                Ask AI Assistant
              </a>
            </Link>
          </div>
          
          {/* Abstract background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M47.5,-61.7C59.9,-51.5,67.7,-35.2,71.1,-18.4C74.6,-1.6,73.6,15.8,66.9,30.2C60.1,44.7,47.7,56.3,33.5,64.3C19.3,72.3,3.2,76.7,-12.9,74.5C-29,72.4,-45.2,63.6,-56.7,50.4C-68.3,37.3,-75.3,19.7,-77.7,0.7C-80.1,-18.3,-77.9,-38.7,-67.2,-52.7C-56.4,-66.8,-37.1,-74.5,-19.3,-73.9C-1.6,-73.3,15.7,-64.4,29.8,-62.5C43.9,-60.6,54.9,-65.9,47.5,-61.7Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}