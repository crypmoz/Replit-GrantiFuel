import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
  variant?: 'default' | 'secondary' | 'success' | 'destructive';
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
  className,
}: StatsCardProps) {
  // Color mappings based on variant
  const variantStyles = {
    default: {
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    secondary: {
      bgColor: 'bg-secondary/10 dark:bg-secondary/20',
      iconColor: 'text-secondary-foreground',
      borderColor: 'border-secondary/20',
    },
    success: {
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-900',
    },
    destructive: {
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-900',
    },
  };

  const { bgColor, iconColor, borderColor } = variantStyles[variant];

  return (
    <Card className={cn(
      "overflow-hidden shadow-sm hover:shadow transition-all", 
      `border-l-4 ${borderColor}`, 
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("flex-shrink-0 rounded-md p-2.5", bgColor)}>
            <div className={cn("h-5 w-5", iconColor)}>
              {icon}
            </div>
          </div>
          <div className="w-full">
            <h3 className="text-sm font-medium text-muted-foreground truncate mb-1">
              {title}
            </h3>
            <div className="text-2xl font-bold">
              {value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
