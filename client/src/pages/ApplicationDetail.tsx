import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Application, Grant, Artist } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import MilestoneCelebration from '@/components/celebration/MilestoneCelebration';
import { 
  ChevronLeft, 
  Calendar,
  Clock,
  User,
  Building,
  Clipboard,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Send,
  Save,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

export default function ApplicationDetail() {
  // Get application ID from URL
  const [, params] = useRoute<{ id: string }>('/applications/:id');
  const applicationId = params?.id ? parseInt(params.id) : null;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [proposalContent, setProposalContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<number | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<{ 
    type: 'progress' | 'submission' | 'approval';
    value?: number;
    grantName?: string;
  } | null>(null);
  
  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery<Application>({
    queryKey: ['/api/applications', applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}`);
      if (!res.ok) throw new Error('Failed to fetch application');
      return res.json();
    }
  });
  
  // Fetch grant data
  const { data: grant, isLoading: isLoadingGrant } = useQuery<Grant>({
    queryKey: ['/api/grants', application?.grantId],
    enabled: !!application?.grantId,
    queryFn: async () => {
      const res = await fetch(`/api/grants/${application?.grantId}`);
      if (!res.ok) throw new Error('Failed to fetch grant');
      return res.json();
    }
  });
  
  // Fetch artist data
  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: ['/api/artists', application?.artistId],
    enabled: !!application?.artistId,
    queryFn: async () => {
      const res = await fetch(`/api/artists/${application?.artistId}`);
      if (!res.ok) throw new Error('Failed to fetch artist');
      return res.json();
    }
  });
  
  const isLoading = isLoadingApplication || isLoadingGrant || isLoadingArtist;
  
  // Initialize proposal content from application once data is loaded
  useEffect(() => {
    if (application?.answers && typeof application.answers === 'object') {
      const answers = application.answers as Record<string, any>;
      if (answers.proposal) {
        setProposalContent(answers.proposal);
      }
    }
  }, [application]);
  
  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Draft</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case 'submitted':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">{status}</Badge>;
    }
  };
  
  // Get status icon component
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
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
  
  // Format dates with fallback
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not available';
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Save application changes
  const handleSave = async () => {
    if (!application) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the answers object with the new proposal content
      const currentAnswers = application.answers as Record<string, any> || {};
      const updatedAnswers = {
        ...currentAnswers,
        proposal: proposalContent
      };
      
      // Calculate new progress based on content length
      const newProgress = Math.min(
        100, 
        proposalContent.length > 500 ? 75 : Math.max(25, proposalContent.length / 10)
      );
      
      // Update application status based on progress
      let newStatus = application.status;
      if (newProgress >= 75) {
        newStatus = 'in_progress';
      }
      
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: updatedAnswers,
          progress: newProgress,
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application');
      }
      
      // Create activity record
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Default user
          action: 'UPDATED',
          entityType: 'APPLICATION',
          entityId: applicationId,
          details: {
            applicationId,
            grantName: grant?.name,
            artistName: artist?.name
          }
        }),
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      
      toast({
        title: 'Application updated',
        description: 'Your changes have been saved successfully.',
      });
      
      // Exit edit mode
      setEditing(false);
      
    } catch (error) {
      console.error('Error updating application:', error);
      
      toast({
        title: 'Error updating application',
        description: 'Failed to save your changes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Submit application
  const handleSubmit = async () => {
    if (!application) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'submitted',
          progress: 100,
          submittedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit application');
      }
      
      // Create activity record
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Default user
          action: 'SUBMITTED',
          entityType: 'APPLICATION',
          entityId: applicationId,
          details: {
            applicationId,
            grantName: grant?.name,
            artistName: artist?.name
          }
        }),
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully.',
      });
      
    } catch (error) {
      console.error('Error submitting application:', error);
      
      toast({
        title: 'Error submitting application',
        description: 'Failed to submit your application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Extract answers from application
  const getApplicationAnswers = () => {
    if (!application?.answers) return {};
    
    if (typeof application.answers === 'string') {
      try {
        return JSON.parse(application.answers);
      } catch (e) {
        return {};
      }
    }
    
    return application.answers as Record<string, any>;
  };
  
  // Check for progress milestones
  useEffect(() => {
    if (!application || !grant) return;
    
    // First load - just store the current progress
    if (previousProgress === null) {
      setPreviousProgress(application.progress);
      return;
    }
    
    // Check if progress reached a milestone (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      // Trigger only when crossing a milestone threshold
      if (application.progress >= milestone && previousProgress < milestone) {
        setCurrentMilestone({
          type: 'progress',
          value: milestone,
          grantName: grant.name
        });
        setShowMilestone(true);
        break;
      }
    }
    
    // Check for submission milestone
    if (application.status === 'submitted' && application.submittedAt && !previousProgress) {
      setCurrentMilestone({
        type: 'submission',
        grantName: grant.name
      });
      setShowMilestone(true);
    }
    
    // Update previousProgress
    setPreviousProgress(application.progress);
  }, [application, grant, previousProgress]);
  
  const answers = getApplicationAnswers();
  
  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => window.history.back()} className="mb-6">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Applications
      </Button>
      
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : application && grant && artist ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center">
                <Award className="h-6 w-6 text-primary mr-2" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {grant.name}
                </h1>
              </div>
              
              <div className="flex items-center mt-2">
                {getStatusIcon(application.status || 'draft')}
                <span className="ml-2">{getStatusBadge(application.status || 'draft')}</span>
                
                <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Started on {formatDate(application.startedAt)}
                  </span>
                </div>
                
                {application.submittedAt && (
                  <>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center">
                      <Send className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted on {formatDate(application.submittedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              {application.status !== 'submitted' && (
                <>
                  {editing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditing(false)}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setProposalContent(answers.proposal || '');
                        setEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
                  {editing ? (
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={handleSubmit}
                      disabled={application.progress < 50 || isSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </Button>
                  )}
                </>
              )}
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Progress</CardTitle>
                  <CardDescription>
                    {application.progress < 25 ? 
                      "Just getting started! Complete more of your application to improve your chances." :
                      application.progress < 75 ? 
                      "Good progress! Continue developing your proposal to make it stronger." :
                      application.progress === 100 ?
                      "Your application is complete and has been submitted." :
                      "Almost there! Your application is nearly ready for submission."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{application.progress}%</span>
                    </div>
                    <Progress value={application.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Proposal</CardTitle>
                  {answers.templateUsed && (
                    <CardDescription>
                      Created using template: {answers.templateUsed}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea 
                      value={proposalContent}
                      onChange={(e) => setProposalContent(e.target.value)}
                      className="min-h-[400px] font-mono"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none">
                      {answers.proposal || 'No proposal content yet.'}
                    </div>
                  )}
                </CardContent>
                {editing && (
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grant Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Organization</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{grant.organization}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Amount</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{grant.amount}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Deadline</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(grant.deadline)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clipboard className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Requirements</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{grant.requirements}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Artist Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Name</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{artist.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Genres</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(artist.genres) ? (
                          artist.genres.map((genre, index) => (
                            <Badge key={index} variant="outline">{genre}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No genres specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <div className="font-medium">Bio</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{artist.bio}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => window.location.href = `/artists/${artist.id}`}
                  >
                    View Artist Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Application not found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The application you're looking for does not exist or has been deleted
            </p>
            <Button onClick={() => window.location.href = '/applications'}>
              Back to Applications
            </Button>
          </div>
        </Card>
      )}
      
      {/* Milestone celebration popup */}
      {currentMilestone && (
        <MilestoneCelebration
          isOpen={showMilestone}
          onClose={() => setShowMilestone(false)}
          milestone={currentMilestone}
        />
      )}
    </div>
  );
}