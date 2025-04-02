// src/components/advisors/AdvisorForm.tsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, UserCheck, Upload, AlertCircle, Copy, CheckCircle, Phone, MapPin, Tag, Briefcase, Percent, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import { UserRole, UserDetails, CommissionTier } from '@/types/firebase';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Country, State, City } from 'country-state-city';

// Form validation schema
const advisorFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    phone: z.string().min(1, "Phone number is required"),
    commissionTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    currency: z.string().min(1, "Currency is required"),
    bio: z.string().optional()
});

interface AdvisorFormProps {
    onClose: () => void;
    onSubmit: (advisorData: Partial<UserDetails>, profileImage?: File) => Promise<{loginEmail: string, password: string} | undefined>;
    advisor?: UserDetails;
    isEdit?: boolean;
}

interface CreatedCredentials {
    loginEmail: string;
    password: string;
}

const AdvisorForm: React.FC<AdvisorFormProps> = ({
    onClose,
    onSubmit,
    advisor,
    isEdit = false
}) => {
    const [name, setName] = useState(advisor?.name || '');
    const [email, setEmail] = useState(advisor?.email || '');
    const [phone, setPhone] = useState(advisor?.phone || '');
    const [country, setCountry] = useState(advisor?.country || '');
    const [state, setState] = useState(advisor?.state || '');
    const [city, setCity] = useState(advisor?.city || '');
    const [commissionTier, setCommissionTier] = useState<CommissionTier>(
        advisor?.commissionTier || CommissionTier.BRONZE
    );
    const [commissionRate, setCommissionRate] = useState<number | undefined>(
        advisor?.commissionRate !== undefined ? advisor.commissionRate : 5
    );
    const [currency, setCurrency] = useState(advisor?.currency || 'USD');
    const [bio, setBio] = useState(advisor?.bio || '');
    
    // For country-state-city selectors
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(advisor?.profileImageUrl || null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New states for showing created credentials
    const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
    const [showCreatedAdvisor, setShowCreatedAdvisor] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    // Load countries on mount
    useEffect(() => {
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
    }, []);
    
    // Load states when country changes
    useEffect(() => {
        if (country) {
            const countryStates = State.getStatesOfCountry(country);
            setStates(countryStates);
            
            // Reset state and city if country changes
            if (advisor?.country !== country) {
                setState('');
                setCity('');
                setCities([]);
            }
        } else {
            setStates([]);
            setState('');
            setCity('');
            setCities([]);
        }
    }, [country]);
    
    // Load cities when state changes
    useEffect(() => {
        if (country && state) {
            const stateCities = City.getCitiesOfState(country, state);
            setCities(stateCities);
            
            // Reset city if state changes
            if (advisor?.state !== state) {
                setCity('');
            }
        } else {
            setCities([]);
            setCity('');
        }
    }, [country, state]);
    
    const validateForm = (): boolean => {
        try {
            advisorFormSchema.parse({ 
                name, 
                email, 
                country, 
                state,
                city,
                phone,
                commissionTier,
                commissionRate,
                currency,
                bio
            });
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: { [key: string]: string } = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
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
          const advisorData: Partial<UserDetails> = {
            id: advisor?.id,
            name,
            email,
            phone,
            country,
            state,
            city,
            commissionTier,
            commissionRate,
            currency,
            bio
          };
          
          const result = await onSubmit(advisorData, profileImage || undefined);
          
          // If we have credentials returned, show them
          if (result && result.loginEmail && result.password) {
            setCreatedCredentials({
              loginEmail: result.loginEmail,
              password: result.password
            });
            setShowCreatedAdvisor(true);
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
    
    // Render credentials view if advisor was created
    if (showCreatedAdvisor && createdCredentials) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-gray-900">
                            Advisor Created Successfully
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
                                Advisor account has been created successfully. Please save these login credentials to share with the advisor.
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-auto">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-medium text-gray-900">
                        {isEdit ? 'Edit Advisor' : 'Add New Advisor'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left column with profile image */}
                        <div className="md:col-span-1">
                            <div className="text-center mb-6">
                                <div className="inline-block">
                                    {/* Image container */}
                                    <div className="relative inline-block">
                                        {/* Image or placeholder */}
                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-16 w-16 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Upload button */}
                                        <label
                                            htmlFor="profile-image"
                                            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer shadow hover:bg-blue-600 transition-colors"
                                        >
                                            <Upload className="h-5 w-5" />
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
                            
                            {/* Commission Tier */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commission Tier
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Tag className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.commissionTier ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={commissionTier}
                                        onChange={(e) => setCommissionTier(e.target.value as CommissionTier)}
                                    >
                                        <option value={CommissionTier.BRONZE}>Bronze</option>
                                        <option value={CommissionTier.SILVER}>Silver</option>
                                        <option value={CommissionTier.GOLD}>Gold</option>
                                        <option value={CommissionTier.PLATINUM}>Platinum</option>
                                    </select>
                                </div>
                                {errors.commissionTier && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.commissionTier}
                                    </p>
                                )}
                            </div>
                            
                            {/* Commission Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commission Rate (%) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Percent className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.commissionRate ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={commissionRate ?? ''}
                                        onChange={(e) => setCommissionRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder="Enter commission rate"
                                        required
                                    />
                                </div>
                                {errors.commissionRate && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.commissionRate}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Percentage of deal value paid as commission</p>
                            </div>
                        </div>
                        
                        {/* Right column with form fields */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Name field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
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
                                    Email Address *
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
                            
                            {/* Phone field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.phone ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        placeholder="Enter phone number with country code"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.phone}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US, +91 for India)</p>
                            </div>
                            
                            {/* Country field */}
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                    Country *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="country"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.country ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((countryObj) => (
                                            <option key={countryObj.isoCode} value={countryObj.isoCode}>
                                                {countryObj.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.country && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.country}
                                    </p>
                                )}
                            </div>
                            
                            {/* State field */}
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                    State/Province *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="state"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.state ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        disabled={!country}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map((stateObj) => (
                                            <option key={stateObj.isoCode} value={stateObj.isoCode}>
                                                {stateObj.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.state && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.state}
                                    </p>
                                )}
                            </div>
                            
                            {/* City field */}
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                    City *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="city"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.city ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        disabled={!state}
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {cities.map((cityObj) => (
                                            <option key={cityObj.name} value={cityObj.name}>
                                                {cityObj.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.city && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.city}
                                    </p>
                                )}
                            </div>
                            
                            {/* Currency selector for commission */}
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                                    Currency *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {currency === 'USD' ? 
                                            <DollarSign className="h-5 w-5 text-gray-400" /> : 
                                            <span className="text-gray-400 font-medium text-lg">₹</span>
                                        }
                                    </div>
                                    <select
                                        id="currency"
                                        className={cn(
                                            "block w-full pl-10 pr-3 py-2 form-input",
                                            errors.currency ? 'border-red-300' : 'border-gray-300'
                                        )}
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        required
                                    >
                                        <option value="USD">USD (US Dollar)</option>
                                        <option value="INR">INR (Indian Rupee)</option>
                                    </select>
                                </div>
                                {errors.currency && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.currency}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Currency used for commission payments</p>
                            </div>
                            
                            {/* Bio field */}
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio / Description
                                </label>
                                <textarea
                                    id="bio"
                                    className={cn(
                                        "block w-full py-2 px-3 form-input",
                                        errors.bio ? 'border-red-300' : 'border-gray-300'
                                    )}
                                    placeholder="Enter a brief biography or description"
                                    rows={3}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                                {errors.bio && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                        {errors.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <p>
                                A random login email and password will be generated for the advisor to access the admin panel.
                                You'll be able to share these credentials with the advisor.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
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
                            {isEdit ? 'Save Changes' : 'Create Advisor'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdvisorForm;