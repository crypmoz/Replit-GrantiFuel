import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface StepperProps {
  steps: { 
    id: string | number;
    title: string;
    description?: string;
  }[];
  activeStep: number;
  completedSteps?: number[];
  className?: string;
}

export function Stepper({
  steps,
  activeStep,
  completedSteps = [],
  className
}: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = completedSteps.includes(index);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-white",
                    isCompleted && "border-primary bg-primary/10 text-primary",
                    !isActive && !isCompleted && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-sm font-medium",
                  isActive && "text-primary",
                  isCompleted && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {step.description && (
                  <span className="mt-1 text-xs text-muted-foreground max-w-[120px] text-center">
                    {step.description}
                  </span>
                )}
              </div>
              
              {!isLast && (
                <div className="flex-1 flex items-center justify-center">
                  <div 
                    className={cn(
                      "h-[2px] w-full",
                      index < activeStep ? "bg-primary" : "bg-muted"
                    )} 
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}