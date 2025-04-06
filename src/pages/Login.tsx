import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import toast from 'react-hot-toast';

// Enhanced validation schema with more specific error messages
const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading, error } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({});
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Refs to track form state
  const isRedirecting = useRef(false);
  const toastIdRef = useRef<string | null>(null);
  const authSuccessful = useRef(false);
  
  // Check if we're returning from a sign-out
  const isReturningFromSignOut = useRef(false);
  
  // Dismiss any existing toasts
  const dismissToasts = () => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  // Handle redirection once authenticated
  useEffect(() => {
    if (isAuthenticated && !isRedirecting.current) {
      isRedirecting.current = true;
      authSuccessful.current = true;
      
      const from = location.state?.from?.pathname || '/';
      
      // Always show authentication success toast
      toastIdRef.current = toast.success('Authentication successful! Redirecting to dashboard...', {
        id: 'login-success-toast',
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: 500,
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      });
      
      // Delay navigation to allow toast to be visible
      const redirectTimer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
    
    // Return cleanup function
    return () => {
      if (authSuccessful.current) {
        stopLoading();
      }
    };
  }, [isAuthenticated, navigate, location, stopLoading]);

  // Check if we're returning from a sign-out
  useEffect(() => {
    // Check if we have a "signedOut" flag in session storage
    const signedOut = sessionStorage.getItem('signedOut');
    if (signedOut === 'true') {
      isReturningFromSignOut.current = true;
      // Clear the flag
      sessionStorage.removeItem('signedOut');
      
      // We don't need to show the toast here anymore as it's shown in the AuthContext
      // when performing the logout operation
    }
    
    // Cleanup function
    return () => {
      dismissToasts();
    };
  }, []);

  // Clear auth error when user types
  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [email, password]);

  // Cleanup when component mounts and unmounts
  useEffect(() => {
    // Ensure any lingering loading state is cleared when Login page mounts
    stopLoading();
    
    return () => {
      dismissToasts();
    };
  }, [stopLoading]);

  // Field validation on blur
  const validateField = (field: 'email' | 'password', value: string) => {
    try {
      // Try to parse the field value through Zod
      loginSchema.shape[field].parse(value);
      
      // Update form errors - remove error for this field if valid
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message;
        setFormErrors(prev => ({ ...prev, [field]: message }));
        return false;
      }
      return true;
    }
  };

  // Validate entire form before submission
  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Dismiss any existing toasts first
        dismissToasts();
        
        const newErrors: {email?: string, password?: string} = {};
        error.errors.forEach(err => {
          if (err.path[0] === 'email' || err.path[0] === 'password') {
            newErrors[err.path[0] as 'email' | 'password'] = err.message;
          }
        });
        setFormErrors(newErrors);
        
        // Show toast for critical validation errors
        const errorMessages = Object.values(newErrors).filter(Boolean);
        if (errorMessages.length > 0) {
          toastIdRef.current = toast.error(errorMessages[0] || 'Please check your form input');
        }
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous auth errors
    setAuthError(null);
    
    // Dismiss any existing toasts
    dismissToasts();
    
    // Reset any previous success state
    authSuccessful.current = false;
    isRedirecting.current = false;
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    // Set button loading state only
    setIsSubmitting(true);
    
    try {
      // Attempt authentication - this will only show loading on the button
      await signIn(email, password, remember);
      
      // Handle successful authentication
      authSuccessful.current = true;
      
      // Don't show success toast here - it will be shown in the useEffect
      // based on the loginSuccess flag set in AuthContext
      
      // Note: we don't need to call startLoading here as the useEffect for isAuthenticated
      // will handle showing the loading state during redirect
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Let the AuthContext handle showing the error message
      // Don't set duplicate error messages here
      
      setIsSubmitting(false);
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isRedirecting.current) {
    return null; // Return null to prevent flash of login form
  }

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

              {/* Authentication Error Message */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm border border-red-200 animate-fade-in mb-6">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Authentication Error Message */}
                {authError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm border border-red-200 animate-fade-in">
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
                        formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#0031ac] focus:border-[#0031ac]'
                      } rounded-lg focus:outline-none focus:ring-1 transition duration-150`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => validateField('email', email)}
                      disabled={isSubmitting || isLoading}
                      aria-invalid={!!formErrors.email}
                      aria-describedby={formErrors.email ? "email-error" : undefined}
                    />
                    {!formErrors.email && email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {formErrors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
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
                    <a 
                      href="#" 
                      className="text-xs font-medium text-[#0031ac] hover:text-blue-700 transition duration-150"
                      onClick={(e) => {
                        e.preventDefault();
                        dismissToasts();
                        toastIdRef.current = toast.error('Password reset functionality not implemented yet');
                      }}
                    >
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
                        formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#0031ac] focus:border-[#0031ac]'
                      } rounded-lg focus:outline-none focus:ring-1 transition duration-150`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => validateField('password', password)}
                      disabled={isSubmitting || isLoading}
                      aria-invalid={!!formErrors.password}
                      aria-describedby={formErrors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
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
                    disabled={isSubmitting || isLoading}
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
                  isLoading={isSubmitting || isLoading}
                  fullWidth
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
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