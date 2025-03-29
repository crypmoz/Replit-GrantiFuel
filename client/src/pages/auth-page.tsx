import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Redirect } from "wouter";
import { z } from "zod";

// Create a simple form validation schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [loginFormData, setLoginFormData] = useState<LoginFormValues>({
    username: "",
    password: "",
  });
  
  const [registerFormData, setRegisterFormData] = useState<RegisterFormValues>({
    username: "",
    password: "",
    name: "",
    email: "",
  });

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      loginSchema.parse(loginFormData);
      setFormErrors({});
      loginMutation.mutate(loginFormData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const onRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      registerSchema.parse(registerFormData);
      setFormErrors({});
      registerMutation.mutate({
        ...registerFormData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Section */}
      <div className="w-full md:w-2/5 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">GrantiFuel</h1>
              <p className="text-muted-foreground mt-2">
                Simplify your grant application process
              </p>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b mb-6">
              <button
                className={`pb-2 px-4 ${
                  isLogin
                    ? "border-b-2 border-primary font-medium text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`pb-2 px-4 ${
                  !isLogin
                    ? "border-b-2 border-primary font-medium text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>

            {isLogin ? (
              <form onSubmit={onLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={loginFormData.username}
                    onChange={(e) =>
                      setLoginFormData({
                        ...loginFormData,
                        username: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.username && (
                    <p className="text-sm text-red-500">{formErrors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={loginFormData.password}
                    onChange={(e) =>
                      setLoginFormData({
                        ...loginFormData,
                        password: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={onRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={registerFormData.name}
                    onChange={(e) =>
                      setRegisterFormData({
                        ...registerFormData,
                        name: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-username" className="text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    value={registerFormData.username}
                    onChange={(e) =>
                      setRegisterFormData({
                        ...registerFormData,
                        username: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.username && (
                    <p className="text-sm text-red-500">{formErrors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={registerFormData.email}
                    onChange={(e) =>
                      setRegisterFormData({
                        ...registerFormData,
                        email: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="reg-password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={registerFormData.password}
                    onChange={(e) =>
                      setRegisterFormData({
                        ...registerFormData,
                        password: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full"
                >
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full md:w-3/5 bg-gradient-to-br from-primary/90 to-primary p-8 flex items-center justify-center text-white">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">
            Streamline Your Grant Applications
          </h1>
          <p className="text-lg mb-8">
            GrantiFuel helps musicians and artists manage grant applications,
            track deadlines, and increase success rates with AI-assisted proposal
            writing.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 backdrop-blur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">AI-Assisted Writing</h3>
                <p className="text-white/80">
                  Get intelligent suggestions for your grant proposals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 backdrop-blur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Deadline Management</h3>
                <p className="text-white/80">
                  Never miss an important application deadline again
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 backdrop-blur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Artist Profiles</h3>
                <p className="text-white/80">
                  Maintain artist info ready for any application
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}