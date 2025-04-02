import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Grant } from '@shared/schema';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, DollarSign, Building, FileText } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';

export default function GrantDetail() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/grants/:id');
  const { toast } = useToast();
  
  const { data: grant, isLoading, error } = useQuery<Grant>({
    queryKey: [`/api/grants/${params?.id}`],
    enabled: !!params?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading grant",
        description: "There was a problem loading the grant details. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  useEffect(() => {
    if (grant) {
      console.log("Grant data:", grant);
      console.log("Grant deadline type:", typeof grant.deadline);
      console.log("Grant deadline value:", grant.deadline);
    }
  }, [grant]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button variant="ghost" className="pl-0" onClick={() => navigate('/grants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Grants
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button variant="ghost" className="pl-0" onClick={() => navigate('/grants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Grants
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Grant Not Found</h2>
            <p className="text-gray-500 mb-6">The grant you're looking for doesn't exist or may have been removed.</p>
            <Button onClick={() => navigate('/grants')}>
              Return to Grants
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Handle date display safely with fallbacks
  let deadlineDate: Date;
  let deadlineDisplay: string;
  let daysRemaining: number | null = null;
  let isActive = false;
  
  try {
    // Try different ways to parse the date
    if (grant.deadline instanceof Date) {
      deadlineDate = grant.deadline;
    } else if (typeof grant.deadline === 'string') {
      // Try ISO format first (most reliable)
      const parsedDate = parseISO(grant.deadline);
      
      if (isValid(parsedDate)) {
        deadlineDate = parsedDate;
      } else {
        // Fallback to standard Date constructor
        const dateObj = new Date(grant.deadline);
        if (isValid(dateObj)) {
          deadlineDate = dateObj;
        } else {
          // If all else fails, use a hardcoded future date for display
          console.warn("Invalid date format, using fallback date");
          deadlineDate = new Date(new Date().getFullYear() + 1, 0, 1); // Next year Jan 1
        }
      }
    } else {
      // If deadline is undefined or some other type
      console.warn("Deadline is missing or invalid type:", typeof grant.deadline);
      deadlineDisplay = "No deadline set";
      isActive = true;
      return; // Skip the rest of the date processing
    }
    
    // Format date for display
    deadlineDisplay = format(deadlineDate, 'MMMM d, yyyy');
    
    // Calculate if the grant is still active
    isActive = deadlineDate > new Date();
    
    // Calculate days remaining
    if (isActive) {
      daysRemaining = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch (error) {
    console.error("Error handling date:", error);
    // Fallback values if everything fails
    deadlineDate = new Date(new Date().getFullYear() + 1, 0, 1);
    deadlineDisplay = "Unknown";
    isActive = true;
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" className="pl-0" onClick={() => navigate('/grants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Grants
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{grant.name}</h1>
              <p className="text-gray-500">{grant.organization}</p>
            </div>
            <Badge variant={isActive ? "default" : "secondary"} className="self-start md:self-auto">
              {isActive ? 'Active' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Grant Amount</p>
                <p className="font-medium">{grant.amount}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Application Deadline</p>
                <p className="font-medium">{deadlineDisplay}</p>
                {deadlineDisplay !== "No deadline set" && (
                  <p className="text-sm text-gray-500">
                    {isActive 
                      ? `${daysRemaining} days remaining` 
                      : 'Deadline has passed'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium">{grant.organization}</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{grant.description}</p>
            </div>
            
            {grant.requirements && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Requirements</h2>
                <p className="text-gray-700 whitespace-pre-line">{grant.requirements}</p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate('/grants')}>
            Back to Grants
          </Button>
          <Button onClick={() => navigate(`/applications/new?grantId=${grant.id}`)}>
            Apply Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}