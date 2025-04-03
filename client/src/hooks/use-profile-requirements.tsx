import { useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useEffect } from 'react';

export interface ProfileRequirement {
  fieldName: string;
  importance: 'required' | 'recommended' | 'optional';
  description: string;
  examples?: string[];
}

export function useProfileRequirements() {
  const { toast } = useToast();

  const {
    data: profileRequirements,
    isLoading,
    error,
    refetch
  } = useQuery<ProfileRequirement[]>({
    queryKey: ['/api/ai/profile-requirements'],
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/ai/profile-requirements', {
        signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch profile requirements');
      }
      
      const data = await res.json();
      return data.profileRequirements as ProfileRequirement[];
    },
    staleTime: 1000 * 60 * 60, // Keep data fresh for 1 hour
    retry: 1,
  });

  // Use an effect to handle errors instead of during render
  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to fetch profile requirements',
        description: (error as Error).message || 'Please try again later',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return {
    profileRequirements: profileRequirements || [],
    isLoading,
    error,
    refetch,
    
    // Helper function to get required fields
    getRequiredFields: () => {
      return (profileRequirements || [])
        .filter((req: ProfileRequirement) => req.importance === 'required')
        .map((req: ProfileRequirement) => req.fieldName);
    },
    
    // Helper function to get recommended fields
    getRecommendedFields: () => {
      return (profileRequirements || [])
        .filter((req: ProfileRequirement) => req.importance === 'recommended')
        .map((req: ProfileRequirement) => req.fieldName);
    },
    
    // Get a specific field requirement
    getFieldRequirement: (fieldName: string) => {
      return (profileRequirements || []).find(
        (req: ProfileRequirement) => req.fieldName.toLowerCase() === fieldName.toLowerCase()
      );
    },
    
    // Check if a field is required
    isFieldRequired: (fieldName: string) => {
      const req = (profileRequirements || []).find(
        (req: ProfileRequirement) => req.fieldName.toLowerCase() === fieldName.toLowerCase()
      );
      return req?.importance === 'required';
    }
  };
}