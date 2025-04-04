import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Artist, Grant, Application, GrantWithAIRecommendation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArtistProfileWizard } from "@/components/onboarding/ArtistProfileWizard";
import { EnhancedGrantRecommendations } from "@/components/grants/EnhancedGrantRecommendations";
import { EnhancedApplicationForm } from "@/components/applications/EnhancedApplicationForm";
import { MilestoneCelebration } from "@/components/celebration/MilestoneCelebration";

// The steps of our enhanced application flow
const flowSteps = [
  { id: "artist-profile", title: "Artist Profile", description: "Create or select artist profile" },
  { id: "grant-match", title: "Grant Matching", description: "Discover relevant grants" },
  { id: "application", title: "Application", description: "Complete application details" },
  { id: "ai-assist", title: "AI Assistance", description: "Enhance with AI suggestions" },
  { id: "review", title: "Review", description: "Review and finalize" },
  { id: "export", title: "Export", description: "Export application" },
];

export default function EnhancedApplicationFlow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Flow state management
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<GrantWithAIRecommendation | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  
  // Celebration modals
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationConfig, setCelebrationConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "achievement" | "milestone" | "completion",
  });
  
  // Check auth
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the application flow",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, navigate, toast]);
  
  // Mark step as complete and move to next step
  const completeStep = (step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
    setActiveStep(step + 1);
  };
  
  // Handle artist creation
  const handleArtistCreated = (artist: Artist) => {
    setArtistProfile(artist);
    
    // Show celebration
    setCelebrationConfig({
      title: "Artist Profile Created!",
      message: "Great job! Now let's find grants that match your profile.",
      type: "success",
    });
    setShowCelebration(true);
    
    // Mark step as complete
    completeStep(0);
  };
  
  // Handle grant selection
  const handleGrantSelected = (grant: GrantWithAIRecommendation) => {
    setSelectedGrant(grant);
    
    // Show celebration
    setCelebrationConfig({
      title: "Grant Selected!",
      message: "Excellent choice! Let's start your application for this grant.",
      type: "milestone",
    });
    setShowCelebration(true);
    
    // Mark step as complete
    completeStep(1);
  };
  
  // Handle application creation
  const handleApplicationCreated = (applicationId: number) => {
    // In a real app, we'd fetch the application details
    // For now, just create a placeholder
    setApplication({
      id: applicationId,
      userId: user?.id || 0,
      grantId: selectedGrant?.id || 0,
      artistId: artistProfile?.id || 0,
      status: "draft",
      progress: 30,
      answers: {},
      submittedAt: null,
      startedAt: new Date(),
    });
    
    // Show celebration
    setCelebrationConfig({
      title: "Application Started!",
      message: "Your application has been created. Let's enhance it with AI assistance.",
      type: "milestone",
    });
    setShowCelebration(true);
    
    // Mark step as complete
    completeStep(2);
  };
  
  // Handle AI enhancement completion
  const handleAiEnhancementComplete = () => {
    // Update application progress
    if (application) {
      setApplication({
        ...application,
        progress: 70,
      });
    }
    
    // Mark step as complete
    completeStep(3);
  };
  
  // Handle review completion
  const handleReviewComplete = () => {
    // Update application progress
    if (application) {
      setApplication({
        ...application,
        progress: 90,
      });
    }
    
    // Mark step as complete
    completeStep(4);
  };
  
  // Handle export completion
  const handleExportComplete = () => {
    // Update application
    if (application) {
      setApplication({
        ...application,
        progress: 100,
        status: "completed",
      });
    }
    
    // Show final celebration
    setCelebrationConfig({
      title: "Application Completed!",
      message: "Congratulations! Your application is ready to submit to the grant organization.",
      type: "completion",
    });
    setShowCelebration(true);
    
    // Mark step as complete
    completeStep(5);
  };
  
  // Close celebration modal and continue
  const handleCelebrationDismiss = () => {
    setShowCelebration(false);
  };
  
  // Extract artist profile data for AI recommendations
  const getArtistProfileForAi = () => {
    if (!artistProfile) return { genre: "", careerStage: "", instrumentOrRole: "" };
    
    return {
      genre: artistProfile.genres?.[0] || "",
      careerStage: artistProfile.careerStage || "",
      instrumentOrRole: artistProfile.primaryInstrument || "",
      location: artistProfile.location || undefined,
      projectType: artistProfile.projectType || undefined,
    };
  };
  
  // If not authenticated, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Enhanced Grant Application</h1>
        <p className="text-muted-foreground">
          Our AI-powered system helps you create compelling grant applications in less time.
        </p>
      </div>
      
      {/* Stepper */}
      <Stepper
        steps={flowSteps}
        activeStep={activeStep}
        completedSteps={completedSteps}
        className="mb-8"
      />
      
      {/* Step content */}
      <div className="mt-8">
        {/* Step 1: Artist Profile */}
        {activeStep === 0 && (
          <div className="space-y-6">
            <ArtistProfileWizard onArtistCreated={handleArtistCreated} />
          </div>
        )}
        
        {/* Step 2: Grant Matching */}
        {activeStep === 1 && artistProfile && (
          <div className="space-y-6">
            <EnhancedGrantRecommendations
              artistProfile={getArtistProfileForAi()}
              onSelectGrant={handleGrantSelected}
            />
          </div>
        )}
        
        {/* Step 3: Application Creation */}
        {activeStep === 2 && artistProfile && selectedGrant && (
          <div className="space-y-6">
            <EnhancedApplicationForm
              grant={selectedGrant}
              onApplicationCreated={handleApplicationCreated}
            />
          </div>
        )}
        
        {/* Step 4: AI Enhancement */}
        {activeStep === 3 && application && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Enhancement</CardTitle>
                <CardDescription>
                  Our AI will analyze your application and suggest improvements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This is a placeholder for the AI enhancement step. In a real implementation,
                  this would use the AI to analyze and enhance your application content.
                </p>
                <Button onClick={handleAiEnhancementComplete}>
                  Complete AI Enhancement
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Step 5: Review */}
        {activeStep === 4 && application && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Application</CardTitle>
                <CardDescription>
                  Review and make final edits to your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This is a placeholder for the review step. In a real implementation,
                  this would show the full application with editing capabilities.
                </p>
                <Button onClick={handleReviewComplete}>
                  Complete Review
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Step 6: Export */}
        {activeStep === 5 && application && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Application</CardTitle>
                <CardDescription>
                  Export your application in your preferred format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This is a placeholder for the export step. In a real implementation,
                  this would allow exporting to PDF, Word, etc.
                </p>
                <div className="flex gap-4">
                  <Button onClick={handleExportComplete}>
                    Export as PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportComplete}>
                    Export as Word
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Final step - Completed */}
        {activeStep === 6 && application && (
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Application Complete</CardTitle>
                <CardDescription>
                  Your application is ready for submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Congratulations! You've completed your application for {selectedGrant?.name}.
                  Submit your application directly to the grant organization using the exported document.
                </p>
                <div className="flex gap-4">
                  <Button onClick={() => navigate("/applications")}>
                    View My Applications
                  </Button>
                  <Button variant="outline" onClick={() => setActiveStep(0)}>
                    Start New Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Celebration Modals */}
      {showCelebration && (
        <MilestoneCelebration
          title={celebrationConfig.title}
          message={celebrationConfig.message}
          type={celebrationConfig.type}
          onDismiss={handleCelebrationDismiss}
          onContinue={handleCelebrationDismiss}
        />
      )}
    </div>
  );
}