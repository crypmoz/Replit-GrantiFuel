import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiProps {
  duration?: number;
  className?: string;
  particleCount?: number;
  startDelay?: number;
}

export function Confetti({ 
  duration = 3000, 
  className,
  particleCount = 100,
  startDelay = 0,
}: ConfettiProps) {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Add delay before showing confetti
    const delayTimeout = setTimeout(() => {
      // Generate random confetti particles
      const newParticles: JSX.Element[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Random properties for variety
        const size = Math.random() * 10 + 5; // 5-15px
        const initialX = Math.random() * 100; // 0-100%
        const initialY = Math.random() * -20 - 10; // -30 to -10%
        const rotation = Math.random() * 360; // 0-360deg
        const duration = Math.random() * 2 + 2; // 2-4s
        const delay = Math.random() * 0.5; // 0-0.5s
        
        // Random colors
        const colors = [
          "bg-primary", 
          "bg-primary/80",
          "bg-blue-500", 
          "bg-green-500", 
          "bg-yellow-500", 
          "bg-pink-500",
          "bg-purple-500"
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Random particle type (circle or rectangle)
        const isCircle = Math.random() > 0.5;
        
        newParticles.push(
          <div
            key={i}
            className={cn(
              "absolute",
              color,
              isCircle ? "rounded-full" : "rounded-sm"
            )}
            style={{
              width: `${size}px`,
              height: isCircle ? `${size}px` : `${size * 0.6}px`,
              left: `${initialX}%`,
              top: `${initialY}%`,
              transform: `rotate(${rotation}deg)`,
              animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`
            }}
          />
        );
      }
      
      setParticles(newParticles);
      setActive(true);
      
      // Remove confetti after duration
      const hideTimeout = setTimeout(() => {
        setActive(false);
      }, duration);
      
      return () => clearTimeout(hideTimeout);
    }, startDelay);
    
    return () => clearTimeout(delayTimeout);
  }, [duration, particleCount, startDelay]);
  
  if (!active && particles.length === 0) return null;
  
  return (
    <div className={cn(
      "fixed inset-0 pointer-events-none z-50 overflow-hidden",
      active ? "opacity-100" : "opacity-0 transition-opacity duration-500",
      className
    )}>
      {particles}
      
      {/* Add CSS animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        `
      }} />
    </div>
  );
}