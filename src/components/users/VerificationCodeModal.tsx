import React, { useState } from 'react';
import { Copy, X, CheckCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

interface VerificationCodeModalProps {
    code: string;
    onClose: () => void;
    email: string;
    loginEmail: string; // Add loginEmail prop
}

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
    code,
    onClose,
    email,
    loginEmail
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">
                        Verification Code
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start mb-4">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-blue-700">
                                An email with a verification link has been sent to <strong>{email}</strong>.
                            </p>
                            <p className="text-sm text-blue-700 mt-2">
                                <strong>Important:</strong> For admin panel access, the user should login with:
                                <br />
                                <span className="font-mono bg-white px-2 py-1 mt-1 inline-block border border-blue-200 rounded">
                                    {loginEmail}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-2">Verification Code</div>
                        <div className="flex items-center justify-between">
                            <div className="font-mono text-xl tracking-wider bg-white py-2 px-4 border border-gray-300 rounded">
                                {code}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                onClick={handleCopy}
                                className={copied ? "text-green-600" : ""}
                            >
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                        <p className="text-sm text-yellow-700">
                            <strong>Important:</strong> This code will expire in 24 hours. The user must verify their email and set a password before then.
                        </p>
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
};

export default VerificationCodeModal;