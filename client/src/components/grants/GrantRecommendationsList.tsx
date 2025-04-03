import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { GrantRecommendation } from "@/hooks/use-grant-recommendations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Bookmark, AlertCircle, ExternalLink, FileText } from "lucide-react";

interface GrantRecommendationsListProps {
  recommendations: GrantRecommendation[] | undefined | null;
  isLoading: boolean;
  error: Error | null;
}

export default function GrantRecommendationsList({
  recommendations,
  isLoading,
  error,
}: GrantRecommendationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full animate-pulse opacity-60">
            <CardHeader className="pb-2">
              <div className="h-7 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded w-full mb-3"></div>
              <div className="flex gap-2 mb-3">
                <div className="h-6 bg-muted rounded w-20"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading grant recommendations: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No grant recommendations found. Try adjusting your profile or check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">
        Found {recommendations.length} grant opportunities for you
      </div>
      
      <div className="space-y-6">
        {recommendations.map((grant) => (
          <Card key={grant.id} className="w-full overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{grant.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {grant.organization}
                  </CardDescription>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  <span>Deadline: {grant.deadline}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{grant.description}</p>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-sm font-medium">{grant.matchScore}%</span>
                </div>
                <Progress value={grant.matchScore} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    {grant.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Eligibility</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    {grant.eligibility.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center bg-secondary/30 px-4 py-2 rounded-md">
                <span className="text-lg font-bold text-primary mr-2">
                  {grant.amount}
                </span>
                <span className="text-sm text-muted-foreground">
                  in available funding
                </span>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between space-x-2 bg-muted/20 py-3">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
              <div className="space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={grant.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Website
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <a href={`/applications/new?grantId=${grant.id}`}>
                    <FileText className="h-4 w-4 mr-1" />
                    Apply Now
                  </a>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}