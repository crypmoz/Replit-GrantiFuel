import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/a11y-utils";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ButtonProps {
  /**
   * Text to be announced to screen readers, but visually hidden
   */
  srText?: string;
  
  /**
   * Visual content/text of the button
   */
  children: React.ReactNode;
  
  /**
   * Additional className for the container
   */
  className?: string;
  
  /**
   * Whether the button is currently in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Icon to show when in loading state
   */
  loadingIcon?: React.ReactNode;
  
  /**
   * Text to show when in loading state
   */
  loadingText?: string;
  
  /**
   * Whether to add focus ring styles
   */
  focusRingEnabled?: boolean;
}

/**
 * AccessibleButton enhances the base Button component with better 
 * accessibility support, loading states, and screen reader text.
 */
export function AccessibleButton({
  srText,
  children,
  className,
  isLoading = false,
  loadingIcon,
  loadingText = "Loading...",
  focusRingEnabled = true,
  disabled,
  ...props
}: AccessibleButtonProps) {
  // Combine loading state with disabled state
  const isDisabled = disabled || isLoading;
  
  // Add focus ring if enabled
  const focusRingClass = focusRingEnabled ? "focus:ring-2 focus:ring-primary focus:ring-offset-2" : "";
  
  return (
    <Button
      className={cn(
        "relative",
        focusRingClass,
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && loadingIcon && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingIcon}
          <VisuallyHidden>{loadingText}</VisuallyHidden>
        </span>
      )}
      
      <span className={cn(isLoading ? "invisible" : "visible")}>
        {children}
        {srText && <VisuallyHidden>{srText}</VisuallyHidden>}
      </span>
      
      {isLoading && !loadingIcon && (
        <span aria-hidden="true" className="ml-2">
          {loadingText}
        </span>
      )}
    </Button>
  );
}

/**
 * Example usage:
 * 
 * <AccessibleButton 
 *   srText="This will be announced to screen readers"
 *   isLoading={isSubmitting}
 *   loadingIcon={<Loader className="h-4 w-4 animate-spin" />}
 *   onClick={handleSubmit}
 * >
 *   Submit
 * </AccessibleButton>
 */