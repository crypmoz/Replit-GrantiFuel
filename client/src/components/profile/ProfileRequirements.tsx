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
  Info,
  PenLine,
  Lightbulb,
  ArrowRight,
  FileText,
  TrendingUp
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
import { Progress } from "../../components/ui/progress";
import { cn } from "../../lib/utils";

interface ProfileRequirementsProps {
  completedFields: string[];
  onFieldClick?: (fieldName: string) => void;
}

export function ProfileRequirements({ 
  completedFields = [], 
  onFieldClick 
}: ProfileRequirementsProps) {
  const { profileRequirements, isLoading, error } = useProfileRequirements();
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'all'>('todo');
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Group requirements by importance
  const requiredFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'required');
  const recommendedFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'recommended');
  const optionalFields = profileRequirements.filter((r: ProfileRequirement) => r.importance === 'optional');
  
  // Calculate completion rates
  const requiredCompleted = requiredFields.filter((r: ProfileRequirement) => 
    completedFields.includes(r.fieldName)).length;
  const recommendedCompleted = recommendedFields.filter((r: ProfileRequirement) => 
    completedFields.includes(r.fieldName)).length;
  const optionalCompleted = optionalFields.filter((r: ProfileRequirement) => 
    completedFields.includes(r.fieldName)).length;
  
  const totalFields = profileRequirements.length;
  const totalCompleted = completedFields.length;
  
  // Calculate percentages for progress bars
  const requiredPercentage = requiredFields.length > 0 
    ? Math.round((requiredCompleted / requiredFields.length) * 100) 
    : 100;
  
  const totalPercentage = totalFields > 0
    ? Math.round((totalCompleted / totalFields) * 100)
    : 0;
  
  // Filter requirements based on active tab
  const filteredRequirements = [...profileRequirements].filter((r: ProfileRequirement) => {
    const isComplete = completedFields.includes(r.fieldName);
    if (activeTab === 'todo') return !isComplete;
    if (activeTab === 'completed') return isComplete;
    return true; // 'all' tab
  });
  
  // Sort requirements by importance and completion
  const sortedRequirements = [...filteredRequirements].sort((a: ProfileRequirement, b: ProfileRequirement) => {
    // First, prioritize by importance
    const importanceOrder: Record<string, number> = { required: 0, recommended: 1, optional: 2 };
    const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
    if (importanceDiff !== 0) return importanceDiff;
    
    // Then by completion status (incomplete items first) - only if we're viewing all items
    if (activeTab === 'all') {
      const aCompleted = completedFields.includes(a.fieldName);
      const bCompleted = completedFields.includes(b.fieldName);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    }
    
    // Finally, sort alphabetically by field name
    return a.fieldName.localeCompare(b.fieldName);
  });
  
  // If there are no profile requirements and we're not loading, don't render
  if (!isLoading && profileRequirements.length === 0) {
    return null;
  }

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'required':
        return <Badge variant="destructive" className="font-medium">Required</Badge>;
      case 'recommended':
        return <Badge variant="default" className="font-medium">Recommended</Badge>;
      case 'optional':
        return <Badge variant="outline" className="font-medium">Optional</Badge>;
      default:
        return null;
    }
  };

  const getCompletionIcon = (fieldName: string) => {
    const isCompleted = completedFields.includes(fieldName);
    
    if (isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
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
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Profile Strength
        </CardTitle>
        <CardDescription>
          Complete your profile to increase your grant match success rate
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Overall progress section */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium">Overall Progress</h4>
            <span className="text-sm font-medium">{totalPercentage}%</span>
          </div>
          <Progress value={totalPercentage} className="h-2.5 bg-gray-100 dark:bg-gray-800" />
          
          <div className="bg-muted/40 p-3 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive"></span>
                <span>Required ({requiredCompleted}/{requiredFields.length})</span>
              </div>
              <span className="font-medium">{requiredPercentage}%</span>
            </div>
            
            <div className="flex justify-between items-center text-sm mt-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>Recommended ({recommendedCompleted}/{recommendedFields.length})</span>
              </div>
              <span className="font-medium">
                {recommendedFields.length > 0 ? 
                  Math.round((recommendedCompleted / recommendedFields.length) * 100) : 0}%
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm mt-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground"></span>
                <span>Optional ({optionalCompleted}/{optionalFields.length})</span>
              </div>
              <span className="font-medium">
                {optionalFields.length > 0 ? 
                  Math.round((optionalCompleted / optionalFields.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Impact message */}
        {requiredFields.length > 0 && requiredCompleted < requiredFields.length && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
              Complete all <strong>required fields</strong> to increase your grant match rate by up to 70%
            </AlertDescription>
          </Alert>
        )}
        
        {/* Tab navigation */}
        <div className="flex border-b">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors", 
              activeTab === 'todo' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('todo')}
          >
            To Do ({totalFields - totalCompleted})
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors", 
              activeTab === 'completed' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({totalCompleted})
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors", 
              activeTab === 'all' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('all')}
          >
            All ({totalFields})
          </button>
        </div>
        
        {/* Empty state if no items match filter */}
        {sortedRequirements.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">
            {activeTab === 'todo' ? (
              <div className="space-y-2">
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
                <p className="font-medium">All done! Your profile is complete.</p>
                <p className="text-sm">You've completed all profile requirements.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Info className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">No fields completed yet</p>
                <p className="text-sm">Start completing your profile to see items here.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Requirements list */}
        {sortedRequirements.length > 0 && (
          <Accordion 
            type="multiple" 
            className="w-full" 
            defaultValue={
              // By default, expand the first unfinished required field
              sortedRequirements
                .filter(r => r.importance === 'required' && !completedFields.includes(r.fieldName))
                .slice(0, 1)
                .map(r => r.fieldName)
            }
          >
            {sortedRequirements.map((requirement: ProfileRequirement) => {
              const isCompleted = completedFields.includes(requirement.fieldName);
              
              return (
                <AccordionItem 
                  key={requirement.fieldName} 
                  value={requirement.fieldName}
                  className={cn(
                    "border-b last:border-b-0",
                    isCompleted && "bg-green-50/50 dark:bg-green-950/20"
                  )}
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2.5 text-left">
                        {getCompletionIcon(requirement.fieldName)}
                        <div>
                          <span className="font-medium block">{requirement.fieldName}</span>
                          <span className="text-xs text-muted-foreground">
                            {isCompleted ? "Completed" : "Incomplete"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getImportanceBadge(requirement.importance)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-0">
                    <div className="pl-9 pr-2">
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {requirement.description}
                      </p>
                      
                      {requirement.examples && requirement.examples.length > 0 && (
                        <div className="mb-3 bg-muted/30 p-2.5 rounded-md">
                          <p className="text-xs font-medium mb-1.5 flex items-center">
                            <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                            Examples:
                          </p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {requirement.examples.map((example: string, i: number) => (
                              <li key={i} className="leading-relaxed">{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {onFieldClick && (
                        <Button 
                          variant={isCompleted ? "outline" : "default"} 
                          size="sm" 
                          className="mt-1.5 w-full sm:w-auto" 
                          onClick={() => onFieldClick(requirement.fieldName)}
                        >
                          {isCompleted ? (
                            <>
                              <PenLine className="h-3.5 w-3.5 mr-1.5" />
                              Edit field
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                              Complete now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-0 border-t px-4 py-3">
        <div className="flex items-center text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Based on your uploaded grant documents
        </div>
        <Link href="/documents">
          <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 w-full sm:w-auto">
            Manage documents
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}