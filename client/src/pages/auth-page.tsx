import { useState, useEffect, useRef } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth, LoginData, RegisterData } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { VisuallyHidden, LiveRegion } from "@/components/ui/a11y-utils";
import { AccessibleButton } from "@/components/ui/accessible-button";

// Form schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation, logoutMutation } = useAuth();

  // Get query parameters
  const params = new URLSearchParams(window.location.search);
  const logoutStatus = params.get('status') === 'loggedout';
  
  // Only redirect if logged in and NOT coming from logout
  useEffect(() => {
    if (user && !isLoading && !logoutStatus) {
      // Use window.location for a full page refresh
      window.location.href = "/";
    }

    // If we detect the user just logged out, force a clean state
    if (logoutStatus && user) {
      // Manually trigger logout again to ensure clean state
      logoutMutation.mutate();
    }
  }, [user, isLoading, logoutStatus, logoutMutation]);

  // Setup login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Setup register form
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  // We handle the redirect in the useEffect hook above
  // Remove this duplicate check to avoid race conditions

  // States for controlling focus
  const [focusLoginInput, setFocusLoginInput] = useState(false);
  const [focusRegisterInput, setFocusRegisterInput] = useState(false);
  
  // Handle tab change and status announcements
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Set focus flags based on the active tab
    if (value === "login") {
      setFocusLoginInput(true);
      setFocusRegisterInput(false);
    } else if (value === "register") {
      setFocusLoginInput(false);
      setFocusRegisterInput(true);
    }
  };
  
  // Used for screen reader announcements
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Update status message for form submissions
  useEffect(() => {
    if (loginMutation.isPending) {
      setStatusMessage("Logging in, please wait...");
    } else if (registerMutation.isPending) {
      setStatusMessage("Creating your account, please wait...");
    } else if (loginMutation.isError) {
      setStatusMessage(`Login failed: ${loginMutation.error?.message || "Please check your credentials"}`);
    } else if (registerMutation.isError) {
      setStatusMessage(`Registration failed: ${registerMutation.error?.message || "Please check your information"}`);
    } else if (user) {
      setStatusMessage("Success! You are now logged in and will be redirected to the dashboard.");
    } else {
      setStatusMessage("");
    }
  }, [loginMutation, registerMutation, user]);

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background to-secondary/20"
      role="main"
      aria-labelledby="auth-heading"
    >
      {/* Screen reader announcements */}
      <LiveRegion ariaLive="assertive">{statusMessage}</LiveRegion>
      
      {/* Left Side - Forms */}
      <div className="w-full md:w-1/2 md:pr-8 mb-8 md:mb-0">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full max-w-md mx-auto"
          aria-label="Authentication options"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="login"
              aria-controls="login-tab"
              id="login-tab-trigger"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              aria-controls="register-tab"
              id="register-tab-trigger"
            >
              Register
            </TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="login" 
            id="login-tab"
            aria-labelledby="login-tab-trigger"
            tabIndex={0}
            role="tabpanel"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold" id="login-heading">Welcome Back</CardTitle>
                <CardDescription>
                  Log in to your account to continue your music grant journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form 
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                    className="space-y-4"
                    aria-labelledby="login-heading"
                    noValidate
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="login-username">Username</FormLabel>
                          <FormControl>
                            <Input 
                              id="login-username"
                              placeholder="Enter your username" 
                              autoComplete="username" 
                              required
                              aria-required="true"
                              autoFocus={focusLoginInput}
                              onFocus={() => setFocusLoginInput(false)}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="login-password">Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="login-password"
                              type="password" 
                              placeholder="Enter your password" 
                              autoComplete="current-password"
                              required
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <AccessibleButton 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      isLoading={loginMutation.isPending}
                      loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                      loadingText="Logging in..."
                      aria-describedby="login-submit-status"
                    >
                      Log in
                    </AccessibleButton>
                    <div id="login-submit-status" className="sr-only" aria-live="polite">
                      {loginMutation.isError && 
                        `Login error: ${loginMutation.error?.message || "Please check your credentials"}`
                      }
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-center justify-center text-sm">
                <p>
                  Don't have an account? 
                  <Button 
                    variant="link" 
                    className="p-0 ml-1" 
                    onClick={() => handleTabChange("register")}
                    aria-controls="register-tab"
                  >
                    Register now
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent 
            value="register" 
            id="register-tab"
            aria-labelledby="register-tab-trigger"
            tabIndex={0}
            role="tabpanel"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold" id="register-heading">Create an Account</CardTitle>
                <CardDescription>
                  Join Grantaroo Music Assist to simplify your grant applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form 
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                    className="space-y-4"
                    aria-labelledby="register-heading"
                    noValidate
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-name">Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-name"
                              placeholder="Enter your full name" 
                              autoComplete="name"
                              required
                              aria-required="true"
                              autoFocus={focusRegisterInput}
                              onFocus={() => setFocusRegisterInput(false)}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-email">Email</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-email"
                              type="email" 
                              placeholder="your.email@example.com" 
                              autoComplete="email"
                              required
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-username">Username</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-username"
                              placeholder="Choose a username" 
                              autoComplete="username"
                              required
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-password">Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-password"
                              type="password" 
                              placeholder="Create a password" 
                              autoComplete="new-password"
                              required
                              aria-required="true"
                              aria-describedby="password-requirements"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                          <div id="password-requirements" className="text-xs text-muted-foreground">
                            Password must be at least 6 characters long
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-confirm-password">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-confirm-password"
                              type="password" 
                              placeholder="Confirm your password" 
                              autoComplete="new-password"
                              required
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage aria-live="polite" />
                        </FormItem>
                      )}
                    />
                    <AccessibleButton 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      isLoading={registerMutation.isPending}
                      loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                      loadingText="Creating account..."
                      aria-describedby="register-submit-status"
                    >
                      Register
                    </AccessibleButton>
                    <div id="register-submit-status" className="sr-only" aria-live="polite">
                      {registerMutation.isError && 
                        `Registration error: ${registerMutation.error?.message || "Please check your information"}`
                      }
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-center justify-center text-sm">
                <p>
                  Already have an account? 
                  <Button 
                    variant="link" 
                    className="p-0 ml-1" 
                    onClick={() => handleTabChange("login")}
                    aria-controls="login-tab"
                  >
                    Log in
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Side - Hero Section */}
      <div className="w-full md:w-1/2 p-6 md:pl-8">
        <div className="text-center md:text-left">
          <h1 
            id="auth-heading"
            className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent"
          >
            Grantaroo Music Assist
          </h1>
          <p className="text-xl mb-6 text-muted-foreground">
            Your intelligent companion for music grant applications
          </p>
          <div className="space-y-6" aria-label="Key features">
            <div className="bg-card rounded-lg p-4 shadow" role="region" aria-labelledby="feature-1">
              <h3 id="feature-1" className="text-lg font-bold mb-2">AI-Powered Assistance</h3>
              <p>Get intelligent suggestions and improvements for your grant proposals with our advanced AI tools.</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow" role="region" aria-labelledby="feature-2">
              <h3 id="feature-2" className="text-lg font-bold mb-2">Streamlined Applications</h3>
              <p>Manage all your applications in one place, with intuitive tracking and progress monitoring.</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow" role="region" aria-labelledby="feature-3">
              <h3 id="feature-3" className="text-lg font-bold mb-2">Grant Discovery</h3>
              <p>Discover grants that match your profile and artistic vision, with personalized recommendations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}