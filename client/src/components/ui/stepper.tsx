import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, X, Circle } from "lucide-react";

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
  className,
}: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile version */}
      <div className="md:hidden flex flex-col space-y-1">
        <div className="flex items-center justify-between font-medium">
          <div>
            Step {activeStep + 1} of {steps.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {completedSteps.length}/{steps.length} completed
          </div>
        </div>
        <div className="w-full bg-muted h-2 rounded-full">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.max((activeStep / (steps.length - 1)) * 100, 
                (completedSteps.length / steps.length) * 100)}%` 
            }}
          />
        </div>
        <h3 className="font-medium text-lg">{steps[activeStep]?.title}</h3>
        {steps[activeStep]?.description && (
          <p className="text-muted-foreground text-sm">{steps[activeStep].description}</p>
        )}
      </div>

      {/* Desktop version */}
      <ol className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = completedSteps.includes(index);
          
          return (
            <li key={step.id} className={cn(
              "flex items-center",
              index < steps.length - 1 && "w-full"
            )}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                  isActive && !isCompleted ? "border-primary bg-primary/10" :
                  isCompleted ? "border-primary bg-primary text-primary-foreground" :
                  "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "absolute mt-10 text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-full h-0.5 mx-2 transition-colors duration-300",
                  isCompleted && index < activeStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}