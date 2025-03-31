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
  const { signIn, isAuthenticated } = useAuth();
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
  
  // Cleanup function to dismiss any existing toasts
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
      
      // Start full-screen loading state for redirect phase ONLY
      startLoading('Redirecting to dashboard...');
      
      // Delay navigation slightly to show transition
      const redirectTimer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
    
    // Return cleanup function
    return () => {
      if (authSuccessful.current) {
        stopLoading();
      }
    };
  }, [isAuthenticated, navigate, location, startLoading, stopLoading]);

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
      toastIdRef.current = toast.success('Authentication successful');
      
      // Note: we don't need to call startLoading here as the useEffect for isAuthenticated
      // will handle showing the loading state during redirect
      
    } catch (err: any) {
      console.error('Login error:', err);
      setIsSubmitting(false);
      
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
      
      // Show toast notification for error (with custom ID)
      toastIdRef.current = toast.error(errorMessage);
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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