import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  /**
   * Whether the focus trap is active
   */
  active: boolean;
  
  /**
   * Content to be rendered within the focus trap
   */
  children: React.ReactNode;
  
  /**
   * Additional className for the container
   */
  className?: string;
  
  /**
   * Function to call when the escape key is pressed
   */
  onEscape?: () => void;
  
  /**
   * Whether to auto-focus the first focusable element when active
   */
  autoFocus?: boolean;
  
  /**
   * HTML tag to use for the container
   */
  as?: React.ElementType;
  
  /**
   * Whether to return focus to the previously focused element when deactivated
   */
  returnFocus?: boolean;
}

/**
 * FocusTrap component traps focus within it when active, preventing
 * users from tabbing outside of it, which is important for modals and dialogs.
 */
export function FocusTrap({
  active = true,
  children,
  className = '',
  onEscape,
  autoFocus = true,
  as: Component = 'div',
  returnFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Store previously focused element
  useEffect(() => {
    if (active && returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [active, returnFocus]);
  
  // Set up focus trap
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      // Shift + Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab (forward)
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
    
    // Auto-focus first element
    if (autoFocus && focusableElements.length > 0) {
      firstElement.focus();
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus when deactivated
      if (returnFocus && previousFocusRef.current) {
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [active, autoFocus, onEscape, returnFocus]);
  
  return (
    <Component ref={containerRef} className={className}>
      {children}
    </Component>
  );
}

/**
 * Example usage:
 * 
 * <FocusTrap 
 *   active={isModalOpen} 
 *   onEscape={() => setIsModalOpen(false)}
 * >
 *   <div className="modal">
 *     <h2>Modal Title</h2>
 *     <button>Focusable Element</button>
 *     <button onClick={() => setIsModalOpen(false)}>Close</button>
 *   </div>
 * </FocusTrap>
 */