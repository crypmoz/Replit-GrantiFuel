import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../App';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { loginMutation, registerMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate(
        { username, password },
        {
          onError: (error) => {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      if (!name || !email) {
        toast({
          title: 'Registration failed',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }
      
      registerMutation.mutate(
        { username, password, name, email },
        {
          onError: (error) => {
            toast({
              title: 'Registration failed',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Info section - Full height on mobile, half width on desktop */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 md:w-1/2 py-10 px-6 md:p-12 flex justify-center items-center text-white">
        <div className="max-w-md text-center md:text-left">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-white">GrantiFuel</h1>
            <div className="h-1 w-24 bg-purple-300 mx-auto md:mx-0 mb-6"></div>
            <p className="text-xl text-purple-100 mb-8 leading-relaxed">
              Elevate your music career with our intelligent grant application platform designed for artists.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="flex flex-col items-center md:items-start">
              <div className="p-3 bg-white/10 rounded-lg mb-3">
                <svg 
                  className="h-7 w-7 text-purple-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">AI Assistant</h3>
              <p className="text-purple-200 text-sm">Get intelligent help with application writing</p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="p-3 bg-white/10 rounded-lg mb-3">
                <svg 
                  className="h-7 w-7 text-purple-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">Templates</h3>
              <p className="text-purple-200 text-sm">Use proven formats for faster applications</p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="p-3 bg-white/10 rounded-lg mb-3">
                <svg 
                  className="h-7 w-7 text-purple-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">Deadlines</h3>
              <p className="text-purple-200 text-sm">Never miss important grant dates</p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="p-3 bg-white/10 rounded-lg mb-3">
                <svg 
                  className="h-7 w-7 text-purple-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">Analytics</h3>
              <p className="text-purple-200 text-sm">Track your application success rates</p>
            </div>
          </div>
          
          <div className="hidden md:block text-center md:text-left">
            <span className="inline-block bg-purple-500/20 text-purple-200 px-4 py-2 rounded-full text-sm font-medium">
              Join musicians who've secured over $2M in funding
            </span>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="md:w-1/2 flex justify-center items-center py-10 px-6 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-gray-600">
              {isLogin 
                ? "Access your grant applications and tools" 
                : "Start your journey to music funding success"}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending || registerMutation.isPending}
                className="w-full py-3 px-4 rounded-lg shadow-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                {loginMutation.isPending || registerMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  {isLogin ? 'Sign up now' : 'Sign in'}
                </button>
              </p>
            </div>
          </form>
          
          {isLogin && (
            <div className="mt-8 text-center">
              <button 
                type="button"
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}