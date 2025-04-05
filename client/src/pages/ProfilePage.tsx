import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Music, ChevronRight } from 'lucide-react';
import { Artist } from '@shared/schema';
import { ArtistProfileManager } from '@/components/profile/ArtistProfileManager';
import { Link } from 'wouter';

export default function ProfilePage() {
  const { user } = useAuth();
  
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
          <CardHeader>
            <CardTitle>Artist Profile</CardTitle>
            <CardDescription>Your personal and grant matching information</CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistProfileManager 
              defaultArtist={artistProfile}
              displayMode="view"
              showAiProfileSync={true}
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="flex-1">
              <CardTitle>Grant Matching Information</CardTitle>
              <CardDescription>
                How your profile information helps you find grants
              </CardDescription>
            </div>
            <Link href="/grants">
              <Button variant="outline">
                <Music className="mr-2 h-4 w-4" />
                Find Grants
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
      </div>
    </div>
  );
}