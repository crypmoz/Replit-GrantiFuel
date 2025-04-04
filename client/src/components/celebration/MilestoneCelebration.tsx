import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Award,
  Trophy,
  Star,
  CheckCircle,
  Music,
  FileText,
  Calendar,
  PartyPopper
} from "lucide-react";

interface MilestoneCelebrationProps {
  title: string;
  message: string;
  type?: "success" | "achievement" | "milestone" | "completion";
  icon?: React.ReactNode;
  confetti?: boolean;
  onDismiss?: () => void;
  onContinue?: () => void;
  continueText?: string;
  className?: string;
  autoHide?: number; // ms to auto hide, 0 = don't auto-hide
}

export function MilestoneCelebration({
  title,
  message,
  type = "success",
  icon,
  confetti = true, 
  onDismiss,
  onContinue,
  continueText = "Continue",
  className,
  autoHide = 0
}: MilestoneCelebrationProps) {
  const [open, setOpen] = React.useState(true);
  
  // Determine the appropriate icon based on the type
  const milestoneIcon = React.useMemo(() => {
    if (icon) return icon;
    
    switch (type) {
      case "achievement":
        return <Trophy className="h-12 w-12 text-yellow-500" />;
      case "milestone":
        return <Star className="h-12 w-12 text-primary" />;
      case "completion":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "success":
      default:
        return <PartyPopper className="h-12 w-12 text-primary" />;
    }
  }, [type, icon]);
  
  const handleClose = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  const handleContinue = () => {
    setOpen(false);
    if (onContinue) {
      onContinue();
    }
  };
  
  // Auto-hide after delay if specified
  useEffect(() => {
    if (autoHide > 0) {
      const timer = setTimeout(() => {
        setOpen(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoHide);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);
  
  return (
    <>
      {confetti && open && <Confetti particleCount={150} />}
      
      <AlertDialog open={open}>
        <AlertDialogContent
          className={cn(
            "sm:max-w-md border-primary/20 shadow-lg shadow-primary/10",
            type === "achievement" && "bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-950/30 dark:to-background",
            type === "milestone" && "bg-gradient-to-b from-primary/5 to-white dark:from-primary/10 dark:to-background",
            type === "completion" && "bg-gradient-to-b from-green-50 to-white dark:from-green-950/30 dark:to-background",
            type === "success" && "bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-background",
            className
          )}
        >
          <div className="absolute top-0 inset-x-0 h-2 rounded-t-lg bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          
          <AlertDialogHeader className="pt-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              {milestoneIcon}
            </div>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            {onContinue ? (
              <Button onClick={handleContinue} className="sm:min-w-32">
                {continueText}
              </Button>
            ) : (
              <AlertDialogAction onClick={handleClose} className="sm:min-w-32">
                Continue
              </AlertDialogAction>
            )}
            
            {onDismiss && onContinue && (
              <AlertDialogCancel onClick={handleClose}>
                Close
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default MilestoneCelebration;