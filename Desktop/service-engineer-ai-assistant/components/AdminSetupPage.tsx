import React, { useState } from 'react';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';

interface AdminSetupPageProps {
    adminEmail: string;
    onSetup: (password: string) => void;
    error: string | null;
}

export const AdminSetupPage: React.FC<AdminSetupPageProps> = ({ adminEmail, onSetup, error }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setLocalError("Password must be at least 8 characters long.");
            return;
        }
        setLocalError(null);
        onSetup(password);
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg animate-fade-in-up">
                <div className="flex flex-col items-center space-y-3">
                    <WrenchScrewdriverIcon className="h-12 w-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-gray-900">Admin Account Setup</h1>
                    <p className="text-center text-gray-500">
                        Welcome! Please create a password for the admin account: <br />
                        <span className="font-semibold text-gray-700">{adminEmail}</span>
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="New Password"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="Confirm Password"
                        />
                    </div>
                    
                    {(error || localError) && (
                        <div className="text-sm text-center text-red-600 font-medium" role="alert">
                            {error || localError}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors"
                        >
                            Create Admin Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};