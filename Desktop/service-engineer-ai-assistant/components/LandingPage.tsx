import React from 'react';

interface LandingPageProps {
    onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-brand-light font-sans relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-white to-brand-light opacity-50"></div>
            <div className="text-center z-10 p-8">
                <div 
                    className="flex flex-col items-center justify-center space-y-6 animate-fade-in-up"
                    style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
                >
                    <h1 className="text-6xl font-bold text-brand-primary tracking-tight">
                        Omega Seiki Mobility
                    </h1>
                    
                    <div className="max-w-2xl">
                        <h2 className="text-5xl font-extrabold text-gray-800 tracking-tighter" style={{ animationDelay: '0.4s' }}>
                            AI-Powered Service Assistant
                        </h2>
                        <p className="mt-4 text-lg text-gray-600" style={{ animationDelay: '0.6s' }}>
                            Instant diagnostics and troubleshooting for service engineers.
                            <br />
                            Load your knowledge base and get expert solutions in seconds.
                        </p>
                    </div>

                    <button
                        onClick={onStart}
                        className="mt-8 px-10 py-4 bg-brand-secondary text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-500 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-brand-secondary focus:ring-opacity-50"
                        style={{ animationDelay: '0.8s' }}
                    >
                        Launch Assistant
                    </button>
                </div>
            </div>
             <style>{`
                .bg-radial-gradient {
                    background-image: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
                }
             `}</style>
        </div>
    );
};