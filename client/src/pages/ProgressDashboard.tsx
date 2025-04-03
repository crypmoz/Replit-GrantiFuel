import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { UserOnboarding } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Image, 
  Music, 
  User, 
  Users, 
  Zap,
  BadgeCheck,
  Star,
  TrendingUp,
  Sparkles,
  Bell,
  CircleDollarSign,
  FolderPlus,
  BookmarkPlus
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface TaskDisplayInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const taskInfo: Record<string, TaskDisplayInfo> = {
  profile_completed: {
    title: "Complete Your Profile",
    description: "Fill out your basic information to get started",
    icon: <User className="w-5 h-5" />,
    path: "/profile"
  },
  first_grant_viewed: {
    title: "Browse Available Grants",
    description: "Explore grants that match your profile",
    icon: <Zap className="w-5 h-5" />,
    path: "/grants"
  },
  first_artist_created: {
    title: "Create Artist Profile",
    description: "Set up your first artist profile",
    icon: <Music className="w-5 h-5" />,
    path: "/artists"
  },
  first_application_started: {
    title: "Start a Grant Application",
    description: "Begin applying for your first grant",
    icon: <FileText className="w-5 h-5" />,
    path: "/applications"
  },
  ai_assistant_used: {
    title: "Try the AI Assistant",
    description: "Get help with your application from our AI",
    icon: <Sparkles className="w-5 h-5" />,
    path: "/ai-assistant"
  },
  first_document_uploaded: {
    title: "Upload a Document",
    description: "Share your work samples or resume",
    icon: <FileText className="w-5 h-5" />,
    path: "/documents"
  },
  first_template_saved: {
    title: "Save a Template",
    description: "Create a reusable template for applications",
    icon: <Star className="w-5 h-5" />,
    path: "/templates"
  },
  first_application_completed: {
    title: "Complete an Application",
    description: "Submit your first grant application",
    icon: <CheckCircle className="w-5 h-5" />,
    path: "/applications"
  },
  profile_picture_added: {
    title: "Add a Profile Picture",
    description: "Personalize your profile with a photo",
    icon: <Image className="w-5 h-5" />,
    path: "/profile"
  },
  notification_settings_updated: {
    title: "Set Up Notifications",
    description: "Customize how you receive updates",
    icon: <Bell className="w-5 h-5" />,
    path: "/settings"
  }
};

// All possible onboarding tasks
const allTasks = [
  'profile_completed',
  'first_grant_viewed',
  'first_artist_created',
  'first_application_started',
  'ai_assistant_used',
  'first_document_uploaded',
  'first_template_saved',
  'first_application_completed',
  'profile_picture_added',
  'notification_settings_updated'
];

