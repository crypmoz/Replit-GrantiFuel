import { useProfileRequirements, ProfileRequirement } from "../../hooks/use-profile-requirements";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { 
  AlertCircle, 
  CheckCircle2,
  Circle,
  Info 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface ProfileRequirementsProps {
  completedFields: string[];
  onFieldClick?: (fieldName: string) => void;
}

export function ProfileRequirements({ 
  completedFields = [], 
  onFieldClick 
}: ProfileRequirementsProps) {
  const { profileRequirements, isLoading, error } = useProfileRequirements();
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Initially display only 3 requirements
  const displayRequirements = showAll 
    ? profileRequirements 
    : profileRequirements.slice(0, 3);
  
  // Group requirements by importance
  const requiredFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'required');
  const recommendedFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'recommended');
  const optionalFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'optional');
  
  // Calculate completion rates
  const requiredCompleted = requiredFields.filter((r: ProfileRequirement) => 
    completedFields.includes(r.fieldName)).length;
  const recommendedCompleted = recommendedFields.filter((r: ProfileRequirement) => 
    completedFields.includes(r.fieldName)).length;
  
  const requiredCompletionRate = requiredFields.length > 0 
    ? (requiredCompleted / requiredFields.length) * 100 
    : 100;
  
  // Sort requirements by importance and completion
  const sortedRequirements = [...profileRequirements].sort((a: ProfileRequirement, b: ProfileRequirement) => {
    // First, prioritize by importance
    const importanceOrder: Record<string, number> = { required: 0, recommended: 1, optional: 2 };
    const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
    if (importanceDiff !== 0) return importanceDiff;
    
    // Then by completion status (incomplete items first)
    const aCompleted = completedFields.includes(a.fieldName);
    const bCompleted = completedFields.includes(b.fieldName);
    return aCompleted === bCompleted ? 0 : (aCompleted ? 1 : -1);
  });
  
  // If there are no profile requirements and we're not loading, don't render
  if (!isLoading && profileRequirements.length === 0) {
    return null;
  }

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'required':
        return <Badge variant="destructive">Required</Badge>;
      case 'recommended':
        return <Badge variant="default">Recommended</Badge>;
      case 'optional':
        return <Badge variant="outline">Optional</Badge>;
      default:
        return null;
    }
  };

  const getCompletionIcon = (fieldName: string) => {
    const isCompleted = completedFields.includes(fieldName);
    
    if (isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    } else {
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load profile requirements. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Profile Completion Guide
        </CardTitle>
        <CardDescription>
          Complete these fields to improve your grant matching and application success
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {requiredFields.length > 0 && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-medium">
              {requiredCompleted === requiredFields.length
                ? "All required fields completed!"
                : `${requiredCompleted}/${requiredFields.length} required fields completed`}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {requiredCompleted === requiredFields.length
                ? "You've completed all required profile fields."
                : "Complete all required fields for better grant matches."}
            </AlertDescription>
          </Alert>
        )}
        
        <Accordion type="single" collapsible className="w-full" value={expanded || undefined} 
          onValueChange={(value) => setExpanded(value)}>
          {sortedRequirements.map((requirement: ProfileRequirement) => (
            <AccordionItem key={requirement.fieldName} value={requirement.fieldName}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    {getCompletionIcon(requirement.fieldName)}
                    <span className="font-medium">{requirement.fieldName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImportanceBadge(requirement.importance)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-7 pr-4 pb-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    {requirement.description}
                  </p>
                  
                  {requirement.examples && requirement.examples.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Examples:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground">
                        {requirement.examples.map((example: string, i: number) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {onFieldClick && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3" 
                      onClick={() => onFieldClick(requirement.fieldName)}
                    >
                      {completedFields.includes(requirement.fieldName) 
                        ? "Update field" 
                        : "Complete field"}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {profileRequirements.length > 3 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show fewer fields" : `Show all ${profileRequirements.length} fields`}
          </Button>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground italic">
          These requirements are extracted from grant documents by AI
        </p>
        <Link href="/documents">
          <Button variant="link" size="sm" className="h-auto p-0">
            View all documents
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}