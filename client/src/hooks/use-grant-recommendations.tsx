import { useState, useEffect } from 'react';
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

  // First, check if we have cached recommendations in sessionStorage
  const getCachedRecommendations = (): GrantRecommendation[] | null => {
    try {
      const cachedData = sessionStorage.getItem('ai-grant-recommendations');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Error retrieving cached recommendations:', error);
    }
    return null;
  };

  // Set initial data from sessionStorage if available
  const cachedRecommendations = getCachedRecommendations();

  const {
    data: recommendations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/ai/grant-recommendations'],
    queryFn: async () => {
      // This query won't actually run - we'll use mutations instead
      // But we need to return the cached data if available
      return cachedRecommendations;
    },
    enabled: false, // Never run this query automatically
    staleTime: 1000 * 60 * 60, // Keep data fresh for 1 hour
    initialData: cachedRecommendations, // Set initial data from cache
  });

  // On component mount, set the cached data to React Query cache if available
  useEffect(() => {
    if (cachedRecommendations) {
      queryClient.setQueryData(['/api/ai/grant-recommendations'], cachedRecommendations);
    }
  }, []);

  const fetchRecommendationsMutation = useMutation({
    mutationFn: async (artistProfile: ArtistProfile) => {
      // Check if we already have cached recommendations for this profile
      const cachedProfileKey = `profile-${artistProfile.genre}-${artistProfile.careerStage}-${artistProfile.instrumentOrRole}`;
      const cachedProfileData = sessionStorage.getItem(cachedProfileKey);
      
      if (cachedProfileData) {
        console.log('Using cached profile-specific recommendations');
        return { recommendations: JSON.parse(cachedProfileData) };
      }
      
      // If not in cache, make the API request
      const res = await apiRequest('POST', '/api/ai/grant-recommendations', artistProfile);
      return res.json();
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(
        ['/api/ai/grant-recommendations'], 
        data.recommendations
      );
      
      // Save general recommendations to sessionStorage
      try {
        sessionStorage.setItem('ai-grant-recommendations', JSON.stringify(data.recommendations));
        
        // Also save profile-specific recommendations if we have a profile
        if (profile) {
          const profileKey = `profile-${profile.genre}-${profile.careerStage}-${profile.instrumentOrRole}`;
          sessionStorage.setItem(profileKey, JSON.stringify(data.recommendations));
        }
      } catch (err) {
        console.error('Error saving recommendations to sessionStorage:', err);
      }
      
      toast({
        title: 'Grant recommendations ready!',
        description: `Found ${data.recommendations.length} grant opportunities matching your profile.`,
      });
    },
    onError: (error: Error) => {
      // Try to use cached recommendations if available
      const cachedRecs = getCachedRecommendations();
      if (cachedRecs) {
        queryClient.setQueryData(['/api/ai/grant-recommendations'], cachedRecs);
        toast({
          title: 'Using cached recommendations',
          description: 'We\'re showing you cached recommendations while we fix the issue.',
        });
      } else {
        toast({
          title: 'Failed to get recommendations',
          description: error.message || 'Please try again later.',
          variant: 'destructive',
        });
      }
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