import React, { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}