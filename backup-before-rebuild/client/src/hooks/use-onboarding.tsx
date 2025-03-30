import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserOnboarding } from "@shared/schema";

interface OnboardingContextType {
  tasks: UserOnboarding[];
  isLoading: boolean;
  completeTask: (task: string, data?: any) => void;
  isPending: boolean;
  hasCompletedTask: (task: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// In-memory fallback for when the database isn't ready
type InMemoryTask = {
  id: number;
  userId: number;
  task: string;
  data: any;
  completedAt: Date;
};

export function OnboardingProvider({ 
  children, 
  queryClient 
}: { 
  children: ReactNode; 
  queryClient: QueryClient;
}) {
  const { toast } = useToast();
  const [localTasks, setLocalTasks] = useState<Record<string, boolean>>({});

  const { 
    data: tasks = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/onboarding");
        if (!res.ok) return [];
        return await res.json() as UserOnboarding[];
      } catch (err) {
        console.error("Error fetching onboarding tasks:", err);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Using a local mutation when DB isn't available
  const completeTask = (task: string, data?: any) => {
    // Skip if already completed
    if (hasCompletedTask(task)) return;

    try {
      apiRequest("POST", "/api/onboarding/complete", { task, data }).catch(err => {
        console.error("Error completing task in API:", err);
      });
    } catch (err) {
      console.error("Error in complete task:", err);
    }

    // Always update local state to provide immediate feedback
    setLocalTasks(prev => ({
      ...prev,
      [task]: true
    }));
  };

  const hasCompletedTask = (task: string): boolean => {
    // Check both API tasks and local tasks
    return Boolean(localTasks[task]) || tasks.some((t) => t.task === task);
  };

  return (
    <OnboardingContext.Provider
      value={{
        tasks,
        isLoading: false, // Always return false to prevent loading states
        completeTask,
        isPending: false, // Always return false to prevent loading states  
        hasCompletedTask
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}