import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Music, Home, DollarSign, Users, FileText, LayoutTemplate, Zap, LogOut } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5 mr-3" /> },
  { href: '/grants', label: 'Grants', icon: <DollarSign className="h-5 w-5 mr-3" /> },
  { href: '/artists', label: 'Artists', icon: <Users className="h-5 w-5 mr-3" /> },
  { href: '/applications', label: 'Applications', icon: <FileText className="h-5 w-5 mr-3" /> },
  { href: '/templates', label: 'Templates', icon: <LayoutTemplate className="h-5 w-5 mr-3" /> },
  { href: '/ai-assistant', label: 'AI Assistant', icon: <Zap className="h-5 w-5 mr-3" /> },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/current'],
  });

  // Handle responsive sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleClickOutside = (event: MouseEvent) => {
        const sidebar = document.getElementById('sidebar');
        const openButton = document.getElementById('openSidebarBtn');
        
        if (
          sidebar && 
          !sidebar.contains(event.target as Node) && 
          openButton && 
          !openButton.contains(event.target as Node) && 
          window.innerWidth < 768
        ) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const handleSignOut = () => {
    // Clear any auth data from query client
    queryClient.clear();
    // Redirect to home
    window.location.href = '/';
  };

  return (
    <div 
      id="sidebar"
      className={`${isOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Music className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Grantaroo</span>
        </Link>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
                            (item.href === '/dashboard' && location === '/');
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}>
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-2 mt-auto border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser?.name || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <Button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center"
              variant="default"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
