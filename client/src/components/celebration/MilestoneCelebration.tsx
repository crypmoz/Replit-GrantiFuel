import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, ArrowUp, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MilestoneConfigType = {
  [key in 'progress' | 'submission' | 'approval']: {
    title: (value?: number) => string;
    description: (value?: number, grantName?: string) => string;
    icon: (value?: number) => React.ReactNode;
    color: (value?: number) => string;
  }
};

export interface MilestoneProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    type: 'progress' | 'submission' | 'approval';
    value?: number;
    grantName?: string;
  };
}

const milestoneConfig: MilestoneConfigType = {
  progress: {
    title: (value?: number) => `${value || 0}% Complete!`,
    description: (value?: number) => {
      const val = value || 0;
      return val === 25 ? "Great start! You're on your way." :
        val === 50 ? "Halfway there! Keep up the momentum." :
        val === 75 ? "Almost there! The finish line is in sight." :
        "Amazing progress!";
    },
    icon: (value?: number) => {
      const val = value || 0;
      return val === 25 ? <ArrowUp className="h-10 w-10 text-blue-500" /> :
        val === 50 ? <Sparkles className="h-10 w-10 text-purple-500" /> :
        val === 75 ? <Star className="h-10 w-10 text-amber-500" /> :
        <CheckCircle className="h-10 w-10 text-green-500" />;
    },
    color: (value?: number) => {
      const val = value || 0;
      return val === 25 ? 'bg-blue-100 border-blue-300 text-blue-800' :
        val === 50 ? 'bg-purple-100 border-purple-300 text-purple-800' :
        val === 75 ? 'bg-amber-100 border-amber-300 text-amber-800' :
        'bg-green-100 border-green-300 text-green-800';
    },
  },
  submission: {
    title: () => "Application Submitted!",
    description: (_value: number | undefined, grantName?: string) => 
      `Congratulations! Your application for ${grantName || 'the grant'} has been submitted.`,
    icon: () => <CheckCircle className="h-10 w-10 text-green-500" />,
    color: () => 'bg-green-100 border-green-300 text-green-800',
  },
  approval: {
    title: () => "Grant Approved!",
    description: (_value: number | undefined, grantName?: string) => 
      `Amazing news! Your application for ${grantName || 'the grant'} has been approved.`,
    icon: () => <Trophy className="h-10 w-10 text-amber-500" />,
    color: () => 'bg-amber-100 border-amber-300 text-amber-800',
  }
};

export default function MilestoneCelebration({ isOpen, onClose, milestone }: MilestoneProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const config = milestoneConfig[milestone.type];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <ConfettiEffect />
            </div>
          )}
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className={`relative p-6 rounded-lg shadow-xl border-2 max-w-md w-full ${config.color(milestone.value as number)}`}
          >
            <div className="absolute -top-5 -right-5">
              <motion.div
                initial={{ rotate: -10, y: 10 }}
                animate={{ rotate: 0, y: 0 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
              >
                {config.icon(milestone.value as number)}
              </motion.div>
            </div>
            
            <div className="text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold mb-2">
                  {config.title(milestone.value as number)}
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-lg mb-6">
                  {config.description(milestone.value as number, milestone.grantName)}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  onClick={onClose}
                  size="lg"
                  className="font-medium"
                >
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// For simplicity, we'll use animated shapes to simulate confetti
// In a production app, you'd use a more sophisticated confetti library
function ConfettiEffect() {
  return (
    <div className="w-full h-full overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: -20,
            rotate: Math.random() * 360,
            opacity: 1
          }}
          animate={{ 
            y: window.innerHeight + 50,
            rotate: Math.random() * 360 * 2,
            opacity: 0
          }}
          transition={{ 
            duration: Math.random() * 2 + 2, 
            ease: "linear",
            delay: Math.random() * 0.5
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ 
            backgroundColor: [
              '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
              '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
              '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
              '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
            ][Math.floor(Math.random() * 16)],
            zIndex: 999
          }}
        />
      ))}
    </div>
  );
}