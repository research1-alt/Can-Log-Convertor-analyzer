import React, { useState } from 'react';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';

type AuthView = 'login' | 'forgotPassword' | 'resetPassword';

interface LoginPageProps {
    onLogin: (email: string, password: string) => void;
    onForgotPassword: (email: string) => void;
    onResetPassword: (email: string, code: string, newPass: string) => void;
    error: string | null;
    adminEmail: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword, onResetPassword, error, adminEmail }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (view === 'login') {
            onLogin(email, password);
        } else if (view === 'forgotPassword') {
            onForgotPassword(email);
            // We assume onForgotPassword will show a message, then we can switch view
            if (email.toLowerCase() === adminEmail.toLowerCase()) {
                setView('resetPassword');
            }
        } else if (view === 'resetPassword') {
            if (newPassword !== confirmNewPassword) {
                setLocalError("New passwords do not match.");
                return;
            }
            if(newPassword.length < 8) {
                setLocalError("Password must be at least 8 characters long.");
                return;
            }
            onResetPassword(email, code, newPassword);
        }
    };

    const renderLogin = () => (
        <>
            <div className="relative">
                <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                    placeholder="Email"
                />
            </div>
            <div className="relative">
                <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                    placeholder="Password"
                />
            </div>
            <div className="text-right text-sm">
                <button type="button" onClick={() => setView('forgotPassword')} className="font-semibold text-brand-primary hover:underline">
                    Forgot password?
                </button>
            </div>
        </>
    );

    const renderForgotPassword = () => (
        <>
             <p className="text-center text-gray-500 -mt-2">
                Enter your admin email address to receive a password reset code.
            </p>
            <div className="relative">
                <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                    placeholder="Admin Email Address"
                />
            </div>
        </>
    );

    const renderResetPassword = () => (
        <>
            <p className="text-center text-sm text-blue-700 bg-blue-100 p-3 rounded-md -mt-2">
                A verification code was sent to <span className="font-semibold">{email}</span>.
                <br /> For this demo, please use the code: <strong className="font-bold">123456</strong>
            </p>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Verification Code" className="w-full p-2 border rounded-md" required />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full p-2 border rounded-md" required />
            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm New Password" className="w-full p-2 border rounded-md" required />
        </>
    );

    const titles = {
        login: 'User & Admin Login',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Your Password'
    };
    
    const buttonTexts = {
        login: 'Login',
        forgotPassword: 'Send Reset Code',
        resetPassword: 'Reset Password'
    };


    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg animate-fade-in-up">
                <div className="flex flex-col items-center space-y-3">
                    <WrenchScrewdriverIcon className="h-12 w-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-gray-900">{titles[view]}</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {view === 'login' && renderLogin()}
                    {view === 'forgotPassword' && renderForgotPassword()}
                    {view === 'resetPassword' && renderResetPassword()}
                    
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
                            {buttonTexts[view]}
                        </button>
                    </div>
                    {view !== 'login' && (
                         <div className="text-center text-sm">
                            <button type="button" onClick={() => setView('login')} className="font-semibold text-brand-primary hover:underline">
                                Back to Login
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};