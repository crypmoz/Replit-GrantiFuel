import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../hooks/use-theme';

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Handle scroll for transparent header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled
      ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md'
      : 'bg-transparent'
  }`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="h-9 w-9 rounded-lg gradient-bg text-white flex items-center justify-center font-bold text-lg mr-2 shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold gradient-text">GrantiFuel</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="text-gray-700 hover:text-purple-700 dark:text-gray-200 dark:hover:text-purple-400 font-medium transition-colors duration-200 cursor-pointer py-1 px-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20">
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-purple-700" />
              )}
            </Button>
            <Button
              variant="outline"
              className="px-5 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 font-medium"
              onClick={() => window.location.href = '/auth'}
            >
              Log in
            </Button>
            <Button 
              className="px-5 gradient-bg-hover shadow-md hover:shadow-lg text-white font-medium transition-all duration-300"
              onClick={() => window.location.href = '/dashboard'}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-purple-700" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="rounded-full"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex flex-col space-y-5">
              {navItems.map((item, index) => (
                <Link key={index} href={item.href}>
                  <div className="text-gray-700 hover:text-purple-700 dark:text-gray-200 dark:hover:text-purple-400 font-medium py-2 px-3 transition-colors duration-200 cursor-pointer rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    {item.label}
                  </div>
                </Link>
              ))}
              <div className="pt-5 mt-2 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 font-medium"
                  onClick={() => window.location.href = '/auth'}
                >
                  Log in
                </Button>
                <Button
                  className="w-full gradient-bg-hover shadow-md text-white font-medium"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}