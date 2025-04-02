import { useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const onboardingTasks = [
  { id: "profile_completed", label: "Complete profile", description: "Add your information to your profile" },
  { id: "first_artist_created", label: "Create an artist", description: "Add your first artist profile" },
  { id: "first_grant_viewed", label: "Browse grants", description: "Look through available grants" },
  { id: "first_application_started", label: "Start an application", description: "Begin a grant application" },
  { id: "ai_assistant_used", label: "Try AI assistance", description: "Get help from our AI assistant" },
  { id: "first_document_uploaded", label: "Upload a document", description: "Add a document to your library" },
  { id: "first_template_saved", label: "Save a template", description: "Create or save a proposal template" },
  { id: "first_application_completed", label: "Complete an application", description: "Submit your first grant application" },
  { id: "profile_picture_added", label: "Add profile picture", description: "Upload a profile picture" },
  { id: "notification_settings_updated", label: "Set notifications", description: "Update your notification preferences" }
];

export function OnboardingProgress() {
  // Use try-catch to make sure component loads even if hooks fail
  let taskHooks;
  try {
    taskHooks = useOnboarding();
  } catch (error) {
    console.error("Error using onboarding hooks:", error);
    // Provide mock implementations for the component to render
    taskHooks = {
      tasks: [],
      hasCompletedTask: () => false,
      completeTask: () => {}, 
      isLoading: false,
      isPending: false
    };
  }
  
  const { tasks, hasCompletedTask, completeTask } = taskHooks;

  // Safely check if task is completed
  const safeHasCompleted = (taskId: string) => {
    try {
      return hasCompletedTask(taskId);
    } catch (error) {
      console.error(`Error checking completion for task ${taskId}:`, error);
      return false;
    }
  };

  const completedTaskCount = onboardingTasks.filter(task => 
    safeHasCompleted(task.id)
  ).length;
  
  const progressPercentage = Math.round((completedTaskCount / onboardingTasks.length) * 100);

  // Effect to automatically mark certain tasks complete based on current page
  useEffect(() => {
    // When this component mounts, mark the dashboard as viewed
    // You can add similar effects in other components to track progress
    // without requiring explicit user action
    const timer = setTimeout(() => {
      try {
        if (!safeHasCompleted("dashboard_viewed")) {
          completeTask("dashboard_viewed", { timestamp: new Date().toISOString() });
        }
      } catch (error) {
        console.error("Error in dashboard viewed task:", error);
        // Continue with the application even if database operations fail
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [safeHasCompleted, completeTask]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          Onboarding Progress
          <span className="text-sm font-normal text-muted-foreground">
            {completedTaskCount} of {onboardingTasks.length} tasks completed
          </span>
        </CardTitle>
        <CardDescription>
          Complete these tasks to get the most out of GrantiFuel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <div className="grid gap-2">
          {onboardingTasks.map((task) => {
            const isCompleted = safeHasCompleted(task.id);
            
            return (
              <div 
                key={task.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-md transition-colors",
                  isCompleted ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div>
                  <h4 className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-green-700 dark:text-green-300"
                  )}>
                    {task.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {task.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}