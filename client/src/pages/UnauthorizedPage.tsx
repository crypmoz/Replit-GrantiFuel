import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LockIcon, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

/**
 * Page displayed when a user tries to access content they don't have permission for
 */
export default function UnauthorizedPage() {
  const { user } = useAuth();
  
  const roleDisplay: Record<string, string> = {
    'user': 'Basic User',
    'artist': 'Artist',
    'manager': 'Manager',
    'grant_writer': 'Grant Writer',
    'admin': 'Administrator'
  };

  const userRole = user?.role ? roleDisplay[user.role] || user.role : 'Logged Out';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="max-w-md w-full p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <LockIcon className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          
          <p className="text-muted-foreground">
            You don't have permission to access this area. This feature requires a higher permission level.
          </p>
          
          <div className="p-3 bg-muted rounded-md w-full">
            <p className="font-medium">Your current role:</p>
            <p className="text-lg font-bold text-primary">{userRole}</p>
          </div>
          
          <div className="flex flex-col space-y-2 w-full">
            <Link href="/">
              <Button variant="default" className="w-full flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}