export default function ProgressDashboard() {
  const { user } = useAuth();
  const [progressPercentage, setProgressPercentage] = useState(0);

  const { data: onboardingTasks, isLoading } = useQuery<UserOnboarding[]>({
    queryKey: ['/api/user/onboarding'],
    enabled: !!user
  });

  useEffect(() => {
    if (onboardingTasks) {
      const completedTasks = onboardingTasks.length;
      const totalTasks = allTasks.length;
      setProgressPercentage(Math.round((completedTasks / totalTasks) * 100));
    }
  }, [onboardingTasks]);

  // Create a map of completed tasks
  const completedTaskMap = onboardingTasks?.reduce<Record<string, UserOnboarding>>((acc, task) => {
    acc[task.task] = task;
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-6xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate progression levels
  const beginnerThreshold = 3;
  const intermediateThreshold = 6;
  const advancedThreshold = 9;
  const completedCount = onboardingTasks?.length || 0;
  
  const getUserLevel = () => {
    if (completedCount >= advancedThreshold) return "Expert";
    if (completedCount >= intermediateThreshold) return "Advanced";
    if (completedCount >= beginnerThreshold) return "Intermediate";
    return "Beginner";
  };
  
  const getLevelBadge = () => {
    const level = getUserLevel();
    switch(level) {
      case "Expert":
        return <Badge className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400">
                <BadgeCheck className="w-4 h-4 mr-1" /> Expert
               </Badge>;
      case "Advanced":
        return <Badge className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400">
                <Star className="w-4 h-4 mr-1" /> Advanced
               </Badge>;
      case "Intermediate":
        return <Badge className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400">
                <TrendingUp className="w-4 h-4 mr-1" /> Intermediate
               </Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400">
                <Sparkles className="w-4 h-4 mr-1" /> Beginner
               </Badge>;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Onboarding Progress</h1>
          <p className="text-muted-foreground">
            Complete these tasks to get the most out of GrantiFuel
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          {getLevelBadge()}
        </div>
      </div>
      
      <Card className="mb-8 border-2 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Progress Tracker
            </CardTitle>
            <Badge variant="outline" className="font-semibold">
              {getUserLevel()} Level
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-lg">
              {progressPercentage}% Complete
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {onboardingTasks?.length || 0} of {allTasks.length} tasks
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 rounded-md" />
          
          <div className="mt-6 grid grid-cols-4 text-center gap-2 text-sm">
            <div className={`py-2 px-1 rounded ${completedCount >= beginnerThreshold ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="font-semibold">Beginner</div>
              <div className="text-xs">{Math.min(completedCount, beginnerThreshold)}/{beginnerThreshold}</div>
            </div>
            <div className={`py-2 px-1 rounded ${completedCount >= intermediateThreshold ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="font-semibold">Intermediate</div>
              <div className="text-xs">{Math.min(Math.max(0, completedCount - beginnerThreshold), intermediateThreshold - beginnerThreshold)}/{intermediateThreshold - beginnerThreshold}</div>
            </div>
            <div className={`py-2 px-1 rounded ${completedCount >= advancedThreshold ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="font-semibold">Advanced</div>
              <div className="text-xs">{Math.min(Math.max(0, completedCount - intermediateThreshold), advancedThreshold - intermediateThreshold)}/{advancedThreshold - intermediateThreshold}</div>
            </div>
            <div className={`py-2 px-1 rounded ${completedCount >= allTasks.length ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="font-semibold">Expert</div>
              <div className="text-xs">{Math.min(Math.max(0, completedCount - advancedThreshold), allTasks.length - advancedThreshold)}/{allTasks.length - advancedThreshold}</div>
            </div>
          </div>
          
          {progressPercentage === 100 && (
            <Alert className="mt-6 bg-gradient-to-r from-primary-300 to-primary-100 border-primary">
              <Award className="h-5 w-5 text-primary-700" />
              <AlertTitle className="text-primary-900 font-bold">Congratulations!</AlertTitle>
              <AlertDescription className="text-primary-900">
                You've mastered all onboarding tasks. You're now a certified GrantiFuel expert!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <BadgeCheck className="mr-2 h-6 w-6 text-primary" />
        Your Tasks
      </h2>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {allTasks.map((taskKey, index) => {
          const isCompleted = !!completedTaskMap[taskKey];
          const task = taskInfo[taskKey];
          
          return (
            <motion.div key={taskKey} variants={item}>
              <Card 
                className={`h-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-primary-50 to-white border-primary/40 shadow-md' 
                    : 'hover:shadow-md hover:border-primary/30'
                }`}
              >
                <CardHeader className={`pb-2 ${isCompleted ? 'border-b border-primary/10' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${isCompleted ? 'bg-primary text-white' : 'bg-muted'}`}>
                        {task.icon}
                      </div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                    </div>
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <Badge variant="default" className="bg-primary/90">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Completed
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <CardDescription className="mt-2">{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  {isCompleted ? (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Completed on {new Date(completedTaskMap[taskKey].completedAt).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Complete this task to advance your profile
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 pb-4">
                  {!isCompleted && (
                    <Button asChild className="w-full">
                      <Link to={task.path}>
                        <span>Complete This Task</span>
                        <span className="ml-2">→</span>
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}