import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

// Define schemas for login and registration
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(['grant_writer', 'manager', 'artist']).default('artist'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Always refetch user data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
      
      // Check if we have a stored redirect path
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect');
        navigate(storedRedirect);
      } else {
        // Navigate to dashboard if no redirect is stored
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...registerData } = data;
      
      const res = await apiRequest("POST", "/api/register", registerData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name || user.username}!`,
      });

      // Check if we have a stored redirect path
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect');
        navigate(storedRedirect);
      } else {
        // Navigate to dashboard if no redirect is stored
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", undefined, {
        deduplicate: false,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      // Immediately set user to null to prevent further authenticated requests
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all queries in the cache
      queryClient.clear();
      
      // Properly remove all queries to force refetching
      queryClient.removeQueries();
      
      // Reset all queries with specific important keys
      queryClient.resetQueries({queryKey: ["/api/user"]});
      queryClient.resetQueries({queryKey: ["/api/onboarding"]});
      queryClient.resetQueries({queryKey: ["/api/grants"]});
      
      // Clear storage completely
      localStorage.clear();
      sessionStorage.clear();
      
      // Delete any auth cookies via JS (as a backup)
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      // Force a hard reload to fully reset the application state
      setTimeout(() => {
        window.location.href = '/auth?status=loggedout&ts=' + Date.now();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message + " - Still logging out locally.",
        variant: "destructive",
      });
      
      // Even if server logout fails, still clear local state thoroughly
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      queryClient.removeQueries();
      queryClient.resetQueries({queryKey: ["/api/user"]});
      queryClient.resetQueries({queryKey: ["/api/onboarding"]});
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force a hard reload to fully reset the application state
      setTimeout(() => {
        window.location.href = '/auth?status=loggedout_locally&ts=' + Date.now();
      }, 100);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}