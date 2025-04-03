import { useState } from 'react';
import { Artist, insertArtistSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

// Form validation schema
const artistFormSchema = insertArtistSchema.pick({
  name: true,
  email: true,
  phone: true,
  bio: true,
  genres: true,
  careerStage: true,
  primaryInstrument: true,
  location: true,
  projectType: true
});

// Form state type
type ArtistFormValues = z.infer<typeof artistFormSchema>;

interface ArtistProfileEditProps {
  artist: Artist;
  onSubmit: (data: ArtistFormValues) => void;
  isSubmitting: boolean;
  cancelButton?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function ArtistProfileEdit({
  artist,
  onSubmit,
  isSubmitting,
  cancelButton = true,
  onCancel,
  className = ""
}: ArtistProfileEditProps) {
  // Set up the form with react-hook-form
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: artist.name,
      email: artist.email,
      phone: artist.phone ?? '',
      bio: artist.bio ?? '',
      genres: artist.genres ?? [],
      careerStage: artist.careerStage ?? '',
      primaryInstrument: artist.primaryInstrument ?? '',
      location: artist.location ?? '',
      projectType: artist.projectType ?? '',
    },
  });

  // Manage genres as a comma-separated string for simplicity
  const [genresInput, setGenresInput] = useState(artist.genres?.join(', ') || '');

  // Handle form submission
  function handleSubmit(data: ArtistFormValues) {
    // Convert the comma-separated genres string back to an array
    const genresArray = genresInput.split(',')
      .map(genre => genre.trim())
      .filter(genre => genre !== '');
    
    // Submit the form data with the processed genres
    onSubmit({
      ...data,
      genres: genresArray,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-4 ${className}`}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Artist name"
                  id="artist-name"
                  className="form-field-highlight"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Email address" 
                  type="email"
                  id="artist-email"
                  className="form-field-highlight"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Phone number" 
                  {...field}
                  value={field.value ?? ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Genres as a comma-separated input for simplicity */}
        <div className="space-y-2">
          <FormLabel>Genres (comma-separated)</FormLabel>
          <Input
            placeholder="e.g. Jazz, Classical, Hip-Hop"
            id="artist-genres"
            className="form-field-highlight"
            value={genresInput}
            onChange={(e) => setGenresInput(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter genres separated by commas
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about this artist..."
                  className="min-h-[120px] form-field-highlight"
                  id="artist-bio"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-1 pt-2">
          <h3 className="text-sm font-medium">Grant Matching Information</h3>
          <p className="text-xs text-muted-foreground">
            These details help match the artist with relevant grant opportunities
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="careerStage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Career Stage</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="artist-careerStage" className="form-field-highlight">
                    <SelectValue placeholder="Select career stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="emerging">Emerging Artist</SelectItem>
                  <SelectItem value="mid-career">Mid-Career</SelectItem>
                  <SelectItem value="established">Established Artist</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="primaryInstrument"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Instrument or Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="artist-primaryInstrument" className="form-field-highlight">
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="composer">Composer</SelectItem>
                  <SelectItem value="vocalist">Vocalist</SelectItem>
                  <SelectItem value="pianist">Pianist</SelectItem>
                  <SelectItem value="guitarist">Guitarist</SelectItem>
                  <SelectItem value="drummer">Drummer</SelectItem>
                  <SelectItem value="strings">String Instrumentalist</SelectItem>
                  <SelectItem value="woodwind">Woodwind</SelectItem>
                  <SelectItem value="brass">Brass</SelectItem>
                  <SelectItem value="producer">Producer</SelectItem>
                  <SelectItem value="conductor">Conductor</SelectItem>
                  <SelectItem value="dj">DJ</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="multi-instrumentalist">Multi-Instrumentalist</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. New York, USA" 
                  id="artist-location"
                  className="form-field-highlight"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Typical Project Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="artist-projectType" className="form-field-highlight">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="recording">Recording Project</SelectItem>
                  <SelectItem value="touring">Touring/Performance</SelectItem>
                  <SelectItem value="composition">Composition</SelectItem>
                  <SelectItem value="education">Education/Workshop</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="community">Community Engagement</SelectItem>
                  <SelectItem value="interdisciplinary">Interdisciplinary Arts</SelectItem>
                  <SelectItem value="residency">Artist Residency</SelectItem>
                  <SelectItem value="festival">Festival/Event</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          {cancelButton && (
            <Button type="button" variant="outline" onClick={onCancel || (() => form.reset())}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}