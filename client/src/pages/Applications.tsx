import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Application, Grant, Artist } from '@shared/schema';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter,
  FileText,
  ArrowUpRight, 
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface ApplicationWithDetails extends Application {
  grant?: Grant;
  artist?: Artist;
}

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('startedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
  });

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  const isLoading = isLoadingApplications || isLoadingGrants || isLoadingArtists;

  // Combine applications with grant and artist data
  const applicationsWithDetails: ApplicationWithDetails[] = applications
    ? applications.map(app => ({
        ...app,
        grant: grants?.find(g => g.id === app.grantId),
        artist: artists?.find(a => a.id === app.artistId)
      }))
    : [];

  // Filter applications based on search term and status
  const filteredApplications = applicationsWithDetails.filter(app => {
    const matchesSearch = 
      app.grant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.artist?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Determine values to compare based on sort field
    switch (sortField) {
      case 'grantName':
        aValue = a.grant?.name || '';
        bValue = b.grant?.name || '';
        break;
      case 'artistName':
        aValue = a.artist?.name || '';
        bValue = b.artist?.name || '';
        break;
      case 'startedAt':
        aValue = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        bValue = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        break;
      case 'submittedAt':
        aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        break;
      case 'deadline':
        aValue = a.grant?.deadline ? new Date(a.grant.deadline).getTime() : 0;
        bValue = b.grant?.deadline ? new Date(b.grant.deadline).getTime() : 0;
        break;
      case 'progress':
        aValue = a.progress || 0;
        bValue = b.progress || 0;
        break;
      default:
        aValue = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        bValue = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    }

    // Compare values based on sort direction
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCreateNew = () => {
    window.location.href = '/applications/new';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="info">Draft</Badge>;
      case 'inProgress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inProgress':
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'draft':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Applications</h1>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 mr-3 sm:mr-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search applications..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={handleCreateNew} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardHeader className="pb-0">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {sortedApplications.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                    <tr>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer"
                        onClick={() => handleSort('grantName')}
                      >
                        <div className="flex items-center">
                          Grant
                          {getSortIcon('grantName')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer"
                        onClick={() => handleSort('artistName')}
                      >
                        <div className="flex items-center">
                          Artist
                          {getSortIcon('artistName')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer"
                        onClick={() => handleSort('startedAt')}
                      >
                        <div className="flex items-center">
                          Start Date
                          {getSortIcon('startedAt')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer"
                        onClick={() => handleSort('deadline')}
                      >
                        <div className="flex items-center">
                          Deadline
                          {getSortIcon('deadline')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer"
                        onClick={() => handleSort('progress')}
                      >
                        <div className="flex items-center">
                          Progress
                          {getSortIcon('progress')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {sortedApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {app.grant?.name || 'Unknown Grant'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {app.grant?.organization || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {app.artist?.name || 'Unknown Artist'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {app.startedAt ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(app.startedAt), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Not available</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {app.grant?.deadline ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(app.grant.deadline), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">No deadline</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-full mr-2">
                              <Progress value={app.progress} className="h-2" />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {app.progress}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(app.status || 'draft')}
                            <span className="ml-2">{getStatusBadge(app.status || 'draft')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            onClick={() => window.location.href = `/applications/${app.id}`}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No applications found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? "No applications match your search criteria"
                    : "You haven't created any applications yet"}
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Application
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
