import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';

// Simple validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, error, isAuthenticated } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({});
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle redirection once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear auth error when user types
  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [email, password]);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      stopLoading();
    };
  }, []);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {email?: string, password?: string} = {};
        error.errors.forEach(err => {
          if (err.path[0] === 'email' || err.path[0] === 'password') {
            newErrors[err.path[0] as 'email' | 'password'] = err.message;
          }
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous auth errors
    setAuthError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    // We'll only show loading on the button for initial submission
    // but not the full-screen overlay yet
    
    try {
      // Authenticate the user
      await signIn(email, password, remember);
      
      // Only show full-screen loading if authentication succeeded
      startLoading('Redirecting to dashboard...');
      
    } catch (err: any) {
      console.error('Login error:', err);
      setIsSubmitting(false); // Stop button loading immediately
      
      // Create user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
            errorMessage = 'We couldn\'t find an account with this email. Please check your email or create a new account.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'The password you entered is incorrect. Please try again or reset your password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. For your security, please try again later or reset your password.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact your administrator.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid login credentials. Please check your email and password.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network connection error. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = 'Authentication failed. Please try again or contact support.';
        }
      } else if (err.message && err.message.includes('Access denied')) {
        errorMessage = 'Your account doesn\'t have permission to access the admin panel. Please contact your administrator.';
      } else if (err.message && err.message.includes('User not found in system')) {
        errorMessage = 'Your account exists but is not configured correctly. Please contact your administrator.';
      }
      
      // Set the error message in the form
      setAuthError(errorMessage);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-[#0031ac] px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white p-3 rounded-xl shadow-lg">
              <img src="/logo.svg" alt="Business Options" className="h-12 w-auto" />
            </div>
          </div>
          
          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                Sign In
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Enter your credentials to access admin panel
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Authentication Error Message */}
                {authError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac]`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <a href="#" className="text-xs font-medium text-[#0031ac] hover:text-blue-700">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className={`block w-full pl-10 pr-10 py-2.5 border ${
                        formErrors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac]`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      {formErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#0031ac] focus:ring-blue-500 border-gray-300 rounded"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  fullWidth
                  disabled={isSubmitting}
                >
                  Sign in
                </Button>
              </form>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-center text-sm text-white/70">
            <p>&copy; 2025 Business Options. All rights reserved.</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}