import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Moon, Sun, Bell, Settings, LogOut, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get page title based on current route
  const getPageTitle = () => {
    if (location === '/' || location === '/dashboard') return 'Dashboard';
    return location.substring(1).charAt(0).toUpperCase() + location.substring(2);
  };

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    const items = [{ label: 'Home', href: '/' }];
    
    if (location !== '/') {
      const path = location.substring(1);
      items.push({
        label: path.charAt(0).toUpperCase() + path.slice(1),
        href: location,
      });
    }
    
    return items;
  };

  const breadcrumbs = getBreadcrumbs();
  
  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700" role="banner">
      <div className="flex justify-between items-center px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button 
            id="openSidebarBtn"
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 md:hidden mr-3 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Open navigation menu"
            aria-expanded="false"
            aria-controls="sidebar"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:hidden">{getPageTitle()}</h1>
          <div className="hidden md:flex md:items-center">
            <nav className="flex space-x-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((item, index) => (
                  <li key={item.href}>
                    <div className="flex items-center">
                      {index > 0 && (
                        <svg 
                          className="flex-shrink-0 h-5 w-5 text-gray-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor" 
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {index === breadcrumbs.length - 1 ? (
                        <span 
                          className={index > 0 ? "ml-2 text-gray-700 dark:text-gray-300" : "text-primary dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"}
                          aria-current="page"
                        >
                          {item.label}
                        </span>
                      ) : (
                        <Link 
                          href={item.href}
                          className={index > 0 ? "ml-2 text-primary dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:underline" : "text-primary dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:underline"}
                          aria-label={`Go to ${item.label}`}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
        <div className="flex items-center space-x-3" role="toolbar" aria-label="User actions">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="User menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || undefined} alt="" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">
                    Open user menu for {user.name || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="focus:outline-none focus:bg-accent">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="focus:outline-none focus:bg-accent">
                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="focus:outline-none focus:bg-accent">
                    <DollarSign className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Pricing & Plans</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="focus:outline-none focus:bg-accent"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
