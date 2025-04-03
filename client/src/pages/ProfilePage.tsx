import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Music } from 'lucide-react';
import { Artist } from '@shared/schema';
import { ProfileRequirements } from '@/components/profile/ProfileRequirements';
import { ArtistProfileCard } from '@/components/profile/ArtistProfileCard';
import { ArtistProfileEdit } from '@/components/profile/ArtistProfileEdit';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  
  // Fetch user's artist profile if it exists
  const { data: artistProfile, isLoading: artistLoading } = useQuery<Artist | null>({
    queryKey: ['/api/artists/profile'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/artists/by-user/${user.id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch artist profile');
        return res.json();
      } catch (error) {
        console.error('Error fetching artist profile:', error);
        return null;
      }
    },
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  // Get list of completed profile fields for the requirements component
  const getCompletedProfileFields = () => {
    const completedFields = [];
    
    if (artistProfile?.name) completedFields.push('Full Name');
    if (artistProfile?.email) completedFields.push('Email');
    if (artistProfile?.bio) completedFields.push('Bio');
    if (artistProfile?.genres && artistProfile.genres.length > 0) completedFields.push('Genres');
    if (artistProfile?.careerStage) completedFields.push('Career Stage');
    if (artistProfile?.primaryInstrument) completedFields.push('Primary Instrument');
    if (artistProfile?.location) completedFields.push('Location');
    if (artistProfile?.projectType) completedFields.push('Project Type');
    
    return completedFields;
  };

  // Create/update artist profile 
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check if artist profile exists and create/update accordingly
      if (artistProfile) {
        // Update existing artist profile
        const artistResponse = await apiRequest('PATCH', `/api/artists/${artistProfile.id}`, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          genres: data.genres,
          careerStage: data.careerStage,
          primaryInstrument: data.primaryInstrument,
          location: data.location,
          projectType: data.projectType
        });
        
        if (!artistResponse.ok) {
          throw new Error('Failed to update artist profile');
        }
        
        return artistResponse.json();
      } else {
        // Create new artist profile
        const artistResponse = await apiRequest('POST', '/api/artists', {
          userId: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          genres: data.genres,
          careerStage: data.careerStage,
          primaryInstrument: data.primaryInstrument,
          location: data.location,
          projectType: data.projectType
        });
        
        if (!artistResponse.ok) {
          throw new Error('Failed to create artist profile');
        }
        
        return artistResponse.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      // Exit edit mode
      setEditMode(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/artists/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle profile field click from requirements component
  const handleProfileFieldClick = (fieldName: string) => {
    setEditMode(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>This is your public profile image</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar || undefined} alt={user.name || user.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Change
            </Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          {artistProfile && !editMode ? (
            <>
              <CardHeader>
                <CardTitle>Artist Profile</CardTitle>
                <CardDescription>Your personal and grant matching information</CardDescription>
              </CardHeader>
              <CardContent>
                <ArtistProfileCard 
                  artist={artistProfile} 
                  isLoading={artistLoading}
                  showEditButton={true}
                  onEditClick={() => setEditMode(true)}
                />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{artistProfile ? 'Edit Profile' : 'Create Artist Profile'}</CardTitle>
                <CardDescription>
                  {artistProfile 
                    ? 'Update your profile information' 
                    : 'Complete your artist profile to improve grant matching'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {artistProfile && (
                  <ArtistProfileEdit 
                    artist={artistProfile}
                    onSubmit={(data) => updateProfileMutation.mutate(data)}
                    isSubmitting={updateProfileMutation.isPending}
                    cancelButton={true}
                    onCancel={() => setEditMode(false)}
                  />
                )}
                {!artistProfile && !artistLoading && (
                  <ArtistProfileEdit 
                    artist={{
                      id: 0,
                      userId: user.id,
                      name: user.name || '',
                      email: user.email || '',
                      bio: user.bio || '',
                      phone: '',
                      genres: [],
                      createdAt: new Date()
                    }}
                    onSubmit={(data) => updateProfileMutation.mutate(data)}
                    isSubmitting={updateProfileMutation.isPending}
                    cancelButton={false}
                  />
                )}
              </CardContent>
            </>
          )}
        </Card>

        <Card className="col-span-1 md:col-span-3 lg:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="flex-1">
              <CardTitle>Grant Matching Information</CardTitle>
              <CardDescription>
                How your profile information helps you find grants
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/grant-recommendations'}
            >
              <Music className="mr-2 h-4 w-4" />
              Find Grants
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                The information in your profile is used by our AI system to match you with relevant grant opportunities.
                Make sure to fill out your artist information as completely as possible for the best recommendations.
              </p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Music Genres:</strong> Helps match you with genre-specific funding</li>
                <li><strong>Career Stage:</strong> Many grants target specific career stages (emerging, established, etc.)</li>
                <li><strong>Primary Instrument/Role:</strong> Some grants are specific to instrumentalists, composers, etc.</li>
                <li><strong>Location:</strong> Regional grants may only be available in certain areas</li>
                <li><strong>Project Type:</strong> Grants often fund specific types of musical activities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3 lg:col-span-1">
          <ProfileRequirements 
            completedFields={getCompletedProfileFields()} 
            onFieldClick={handleProfileFieldClick}
          />
        </Card>
      </div>
    </div>
  );
}