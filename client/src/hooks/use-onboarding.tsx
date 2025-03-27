import { createContext, ReactNode, useContext } from "react";
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

export function OnboardingProvider({ 
  children, 
  queryClient 
}: { 
  children: ReactNode; 
  queryClient: QueryClient;
}) {
  const { toast } = useToast();

  const { 
    data: tasks = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/onboarding");
      if (!res.ok) return [];
      return await res.json() as UserOnboarding[];
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ task, data }: { task: string; data?: any }) => {
      const res = await apiRequest("POST", "/api/onboarding/complete", { task, data });
      if (!res.ok) {
        throw new Error("Failed to complete onboarding task");
      }
      return await res.json() as UserOnboarding;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const completeTask = (task: string, data?: any) => {
    // If task is already completed, don't do anything
    if (hasCompletedTask(task)) return;

    mutate({ task, data });
  };

  const hasCompletedTask = (task: string): boolean => {
    return tasks.some((t) => t.task === task);
  };

  return (
    <OnboardingContext.Provider
      value={{
        tasks,
        isLoading,
        completeTask,
        isPending,
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