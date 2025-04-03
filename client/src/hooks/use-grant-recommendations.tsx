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
  userId?: number; // This will be set by the server, not client
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
    queryKey: ['/api/ai/grant-recommendations'],
    queryFn: async () => {
      // This query won't actually run - we'll use mutations instead
      return null;
    },
    enabled: false, // Never run this query automatically
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
        ['/api/ai/grant-recommendations'], 
        data.recommendations
      );
      
      // Save recommendations to sessionStorage for the application form to use
      try {
        sessionStorage.setItem('ai-grant-recommendations', JSON.stringify(data.recommendations));
      } catch (err) {
        console.error('Error saving recommendations to sessionStorage:', err);
      }
      
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
      // Only trigger mutation, don't set profile here as it would cause a loop
      // since the profile is already being set by the caller
      fetchRecommendationsMutation.mutate(newProfile);
    },
    isSubmitting: fetchRecommendationsMutation.isPending,
  };
}