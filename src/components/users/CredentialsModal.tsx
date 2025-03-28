import React, { useState } from 'react';
import { Copy, X, CheckCircle, Key, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CredentialsModalProps {
  loginEmail: string;
  onClose: () => void;
  onResetPassword: () => Promise<string>;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  loginEmail,
  onClose,
  onResetPassword
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(loginEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };
  
  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    }
  };
  
  const handleResetPassword = async () => {
    try {
      setIsResetting(true);
      setError(null);
      const newPassword = await onResetPassword();
      setPassword(newPassword);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            User Credentials
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
            <Key className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              These are the admin panel login credentials. You can reset the password if needed.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">Login Email</div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm tracking-wider bg-white py-2 px-4 border border-gray-300 rounded overflow-x-auto max-w-[220px]">
                {loginEmail}
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={copiedEmail ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopyEmail}
                className={copiedEmail ? "text-green-600" : ""}
              >
                {copiedEmail ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          
          {password && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-2">New Password</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm tracking-wider bg-white py-2 px-4 border border-gray-300 rounded">
                  {password}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={copiedPassword ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  onClick={handleCopyPassword}
                  className={copiedPassword ? "text-green-600" : ""}
                >
                  {copiedPassword ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleResetPassword}
              isLoading={isResetting}
              disabled={isResetting}
            >
              Reset Password
            </Button>
            <Button
              variant="primary"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;