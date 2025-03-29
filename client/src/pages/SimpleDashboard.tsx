import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ChevronRight, 
  Calendar, 
  BarChart3, 
  FileText, 
  Users, 
  Music, 
  LogOut,
  User
} from "lucide-react";

export default function SimpleDashboard() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            GrantiFuel
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your music grant applications and artist profiles.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Applications
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Total grant applications
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Artists
                </CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Registered artist profiles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Grants
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Open opportunities
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Application success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Grant Applications</CardTitle>
                <CardDescription>
                  Create and manage your grant applications
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm">
                  <p>Track progress, deadlines, and submissions</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/applications">
                    <span>View</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Artist Profiles</CardTitle>
                <CardDescription>
                  Manage your artist information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm">
                  <p>Create and update artist details and bios</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/artists">
                    <span>View</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>
                  Get help with your grant applications
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm">
                  <p>AI-powered assistance for your applications</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ai-assistant">
                    <span>View</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">
                  <span>Edit Profile</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 GrantiFuel. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}