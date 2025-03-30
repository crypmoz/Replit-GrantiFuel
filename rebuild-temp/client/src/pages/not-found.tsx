import { Link } from "wouter";
import { useTheme } from "@/hooks/use-theme";

export default function NotFound() {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-6xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
          404
        </h1>
        
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Page not found
        </h2>
        
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-8">
          <Link href="/">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-md shadow-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors">
              Return to Dashboard
            </button>
          </Link>
        </div>
        
        <div className="mt-12">
          <img 
            src={`/images/404-${resolvedTheme === 'dark' ? 'dark' : 'light'}.svg`} 
            alt="404 Illustration" 
            className="max-w-sm mx-auto"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}