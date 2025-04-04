import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ConfettiProps {
  duration?: number;
  className?: string;
  particleCount?: number;
  startDelay?: number;
}

export function Confetti({ 
  duration = 5000, 
  className,
  particleCount = 100,
  startDelay = 0 
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  
  useEffect(() => {
    // If start delay, wait before activation
    const timer = setTimeout(() => {
      setIsActive(true);
      
      // Auto cleanup after duration
      const cleanupTimer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(cleanupTimer);
    }, startDelay);
    
    return () => clearTimeout(timer);
  }, [duration, startDelay]);
  
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match window
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Define particle properties
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speed: number;
      angle: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];
    
    // Generate random particles
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 10 + 5;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - size,
        size,
        color: `hsl(${Math.random() * 360}, 90%, 70%)`,
        speed: Math.random() * 5 + 2,
        angle: Math.random() * 2 * Math.PI,
        rotation: Math.random() * 2 * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
    
    // Animation loop
    let animationId: number;
    let lastFrameTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime;
      lastFrameTime = now;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activePieces = 0;
      
      particles.forEach(particle => {
        if (particle.y < canvas.height) {
          activePieces++;
          
          // Update position
          particle.y += particle.speed * Math.cos(particle.angle) * deltaTime / 30;
          particle.x += particle.speed * Math.sin(particle.angle) * deltaTime / 30;
          
          // Update rotation
          particle.rotation += particle.rotationSpeed * deltaTime / 30;
          
          // Draw confetti piece
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.fillStyle = particle.color;
          
          // Randomize confetti shape
          const shapeIndex = Math.floor(particle.x * particle.y) % 3;
          if (shapeIndex === 0) {
            // Rectangle
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);
          } else if (shapeIndex === 1) {
            // Circle
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Triangle
            ctx.beginPath();
            ctx.moveTo(0, -particle.size / 2);
            ctx.lineTo(particle.size / 2, particle.size / 2);
            ctx.lineTo(-particle.size / 2, particle.size / 2);
            ctx.closePath();
            ctx.fill();
          }
          
          ctx.restore();
        }
      });
      
      // Stop animation if no active pieces
      if (activePieces > 0 && isActive) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    // Start animation
    animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [isActive, particleCount]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 z-50 pointer-events-none",
        className
      )}
    />
  );
}