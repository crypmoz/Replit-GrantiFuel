import { useState } from 'react';
import { format, isAfter, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApplicationStatus {
  [key: string]: {
    label: string;
    variant: "success" | "warning" | "info" | "destructive" | "default" | "secondary" | "outline" | "accent" | null | undefined;
  }
}

const applicationStatus: ApplicationStatus = {
  draft: { label: 'Draft', variant: 'info' },
  inProgress: { label: 'In Progress', variant: 'warning' },
  complete: { label: 'Complete', variant: 'success' },
  submitted: { label: 'Submitted', variant: 'secondary' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  approved: { label: 'Approved', variant: 'success' },
};

export default function UpcomingDeadlines() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const { data: grants, isLoading } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
  });

  if (isLoading) {
    return (
      <Card className="shadow rounded-lg mb-8">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Upcoming Deadlines</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stay on top of important dates for your grant applications.</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedGrants = grants
    ? [...grants].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
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
      return { text: 'Expired', className: 'text-red-600 dark:text-red-400' };
    } else if (daysRemaining <= 3) {
      return { text: `In ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`, className: 'text-red-600 dark:text-red-400 font-medium' };
    } else if (daysRemaining <= 7) {
      return { text: `In ${daysRemaining} days`, className: 'text-orange-600 dark:text-orange-400 font-medium' };
    } else {
      return { text: `In ${daysRemaining} days`, className: 'text-gray-600 dark:text-gray-400 font-medium' };
    }
  };

  return (
    <Card className="shadow rounded-lg mb-8">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Upcoming Deadlines</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Stay on top of important dates for your grant applications.</p>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Grant Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Organization</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Deadline</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {currentItems.length > 0 ? (
              currentItems.map((grant) => {
                const deadlineDate = new Date(grant.deadline);
                const deadlineStatus = getDeadlineStatus(deadlineDate);
                // Mock status for now - would come from application data in real app
                const status = Math.random() > 0.5 ? 'inProgress' : 'complete';
                
                return (
                  <tr key={grant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{grant.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{grant.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{grant.organization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${deadlineStatus.className}`}>
                        {deadlineStatus.text}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(deadlineDate, 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={applicationStatus[status].variant}>
                        {applicationStatus[status].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href={`/applications?grant=${grant.id}`} className="text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">Edit</a>
                      <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
                      <a href={`/grants/${grant.id}`} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">View</a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No upcoming deadlines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CardFooter className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{currentItems.length}</span> of <span className="font-medium">{sortedGrants.length}</span> results
          </div>
          {totalPages > 1 && (
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    variant={page === i + 1 ? "secondary" : "outline"}
                    size="sm"
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      page === i + 1 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300' 
                        : 'text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
