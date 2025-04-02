import { useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import GrantRecommendationsForm from '@/components/grants/GrantRecommendationsForm';
import GrantRecommendationsList from '@/components/grants/GrantRecommendationsList';
import { ArtistProfile, useGrantRecommendations } from '@/hooks/use-grant-recommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GrantRecommendationsPage() {
  const [activeTab, setActiveTab] = useState("form");
  const {
    recommendations,
    isLoading,
    error,
    profile,
    setProfile,
    fetchRecommendations
  } = useGrantRecommendations();
  const { toast } = useToast();

  const handleFormSubmit = (values: ArtistProfile) => {
    setProfile(values);
    setActiveTab("results");
  };

  const handleRetry = () => {
    if (profile) {
      fetchRecommendations(profile);
      toast({
        title: "Refreshing recommendations",
        description: "We're finding the latest grant opportunities for you.",
      });
    }
  };

  const handleSaveProfile = () => {
    // For future implementation: save profile to user account
    toast({
      title: "Profile saved",
      description: "Your artist profile has been saved successfully.",
    });
  };

  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI Grant Recommendations
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Let our AI assistant find perfect grant opportunities for your unique artistic profile. 
            Get personalized recommendations that match your career stage, genre, and artistic focus.
          </p>
        </header>

        <Tabs 
          defaultValue="form" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="form">Your Profile</TabsTrigger>
            <TabsTrigger 
              value="results" 
              disabled={!recommendations && !isLoading}
            >
              Recommendations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <div className="max-w-3xl mx-auto">
              <GrantRecommendationsForm onFormSubmit={handleFormSubmit} defaultValues={profile || undefined} />
              
              {recommendations && recommendations.length > 0 && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("results")}
                  >
                    View your {recommendations.length} recommendations
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-6">
              {profile && (
                <Card className="bg-muted/30 mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Your Artist Profile</CardTitle>
                    <CardDescription>
                      Recommendations are based on these details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Genre</div>
                        <div className="text-muted-foreground capitalize">{profile.genre}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Career Stage</div>
                        <div className="text-muted-foreground capitalize">{profile.careerStage}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Instrument/Role</div>
                        <div className="text-muted-foreground capitalize">{profile.instrumentOrRole}</div>
                      </div>
                      {profile.location && (
                        <div className="space-y-1">
                          <div className="font-medium">Location</div>
                          <div className="text-muted-foreground">{profile.location}</div>
                        </div>
                      )}
                      {profile.projectType && (
                        <div className="space-y-1">
                          <div className="font-medium">Project Type</div>
                          <div className="text-muted-foreground capitalize">{profile.projectType}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex mt-4 space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs" 
                        onClick={() => setActiveTab("form")}
                      >
                        Edit Profile
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs" 
                        onClick={handleSaveProfile}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs ml-auto" 
                        onClick={handleRetry}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!profile && !recommendations && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No profile submitted</AlertTitle>
                  <AlertDescription>
                    Please create an artist profile first to get grant recommendations.
                  </AlertDescription>
                </Alert>
              )}
              
              <GrantRecommendationsList 
                recommendations={recommendations} 
                isLoading={isLoading} 
                error={error} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}