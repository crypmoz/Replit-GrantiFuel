import { Link } from 'wouter';
import { Twitter, Linkedin, Instagram, Youtube, Mail, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ];
  
  const productLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'For Organizations', href: '/organizations' },
  ];
  
  const resourceLinks = [
    { label: 'Help Center', href: '/help' },
    { label: 'Grant Database', href: '/grants' },
    { label: 'API', href: '/api-docs' },
    { label: 'Partners', href: '/partners' },
  ];
  
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Accessibility', href: '/accessibility' },
  ];
  
  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: 'https://twitter.com/grantifuel', label: 'Twitter' },
    { icon: <Facebook className="h-5 w-5" />, href: 'https://facebook.com/grantifuel', label: 'Facebook' },
    { icon: <Instagram className="h-5 w-5" />, href: 'https://instagram.com/grantifuel', label: 'Instagram' },
    { icon: <Linkedin className="h-5 w-5" />, href: 'https://linkedin.com/company/grantifuel', label: 'LinkedIn' },
    { icon: <Youtube className="h-5 w-5" />, href: 'https://youtube.com/c/grantifuel', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg mr-2">G</div>
              <span className="text-xl font-bold">GrantiFuel</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Empowering musicians and artists to secure funding for their creative endeavors through innovative technology.
            </p>
            
            {/* Newsletter signup */}
            <div className="mt-6">
              <p className="font-medium mb-2">Subscribe to our newsletter</p>
              <div className="flex max-w-sm">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="rounded-r-none"
                />
                <Button className="rounded-l-none">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Links section */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <div className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-400 transition-colors cursor-pointer">
                      {link.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <div className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-400 transition-colors cursor-pointer">
                      {link.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <div className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-400 transition-colors cursor-pointer">
                      {link.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <div className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-400 transition-colors cursor-pointer">
                      {link.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © {currentYear} GrantiFuel, Inc. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}