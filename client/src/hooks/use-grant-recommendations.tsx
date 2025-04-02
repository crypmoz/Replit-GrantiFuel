import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface GrantRecommendation {
  id: string;
  name: string;
  organization: string;
  amount: string;
  deadline: string;
  description: string;
  requirements: string[];
  eligibility: string[];
  url: string;
  matchScore: number;
}

export interface ArtistProfile {
  genre: string;
  careerStage: string;
  instrumentOrRole: string;
  location?: string;
  projectType?: string;
}

export function useGrantRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);

  const {
    data: recommendations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/ai/grant-recommendations', profile],
    queryFn: async () => {
      if (!profile) return null;
      
      try {
        const res = await apiRequest('POST', '/api/ai/grant-recommendations', profile);
        const data = await res.json();
        return data.recommendations as GrantRecommendation[];
      } catch (error) {
        console.error('Error fetching grant recommendations:', error);
        throw error;
      }
    },
    enabled: !!profile, // Only run the query if profile is set
    staleTime: 1000 * 60 * 60, // Keep data fresh for 1 hour
  });

  const fetchRecommendationsMutation = useMutation({
    mutationFn: async (artistProfile: ArtistProfile) => {
      const res = await apiRequest('POST', '/api/ai/grant-recommendations', artistProfile);
      return res.json();
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(
        ['/api/ai/grant-recommendations', profile], 
        data.recommendations
      );
      toast({
        title: 'Grant recommendations ready!',
        description: `Found ${data.recommendations.length} grant opportunities matching your profile.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to get recommendations',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  return {
    recommendations,
    isLoading,
    error,
    profile,
    setProfile,
    fetchRecommendations: (newProfile: ArtistProfile) => {
      setProfile(newProfile);
      fetchRecommendationsMutation.mutate(newProfile);
    },
    isSubmitting: fetchRecommendationsMutation.isPending,
  };
}