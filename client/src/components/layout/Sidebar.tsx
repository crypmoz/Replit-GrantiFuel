import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Music, Home, DollarSign, Users, FileText, 
  LayoutTemplate, Zap, LogOut, BookOpen, Settings, User as UserIcon,
  Shield, UserCog, Search, Gauge, BrainCircuit, BarChart, Award
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles?: string[]; // Array of roles that can see this nav item
}

// Define navigation items with role access control
const navItems: NavItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: <Home className="h-5 w-5 mr-3" />,
    // Dashboard is available to all authenticated users
  },
  { 
    href: '/grants', 
    label: 'My Grants', 
    icon: <DollarSign className="h-5 w-5 mr-3" />,
    // Grants overview is visible to all users
  },
  { 
    href: '/grants/new', 
    label: 'Create Grant', 
    icon: <DollarSign className="h-5 w-5 mr-3" />,
    allowedRoles: ['grant_writer'] // Only grant writers can create grants
  },
  { 
    href: '/artists', 
    label: 'Artists', 
    icon: <Users className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin', 'grant_writer', 'manager'] // Only admins, grant writers, and managers can see all artists
  },
  { 
    href: '/applications', 
    label: 'Applications', 
    icon: <FileText className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin', 'grant_writer', 'manager'] // Manager-level role minimum
  },
  // Templates feature removed - considered useless 
  /*
  { 
    href: '/templates', 
    label: 'Templates', 
    icon: <LayoutTemplate className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin', 'grant_writer', 'manager', 'artist'] // Artist-level role minimum
  },
  */
  { 
    href: '/ai-assistant', 
    label: 'AI Assistant', 
    icon: <Zap className="h-5 w-5 mr-3" />,
    // AI Assistant visible to all authenticated users with proper subscription
  },
  { 
    href: '/find-grants', 
    label: 'Find Grants', 
    icon: <Search className="h-5 w-5 mr-3" />,
    // Find Grants visible to all authenticated users
  },
  { 
    href: '/documents', 
    label: 'Documents', 
    icon: <BookOpen className="h-5 w-5 mr-3" />,
    // Documents visible to all authenticated users
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    icon: <UserIcon className="h-5 w-5 mr-3" />,
    // All users can access their profile
  },
  { 
    href: '/progress', 
    label: 'Your Progress', 
    icon: <Award className="h-5 w-5 mr-3" />,
    // All users can access their progress dashboard
  },
  { 
    href: '/settings', 
    label: 'Settings', 
    icon: <Settings className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin', 'grant_writer'] // Only admins and grant writers can access settings
  },
  { 
    href: '/admin', 
    label: 'Admin Dashboard', 
    icon: <Gauge className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin'] // Only admins can access admin dashboard
  },
  { 
    href: '/admin/users', 
    label: 'User Management', 
    icon: <UserCog className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin'] // Only admins can access user management
  },
  { 
    href: '/admin/ai-controls', 
    label: 'AI Controls', 
    icon: <BrainCircuit className="h-5 w-5 mr-3" />,
    allowedRoles: ['admin'] // Only admins can access AI controls
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  // Keep backward compatibility with previous implementations that might use this query
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
    // Use the proper logout mutation from the auth context
    logoutMutation.mutate();
  };

  return (
    <div 
      id="sidebar"
      className={`${isOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/" 
          className="flex items-center space-x-2"
          aria-label="Go to home page"
        >
          <div className="bg-primary text-white p-2 rounded-lg" aria-hidden="true">
            <Music className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">GrantiFuel</span>
        </Link>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
          aria-expanded={isOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Application">
          <ul className="space-y-1">
            {navItems.map((item) => {
              // Check if user has permission to see this navigation item
              const hasPermission = !item.allowedRoles || 
                                   !item.allowedRoles.length || 
                                   (user && item.allowedRoles.includes(user.role));
              
              // Skip rendering items the user doesn't have permission to see
              if (!hasPermission) return null;
              
              const isActive = location === item.href || 
                            (item.href === '/dashboard' && location === '/');
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 py-2 mt-auto border-t border-gray-200 dark:border-gray-700" role="contentinfo">
          <div className="flex items-center space-x-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={`${currentUser.name || 'User'}'s avatar`} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div 
                  className="h-full w-full flex items-center justify-center bg-primary text-white"
                  role="img"
                  aria-label={`${currentUser?.name || 'User'}'s avatar`}
                >
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || currentUser?.name || 'Loading...'}
              </p>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || currentUser?.email || 'user@example.com'}
                </p>
                {user?.role && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100 rounded-full">
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <Button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center"
              variant="default"
              aria-label="Sign out of your account"
            >
              <span aria-hidden="true"><LogOut className="h-4 w-4 mr-2" /></span>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
