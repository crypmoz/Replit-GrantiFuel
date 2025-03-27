import { useState } from 'react';
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

export default function ProfileSelector() {
  const { userProfile, setUserProfile } = useChatbot();
  const [careerStage, setCareerStage] = useState(userProfile?.careerStage || 'emerging');
  const [genre, setGenre] = useState(userProfile?.genre || 'indie');
  const [instrumentOrRole, setInstrumentOrRole] = useState(userProfile?.instrumentOrRole || 'vocalist');

  const handleSaveProfile = () => {
    setUserProfile({
      careerStage,
      genre,
      instrumentOrRole
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Music Profile</CardTitle>
        <CardDescription>
          Customize your profile to get more personalized grant assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="careerStage">Career Stage</Label>
          <Select value={careerStage} onValueChange={setCareerStage}>
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
          <Label htmlFor="genre">Primary Genre</Label>
          <Select value={genre} onValueChange={setGenre}>
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
          <Label htmlFor="instrumentOrRole">Main Instrument/Role</Label>
          <Select value={instrumentOrRole} onValueChange={setInstrumentOrRole}>
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
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveProfile} variant="default">
          {userProfile ? 'Update Profile' : 'Save Profile'}
        </Button>
      </CardFooter>
    </Card>
  );
}