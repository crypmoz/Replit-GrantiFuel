import { Artist } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Music, 
  Award,
  Edit,
  MapPin,
  FileType
} from "lucide-react";
import { format } from "date-fns";

interface ArtistProfileCardProps {
  artist: Artist;
  isLoading?: boolean;
  showEditButton?: boolean;
  onEditClick?: () => void;
  className?: string;
}

export function ArtistProfileCard({ 
  artist, 
  isLoading = false, 
  showEditButton = false,
  onEditClick,
  className = ""
}: ArtistProfileCardProps) {
  // Format data for display
  const genres = artist?.genres || [];
  const formattedCareerStage = artist?.careerStage 
    ? artist.careerStage.charAt(0).toUpperCase() + artist.careerStage.slice(1).replace('-', ' ')
    : null;
  const formattedInstrument = artist?.primaryInstrument 
    ? artist.primaryInstrument.charAt(0).toUpperCase() + artist.primaryInstrument.slice(1)
    : null;
  const formattedProjectType = artist?.projectType 
    ? artist.projectType.charAt(0).toUpperCase() + artist.projectType.slice(1).replace('-', ' ')
    : null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Artist Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-full w-24 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <User className="h-5 w-5 mr-2 text-primary" />
          Artist Profile
        </CardTitle>
        {showEditButton && (
          <CardDescription>
            Personal and grant matching information
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
            <User className="h-12 w-12 text-primary-500 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <p className="text-gray-700 dark:text-gray-300">{artist?.email}</p>
          </div>
          
          {artist?.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">{artist?.phone}</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <p className="text-gray-700 dark:text-gray-300">
              Joined {artist?.createdAt ? format(new Date(artist.createdAt), 'MMMM d, yyyy') : 'N/A'}
            </p>
          </div>
          
          <div className="pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <Music className="h-4 w-4 mr-1 text-gray-400" />
              Genres
            </h4>
            <div className="flex flex-wrap gap-2">
              {genres.length > 0 ? (
                genres.map((genre, i) => (
                  <Badge key={i} variant="secondary">
                    {genre}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm">No genres specified</span>
              )}
            </div>
          </div>
          
          {artist?.bio && (
            <div className="pt-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Biography</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-line">
                {artist.bio}
              </p>
            </div>
          )}
          
          {/* Grant matching information section */}
          <div className="pt-5 border-t border-gray-100 dark:border-gray-800 mt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Award className="h-4 w-4 mr-1 text-primary" />
              Grant Matching Information
            </h4>
            
            <div className="space-y-3 text-sm">
              {formattedCareerStage ? (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Career Stage:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formattedCareerStage}
                  </span>
                </div>
              ) : null}
              
              {formattedInstrument ? (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Primary Role:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formattedInstrument}
                  </span>
                </div>
              ) : null}
              
              {artist?.location ? (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Location:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {artist.location}
                  </span>
                </div>
              ) : null}
              
              {formattedProjectType ? (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    <FileType className="h-3 w-3 inline mr-1" />
                    Project Type:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formattedProjectType}
                  </span>
                </div>
              ) : null}
              
              {!formattedCareerStage && !formattedInstrument && !artist?.location && !formattedProjectType && (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No grant matching information provided yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {showEditButton && (
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onEditClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}