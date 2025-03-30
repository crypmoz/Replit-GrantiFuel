import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Bell, 
  LockKeyhole, 
  Mail, 
  Save, 
  Shield, 
  UserCog, 
  Loader2 
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    grantDeadlines: true,
    newFeatures: true,
    marketingEmails: false,
    sessionTimeout: 30,
    twoFactorAuth: false
  });

  if (!user) {
    return null;
  }

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSave = (section: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings updated",
        description: `Your ${section} settings have been updated successfully.`,
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4 hidden md:inline" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4 hidden md:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account">
            <UserCog className="mr-2 h-4 w-4 hidden md:inline" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <LockKeyhole className="mr-2 h-4 w-4 hidden md:inline" />
            Privacy
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    id="emailNotifications" 
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleToggle('emailNotifications')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="applicationUpdates">Application Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about your application status changes
                    </p>
                  </div>
                  <Switch 
                    id="applicationUpdates" 
                    checked={settings.applicationUpdates}
                    onCheckedChange={() => handleToggle('applicationUpdates')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="grantDeadlines">Grant Deadlines</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming grant deadlines
                    </p>
                  </div>
                  <Switch 
                    id="grantDeadlines" 
                    checked={settings.grantDeadlines}
                    onCheckedChange={() => handleToggle('grantDeadlines')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newFeatures">New Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Learn about new features and improvements
                    </p>
                  </div>
                  <Switch 
                    id="newFeatures" 
                    checked={settings.newFeatures}
                    onCheckedChange={() => handleToggle('newFeatures')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional content and offers
                    </p>
                  </div>
                  <Switch 
                    id="marketingEmails" 
                    checked={settings.marketingEmails}
                    onCheckedChange={() => handleToggle('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSave('notification')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={settings.twoFactorAuth}
                    onCheckedChange={() => handleToggle('twoFactorAuth')}
                  />
                </div>
                <Separator />
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after period of inactivity
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button variant="outline" size="sm" 
                      onClick={() => setSettings(prev => ({
                        ...prev, 
                        sessionTimeout: Math.max(15, prev.sessionTimeout - 15)
                      }))}
                    >
                      -
                    </Button>
                    <span>{settings.sessionTimeout} minutes</span>
                    <Button variant="outline" size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev, 
                        sessionTimeout: Math.min(120, prev.sessionTimeout + 15)
                      }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSave('security')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <p className="text-sm font-medium">Standard Account</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Account ID</Label>
                  <p className="text-sm font-medium">{user.id}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm font-medium">March 15, 2023</p>
                </div>
                <Separator />
                <div className="pt-2">
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Manage your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Usage</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow us to use your data to improve our services
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Control who can view your profile information
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Request My Data
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSave('privacy')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}