import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, CheckCircle, Clock, XCircle, Loader2, Info, 
  UserCircle, SparklesIcon, FileCheck, Edit, FileText,
  Download, ArrowRight
} from 'lucide-react';
import { Link } from 'wouter';
import StatsCard from '@/components/dashboard/StatsCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { Grant, Application, Artist } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingState, setLoadingState] = useState<'initial' | 'slow' | 'complete'>('initial');

  // Load non-AI dependent data first
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  // Load potentially slow AI-dependent data with a separate query
  const { data: grants, isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Load user artists
  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ['/api/artists/user'],
  });

  // Update loading progress
  useEffect(() => {
    // Start with 20% progress immediately
    setLoadingProgress(20);

    // If loading takes more than 5 seconds, mark as "slow"
    const slowTimer = setTimeout(() => {
      if (isLoadingGrants) {
        setLoadingState('slow');
        setLoadingProgress(50);
      }
    }, 5000);

    // If applications are loaded but grants are still loading, show 60% progress
    if (!isLoadingApplications && isLoadingGrants) {
      setLoadingProgress(60);
    }

    // When both are loaded, complete the progress
    if (!isLoadingApplications && !isLoadingGrants) {
      setLoadingProgress(100);
      setLoadingState('complete');
    }

    return () => clearTimeout(slowTimer);
  }, [isLoadingApplications, isLoadingGrants]);

  // Calculate stats
  const stats = {
    activeGrants: grants?.length || 0,
    approvedApplications: applications?.filter(app => app.status === 'approved').length || 0,
    pendingApplications: applications?.filter(app => ['draft', 'inProgress'].includes(app.status || '')).length || 0,
    rejectedApplications: applications?.filter(app => app.status === 'rejected').length || 0,
  };

  // Determine current step in the flow
  const hasProfile = artists && artists.length > 0;
  const hasApplications = applications && applications.length > 0;
  const hasCompletedApplications = applications?.some(app => app.progress && app.progress >= 80);
  
  let currentStep = 1;
  if (hasProfile) currentStep = 2;
  if (hasProfile && applications?.some(app => app.status === 'draft')) currentStep = 3;
  if (hasProfile && applications?.some(app => app.progress && app.progress > 30)) currentStep = 4;
  if (hasProfile && applications?.some(app => app.progress && app.progress > 50)) currentStep = 5;
  if (hasProfile && applications?.some(app => app.progress && app.progress > 70)) currentStep = 6;
  if (hasCompletedApplications) currentStep = 7;

  // Application process steps
  const steps = [
    { 
      id: 1, 
      title: "Create Artist Profile", 
      description: "Set up your artist profile with essential information",
      icon: <UserCircle className="h-6 w-6" />,
      url: "/profile",
      active: currentStep === 1
    },
    { 
      id: 2, 
      title: "Get Grant Recommendations", 
      description: "AI-powered grant suggestions based on your profile",
      icon: <SparklesIcon className="h-6 w-6" />,
      url: "/enhanced-application-flow",
      active: currentStep === 2
    },
    { 
      id: 3, 
      title: "Select Grants to Apply For", 
      description: "Choose which grants match your needs",
      icon: <CheckCircle className="h-6 w-6" />,
      url: "/enhanced-application-flow",
      active: currentStep === 3
    },
    { 
      id: 4, 
      title: "Complete Application Form", 
      description: "Fill out all required application fields",
      icon: <FileCheck className="h-6 w-6" />,
      url: hasApplications && applications[0]?.id ? `/application/${applications[0].id}` : "/applications",
      active: currentStep === 4
    },
    { 
      id: 5, 
      title: "AI-Generated Content", 
      description: "Get AI assistance with application content",
      icon: <FileText className="h-6 w-6" />,
      url: "/ai-assistant",
      active: currentStep === 5
    },
    { 
      id: 6, 
      title: "Review & Edit", 
      description: "Review and finalize your application",
      icon: <Edit className="h-6 w-6" />,
      url: hasApplications && applications[0]?.id ? `/application/${applications[0].id}` : "/applications",
      active: currentStep === 6
    },
    { 
      id: 7, 
      title: "Export & Submit", 
      description: "Export your application and submit to grant provider",
      icon: <Download className="h-6 w-6" />,
      url: hasApplications && applications[0]?.id ? `/application/${applications[0].id}` : "/applications",
      active: currentStep === 7
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to GrantiFuel Music Assist, your grant application platform
          </p>
        </div>
        <Link href="/enhanced-application-flow">
          <Button className="mt-3 sm:mt-0" size="sm">
            <span className="mr-2">Start New Application</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Loading Progress for AI-dependent content */}
      {loadingState !== 'complete' && isLoadingGrants && (
        <div className="mb-6">
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Loading dashboard data</p>
                    <p className="text-xs text-muted-foreground">
                      {loadingState === 'slow' ? 
                        "AI-powered grant recommendations are being processed..." :
                        "Preparing your personalized dashboard..."
                      }
                    </p>
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <Progress value={loadingProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New 7-Step Application Process */}
      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            Your 7-Step Application Process
            <Badge variant="outline" className="ml-2">New</Badge>
          </CardTitle>
          <CardDescription>
            Follow these steps to complete your grant application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-muted-foreground/20" />
              
              {steps.map((step, index) => (
                <div key={step.id} className="relative pl-10 pb-6">
                  <div className={`absolute left-0 flex items-center justify-center w-6 h-6 rounded-full ${
                    step.active ? 'bg-primary text-white' : 
                    step.id < currentStep ? 'bg-green-500 text-white' : 
                    'bg-muted-foreground/20 text-muted-foreground'
                  } text-xs font-bold`}>
                    {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${step.active ? 'text-primary font-semibold' : ''}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                    
                    <Link href={step.url}>
                      <Button 
                        variant={step.active ? "default" : (step.id < currentStep ? "outline" : "ghost")}
                        size="sm"
                        className="mt-2 sm:mt-0"
                        disabled={step.id > currentStep + 1}
                      >
                        {step.id === currentStep ? (
                          <>Current Step</>
                        ) : step.id < currentStep ? (
                          <>Review</>
                        ) : (
                          <>Go to Step</>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <div className="mb-8">
        <UpcomingDeadlines />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatsCard
          title="Active Grants"
          value={isLoadingGrants ? undefined : stats.activeGrants}
          icon={<DollarSign className="h-5 w-5" />}
          description="Available grants"
          variant="default"
          loading={isLoadingGrants}
        />
        <StatsCard
          title="In Progress"
          value={isLoadingApplications ? undefined : stats.pendingApplications}
          icon={<Clock className="h-5 w-5" />}
          description="Being worked on"
          variant="secondary"
          loading={isLoadingApplications}
        />
        <StatsCard
          title="Approved"
          value={isLoadingApplications ? undefined : stats.approvedApplications}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Successfully approved"
          variant="success"
          loading={isLoadingApplications}
        />
        <StatsCard
          title="Rejected"
          value={isLoadingApplications ? undefined : stats.rejectedApplications}
          icon={<XCircle className="h-5 w-5" />}
          description="Not approved"
          variant="destructive"
          loading={isLoadingApplications}
        />
      </div>

      {/* AI Assistant Card */}
      <Card className="shadow-sm border-muted mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          <CardDescription>
            Need help with your application? Our AI assistant can help you with proposals, questions, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIAssistant />
        </CardContent>
        <CardFooter className="pt-0">
          <Link href="/ai-assistant">
            <Button variant="outline">Open Full AI Assistant</Button>
          </Link>
          {loadingState === 'slow' && (
            <p className="text-xs text-muted-foreground ml-4 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              AI features are still loading in the background
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}