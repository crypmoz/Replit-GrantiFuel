import { useState, useCallback, useEffect } from 'react';

// Define milestone thresholds
const PROGRESS_MILESTONES = [25, 50, 75, 100];

type MilestoneType = 'progress' | 'submission' | 'approval';

interface Milestone {
  type: MilestoneType;
  value?: number;
  grantName?: string;
}

interface MilestoneCelebrationState {
  showCelebration: boolean;
  currentMilestone: Milestone | null;
  triggerCelebration: (milestone: Milestone) => void;
  closeCelebration: () => void;
}

/**
 * Hook to manage milestone celebrations in the application
 * 
 * @param initialProgress - Initial progress value to check for milestones
 * @param onMilestoneReached - Optional callback when a milestone is reached
 * @returns State and handlers for milestone celebrations
 */
export function useMilestoneCelebration(
  initialProgress?: number,
  onMilestoneReached?: (milestone: Milestone) => void
): MilestoneCelebrationState {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [lastTriggeredMilestones, setLastTriggeredMilestones] = useState<Set<string>>(new Set());

  // Check if a progress milestone has been reached
  useEffect(() => {
    if (initialProgress !== undefined) {
      for (const milestone of PROGRESS_MILESTONES) {
        const milestoneKey = `progress-${milestone}`;
        
        // Only trigger if:
        // 1. Current progress is at or above this milestone
        // 2. This specific milestone hasn't been triggered before
        // 3. We're not already showing a celebration
        if (
          initialProgress >= milestone && 
          !lastTriggeredMilestones.has(milestoneKey) &&
          !showCelebration
        ) {
          const newMilestone: Milestone = {
            type: 'progress',
            value: milestone
          };
          
          triggerCelebration(newMilestone);
          
          // Update the set of triggered milestones
          const updatedMilestones = new Set(lastTriggeredMilestones);
          updatedMilestones.add(milestoneKey);
          setLastTriggeredMilestones(updatedMilestones);
          
          if (onMilestoneReached) {
            onMilestoneReached(newMilestone);
          }
          
          break; // Only show one celebration at a time
        }
      }
    }
  }, [initialProgress, lastTriggeredMilestones, showCelebration, onMilestoneReached]);

  // Trigger celebration with a specific milestone
  const triggerCelebration = useCallback((milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setShowCelebration(true);
  }, []);

  // Close the celebration modal
  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    showCelebration,
    currentMilestone,
    triggerCelebration,
    closeCelebration
  };
}

// Export other useful functions for milestone management
export function getNextMilestone(currentProgress: number): number | null {
  for (const milestone of PROGRESS_MILESTONES) {
    if (currentProgress < milestone) {
      return milestone;
    }
  }
  return null;
}

export function getMilestoneProgress(currentProgress: number): { 
  currentMilestone: number | null;
  nextMilestone: number | null;
  progressToNextMilestone: number;
} {
  let currentMilestone: number | null = null;
  let nextMilestone: number | null = null;
  
  // Find the highest milestone achieved
  for (let i = PROGRESS_MILESTONES.length - 1; i >= 0; i--) {
    if (currentProgress >= PROGRESS_MILESTONES[i]) {
      currentMilestone = PROGRESS_MILESTONES[i];
      break;
    }
  }
  
  // Find the next milestone
  for (const milestone of PROGRESS_MILESTONES) {
    if (currentProgress < milestone) {
      nextMilestone = milestone;
      break;
    }
  }
  
  // Calculate progress toward next milestone
  const progressToNextMilestone = nextMilestone 
    ? (currentProgress - (currentMilestone || 0)) / (nextMilestone - (currentMilestone || 0)) * 100
    : 100;
    
  return {
    currentMilestone,
    nextMilestone,
    progressToNextMilestone
  };
}