import React from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  /**
   * Content to be hidden visually but available to screen readers
   */
  children: React.ReactNode;
  
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * VisuallyHidden component hides content visually while keeping it accessible to screen readers
 */
export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-1 overflow-hidden whitespace-nowrap border-0',
        className
      )}
      style={{
        clip: 'rect(0, 0, 0, 0)',
      }}
    >
      {children}
    </span>
  );
}

interface SkipToContentProps {
  /**
   * The ID of the main content to skip to
   */
  contentId?: string;
  
  /**
   * Text for the skip link
   */
  children?: React.ReactNode;
  
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * SkipToContent component provides a link that appears on focus, allowing keyboard users
 * to skip navigation and go directly to the main content
 */
export function SkipToContent({ 
  contentId = 'main-content',
  children = 'Skip to content',
  className 
}: SkipToContentProps) {
  return (
    <a
      href={`#${contentId}`}
      className={cn(
        'absolute z-50 px-4 py-2 bg-background text-foreground transition rounded focus:outline-none focus:ring-2 focus:ring-primary',
        // Position offscreen by default, but show on focus
        '-top-20 left-4 focus:top-4',
        className
      )}
    >
      {children}
    </a>
  );
}

interface LiveRegionProps {
  /**
   * The content to announce to screen readers
   */
  children: React.ReactNode;
  
  /**
   * ARIA live attribute value
   */
  ariaLive?: 'polite' | 'assertive' | 'off';
  
  /**
   * Whether to clear the content after it's announced
   */
  clearAfter?: number;
  
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * LiveRegion component creates an accessible live region that announces
 * updates to screen readers without visual changes
 */
export function LiveRegion({ 
  children, 
  ariaLive = 'polite',
  clearAfter,
  className 
}: LiveRegionProps) {
  const [content, setContent] = React.useState(children);
  
  React.useEffect(() => {
    setContent(children);
    
    if (clearAfter && children) {
      const timer = setTimeout(() => {
        setContent(null);
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);
  
  return (
    <div
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn(
        'sr-only',
        className
      )}
    >
      {content}
    </div>
  );
}

/**
 * Example usage:
 * 
 * // Visually hidden example - hide label but leave it accessible to screen readers
 * <label>
 *   <VisuallyHidden>Email address</VisuallyHidden>
 *   <input type="email" placeholder="Email" />
 * </label>
 * 
 * // Skip to content example - add at the top of your page
 * <SkipToContent contentId="main" />
 * <div id="main">Main content here</div>
 * 
 * // Live region example - announce updates to screen readers
 * <LiveRegion ariaLive="assertive" clearAfter={3000}>
 *   {errorMessage}
 * </LiveRegion>
 */