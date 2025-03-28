import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  getAuth, 
  sendEmailVerification, 
  reload 
} from 'firebase/auth';
import { useLoading } from '@/context/LoadingContext';
import { verifyUserAndSetPassword } from '@/services/userService';
import { AlertCircle, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Validation schema for verification
const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startLoading, stopLoading } = useLoading();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{code?: string, password?: string, confirmPassword?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setUserId(id);
    } else {
      // No ID provided, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate]);
  
  const validateForm = () => {
    try {
      verificationSchema.parse({ code, password, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {code?: string, password?: string, confirmPassword?: string} = {};
        error.errors.forEach(err => {
          if (err.path[0] === 'code' || err.path[0] === 'password' || err.path[0] === 'confirmPassword') {
            newErrors[err.path[0] as 'code' | 'password' | 'confirmPassword'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) {
      return;
    }
    
    setIsSubmitting(true);
    startLoading('Setting up your account...');
    
    try {
      // Verify user and create Firebase Authentication account
      await verifyUserAndSetPassword(userId, code, password);
      
      // Set success state to show email verification instructions
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Error verifying account:', error);
      setErrors(prev => ({ ...prev, code: error.message }));
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };
  
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-8 text-center">
            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost There!</h1>
            <p className="text-gray-600 mb-6">
              An email verification link has been sent to your email address. 
              Please check your inbox and click the link to complete your account setup.
            </p>
            
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={() => {
                  // Resend verification email
                  const auth = getAuth();
                  if (auth.currentUser) {
                    sendEmailVerification(auth.currentUser);
                  }
                }}
                fullWidth
              >
                Resend Verification Email
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                fullWidth
              >
                Go to Login
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-8">
            <h1 className="text-2xl font-bold text-white text-center">Verify Your Account</h1>
          </div>
          
          <div className="p-8">
            <p className="text-gray-600 mb-6 text-center">
              Enter your verification code and create a password to complete your account setup.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  className={cn(
                    "form-input w-full py-3 px-4 text-center font-mono text-lg tracking-wider",
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    {errors.code}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={cn(
                    "form-input w-full",
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    {errors.password}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                 id="confirmPassword"
                 type="password"
                 className={cn(
                   "form-input w-full",
                   errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                 )}
                 placeholder="Confirm your password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
               />
               {errors.confirmPassword && (
                 <p className="mt-1 text-sm text-red-600 flex items-center">
                   <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                   {errors.confirmPassword}
                 </p>
               )}
             </div>
             
             <Button
               type="submit"
               variant="primary"
               isLoading={isSubmitting}
               disabled={isSubmitting}
               fullWidth
             >
               Verify & Create Password
             </Button>
           </form>
           
           <p className="mt-6 text-sm text-gray-500 text-center">
             Having trouble? Contact support at support@businessoptions.com
           </p>
         </div>
       </div>
     </div>
   </ErrorBoundary>
 );
}