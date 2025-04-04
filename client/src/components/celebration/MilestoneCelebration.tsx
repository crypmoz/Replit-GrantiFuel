import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  Award, 
  Trophy, 
  ArrowRight,
  X,
  CheckCircle,
  PartyPopper,
  Sparkles
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
  autoHide = 0,
}: MilestoneCelebrationProps) {
  const [visible, setVisible] = useState(true);

  // Auto-hide if configured
  useEffect(() => {
    if (autoHide > 0 && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, autoHide);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, visible, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleContinue = () => {
    setVisible(false);
    if (onContinue) onContinue();
  };

  // Default icons based on type
  const getDefaultIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-10 w-10 text-primary" />;
      case "achievement":
        return <Award className="h-10 w-10 text-amber-500" />;
      case "milestone":
        return <PartyPopper className="h-10 w-10 text-purple-500" />;
      case "completion":
        return <Trophy className="h-10 w-10 text-green-500" />;
      default:
        return <Star className="h-10 w-10 text-primary" />;
    }
  };

  // Background gradient based on type
  const getBgGradient = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-br from-primary/10 to-primary/5";
      case "achievement":
        return "bg-gradient-to-br from-amber-500/10 to-amber-500/5";
      case "milestone":
        return "bg-gradient-to-br from-purple-500/10 to-purple-500/5";
      case "completion":
        return "bg-gradient-to-br from-green-500/10 to-green-500/5";
      default:
        return "bg-gradient-to-br from-primary/10 to-primary/5";
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {confetti && <Confetti />}
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center p-4",
              className
            )}
          >
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={handleDismiss}
            />
            
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className={cn(
                "relative rounded-lg shadow-lg p-6 max-w-md w-full",
                "bg-background border",
                getBgGradient()
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full p-3 bg-primary/10">
                  {icon || getDefaultIcon()}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground">
                    {message}
                  </p>
                </div>
                
                {onContinue && (
                  <Button 
                    className="mt-4 w-full"
                    onClick={handleContinue}
                  >
                    {continueText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="absolute -z-10 top-0 right-0">
                <Sparkles className="h-24 w-24 text-primary opacity-10" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}