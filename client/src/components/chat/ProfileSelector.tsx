import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GrantProfileType, useChatbot } from '@/context/ChatbotContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfileSelector() {
  const { userProfile, setUserProfile } = useChatbot();
  const { toast } = useToast();
  const [careerStage, setCareerStage] = useState(userProfile?.careerStage || 'emerging');
  const [genre, setGenre] = useState(userProfile?.genre || 'indie');
  const [instrumentOrRole, setInstrumentOrRole] = useState(userProfile?.instrumentOrRole || 'vocalist');
  const [profileSource, setProfileSource] = useState<'manual' | 'artist'>('manual');
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);

  // Fetch artist profiles
  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ['/api/artists'],
  });
  
  // Extract artists array safely
  const artists = Array.isArray(artistsData) ? artistsData : [];
  
  useEffect(() => {
    // If we have artists and no profile yet, use the first artist's data
    if (artists.length > 0 && !userProfile && !selectedArtistId) {
      const primaryArtist = artists[0];
      
      // Only set if we have the required fields
      if (primaryArtist.genre && primaryArtist.careerStage && primaryArtist.instrumentOrRole) {
        setCareerStage(primaryArtist.careerStage);
        setGenre(primaryArtist.genre);
        setInstrumentOrRole(primaryArtist.instrumentOrRole);
        setSelectedArtistId(primaryArtist.id);
        setProfileSource('artist');
        
        // Automatically save this profile
        setUserProfile({
          careerStage: primaryArtist.careerStage,
          genre: primaryArtist.genre,
          instrumentOrRole: primaryArtist.instrumentOrRole
        });
        
        toast({
          title: "Artist profile loaded",
          description: `Using ${primaryArtist.name}'s profile for AI assistance`,
        });
      }
    }
  }, [artists, userProfile, setUserProfile, toast, selectedArtistId]);

  const handleSaveProfile = () => {
    setUserProfile({
      careerStage,
      genre,
      instrumentOrRole
    });
    
    toast({
      title: "Profile updated",
      description: "Your AI assistance profile has been updated",
    });
  };
  
  const handleArtistSelect = (artistId: string) => {
    if (artistId === 'manual') {
      setProfileSource('manual');
      return;
    }
    
    const artistIdNum = parseInt(artistId);
    const selectedArtist = artists.find(a => a.id === artistIdNum);
    
    if (selectedArtist) {
      setCareerStage(selectedArtist.careerStage || careerStage);
      setGenre(selectedArtist.genre || genre);
      setInstrumentOrRole(selectedArtist.instrumentOrRole || instrumentOrRole);
      setSelectedArtistId(artistIdNum);
      setProfileSource('artist');
      
      // Automatically save this profile
      setUserProfile({
        careerStage: selectedArtist.careerStage || careerStage,
        genre: selectedArtist.genre || genre,
        instrumentOrRole: selectedArtist.instrumentOrRole || instrumentOrRole
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Your Music Profile</span>
          {userProfile && (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Customize your profile to get more personalized grant assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {artistsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {artists.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="artistSelect">Use Artist Profile</Label>
                <Select 
                  value={selectedArtistId ? selectedArtistId.toString() : 'manual'} 
                  onValueChange={handleArtistSelect}
                >
                  <SelectTrigger id="artistSelect" className="w-full">
                    <SelectValue placeholder="Choose an artist profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      {artists.map(artist => (
                        <SelectItem key={artist.id} value={artist.id.toString()}>
                          {artist.name} {artist.genre ? `(${artist.genre})` : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select an artist to automatically use their profile details
                </p>
              </div>
            )}
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="careerStage">Career Stage</Label>
                {profileSource === 'artist' && (
                  <Badge variant="outline" className="text-xs py-0 h-5">From Artist</Badge>
                )}
              </div>
              <Select 
                value={careerStage} 
                onValueChange={setCareerStage}
                disabled={profileSource === 'artist'}
              >
                <SelectTrigger id="careerStage">
                  <SelectValue placeholder="Select your career stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="emerging">Emerging Artist</SelectItem>
                    <SelectItem value="mid-career">Mid-Career Artist</SelectItem>
                    <SelectItem value="established">Established Artist</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="genre">Primary Genre</Label>
                {profileSource === 'artist' && (
                  <Badge variant="outline" className="text-xs py-0 h-5">From Artist</Badge>
                )}
              </div>
              <Select 
                value={genre} 
                onValueChange={setGenre}
                disabled={profileSource === 'artist'}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select your primary genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="r&b">R&B</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="folk">Folk</SelectItem>
                    <SelectItem value="indie">Indie</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="world">World</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="instrumentOrRole">Main Instrument/Role</Label>
                {profileSource === 'artist' && (
                  <Badge variant="outline" className="text-xs py-0 h-5">From Artist</Badge>
                )}
              </div>
              <Select 
                value={instrumentOrRole} 
                onValueChange={setInstrumentOrRole}
                disabled={profileSource === 'artist'}
              >
                <SelectTrigger id="instrumentOrRole">
                  <SelectValue placeholder="Select your instrument or role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="vocalist">Vocalist</SelectItem>
                    <SelectItem value="guitarist">Guitarist</SelectItem>
                    <SelectItem value="bassist">Bassist</SelectItem>
                    <SelectItem value="drummer">Drummer</SelectItem>
                    <SelectItem value="pianist">Pianist/Keyboardist</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="dj">DJ</SelectItem>
                    <SelectItem value="composer">Composer</SelectItem>
                    <SelectItem value="songwriter">Songwriter</SelectItem>
                    <SelectItem value="strings">String Instrument</SelectItem>
                    <SelectItem value="brass">Brass Instrument</SelectItem>
                    <SelectItem value="woodwind">Woodwind Instrument</SelectItem>
                    <SelectItem value="multi-instrumentalist">Multi-Instrumentalist</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {profileSource === 'artist' ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setProfileSource('manual');
              setSelectedArtistId(null);
            }}
            className="text-xs"
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Switch to Manual
          </Button>
        ) : (
          <div></div> // Empty div for spacing
        )}
        
        <Button 
          onClick={handleSaveProfile} 
          variant="default"
          disabled={profileSource === 'artist'}
        >
          {userProfile ? 'Update Profile' : 'Save Profile'}
        </Button>
      </CardFooter>
    </Card>
  );
}