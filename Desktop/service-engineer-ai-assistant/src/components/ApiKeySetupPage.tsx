import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeySetupPageProps {
    onKeySave: (apiKey: string) => void;
}

export const ApiKeySetupPage: React.FC<ApiKeySetupPageProps> = ({ onKeySave }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onKeySave(apiKey.trim());
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg animate-fade-in-up">
                <div className="flex flex-col items-center space-y-3">
                    <KeyIcon className="h-12 w-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-gray-900">Configure Gemini API Key</h1>
                    <p className="text-center text-gray-500">
                        Please enter your Google Gemini API key to activate the assistant. Your key is stored securely in your browser's session and is never sent anywhere else.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            id="api-key"
                            name="api-key"
                            type="password"
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                            placeholder="Enter your API Key"
                        />
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={!apiKey.trim()}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Save and Continue
                        </button>
                    </div>
                     <div className="text-center text-xs text-gray-400">
                        You can get a key from Google AI Studio.
                    </div>
                </form>
            </div>
        </div>
    );
};
