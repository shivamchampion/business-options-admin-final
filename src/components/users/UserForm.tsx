import React, { useState, useEffect } from 'react';
import { X, User, Mail, UserCheck, Upload, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { UserRole, UserDetails } from '@/types/firebase';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';

// Form validation schema
const userFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(['admin', 'moderator', 'advisor', 'super_admin', 'user'])
        .refine(val => val !== 'user', {
            message: "Cannot create website users from admin panel",
        })
        .refine(val => val !== 'super_admin', {
            message: "Super Admin users cannot be created",
        }),
});

interface UserFormProps {
    onClose: () => void;
    onSubmit: (userData: Partial<UserDetails>, profileImage?: File) => Promise<{loginEmail: string, password: string} | undefined>;
    user?: UserDetails;
    isEdit?: boolean;
}

interface CreatedCredentials {
    loginEmail: string;
    password: string;
}

const UserForm: React.FC<UserFormProps> = ({
    onClose,
    onSubmit,
    user,
    isEdit = false
}) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<UserRole>(user?.role as UserRole || UserRole.MODERATOR);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profileImageUrl || null);
    const [errors, setErrors] = useState<{ name?: string, email?: string, role?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New states for showing created credentials
    const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
    const [showCreatedUser, setShowCreatedUser] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    const validateForm = (): boolean => {
        try {
            userFormSchema.parse({ name, email, role });
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: { name?: string, email?: string, role?: string } = {};
                error.errors.forEach(err => {
                    if (err.path[0] === 'name' || err.path[0] === 'email' || err.path[0] === 'role') {
                        newErrors[err.path[0] as 'name' | 'email' | 'role'] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
      
        if (!validateForm()) {
          return;
        }
      
        setIsSubmitting(true);
      
        try {
          const result = await onSubmit({
            id: user?.id,
            name,
            email,
            role,
          }, profileImage || undefined);
          
          // If we have credentials returned, show them
          if (result && result.loginEmail && result.password) {
            setCreatedCredentials({
              loginEmail: result.loginEmail,
              password: result.password
            });
            setShowCreatedUser(true);
          } else {
            onClose();
          }
        } catch (error: any) {
          console.error('Error submitting form:', error);
          if (error.message.includes('email')) {
            setErrors(prev => ({ ...prev, email: error.message }));
          } else {
            // Display more user-friendly error messages
            const errorMessage = error.message || 'Something went wrong. Please try again.';
            alert(`Error: ${errorMessage}`);
          }
        } finally {
          setIsSubmitting(false);
        }
      };
    
    const handleCopyEmail = () => {
        if (createdCredentials) {
            navigator.clipboard.writeText(createdCredentials.loginEmail);
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 3000);
        }
    };
    
    const handleCopyPassword = () => {
        if (createdCredentials) {
            navigator.clipboard.writeText(createdCredentials.password);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 3000);
        }
    };
    
    // Render credentials view if user was created
    if (showCreatedUser && createdCredentials) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-gray-900">
                            User Created Successfully
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-sm text-green-700">
                                User account has been created successfully. Please save these login credentials to share with the user.
                            </p>
                        </div>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-2">Login Email</div>
                            <div className="flex items-center justify-between">
                                <div className="font-mono text-sm tracking-wider bg-white py-2 px-4 border border-gray-300 rounded overflow-x-auto max-w-[220px]">
                                    {createdCredentials.loginEmail}
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
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-2">Password</div>
                            <div className="flex items-center justify-between">
                                <div className="font-mono text-sm tracking-wider bg-white py-2 px-4 border border-gray-300 rounded">
                                    {createdCredentials.password}
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
                        
                        <div className="flex justify-end">
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
    }

    // Normal form view
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">
                        {isEdit ? 'Edit User' : 'Add New User'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Profile image upload */}
                    <div className="text-center mb-6">
                        <div className="inline-block">
                            {/* Image container */}
                            <div className="relative inline-block">
                                {/* Image or placeholder */}
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-10 w-10 text-gray-400" />
                                    )}
                                </div>

                                {/* Upload button */}
                                <label
                                    htmlFor="profile-image"
                                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer shadow hover:bg-blue-600 transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    <input
                                        id="profile-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            {/* Helper text */}
                            <p className="text-xs text-gray-500 mt-2">
                                Upload profile image (optional)
                            </p>
                        </div>
                    </div>

                    {/* Name field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                className={cn(
                                    "block w-full pl-10 pr-3 py-2 form-input",
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                )}
                                placeholder="Enter full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                className={cn(
                                    "block w-full pl-10 pr-3 py-2 form-input",
                                    errors.email ? 'border-red-300' : 'border-gray-300'
                                )}
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isEdit} // Email cannot be edited once created
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Role field */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            User Role
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserCheck className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                id="role"
                                className={cn(
                                    "block w-full pl-10 pr-3 py-2 form-input",
                                    errors.role ? 'border-red-300' : 'border-gray-300'
                                )}
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                disabled={isEdit} // Role cannot be edited once created
                            >
                                <option value={UserRole.ADMIN}>Admin</option>
                                <option value={UserRole.MODERATOR}>Moderator</option>
                                <option value={UserRole.ADVISOR}>Advisor</option>
                            </select>
                        </div>
                        {errors.role && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                {errors.role}
                            </p>
                        )}
                    </div>

                    {!isEdit && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <p>
                                A random login email and password will be generated for the admin panel.
                                You'll be able to share these credentials with the user.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;