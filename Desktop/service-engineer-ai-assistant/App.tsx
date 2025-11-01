import React, { useState, useCallback, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { ChatInterface } from './components/ChatInterface';
import { Header } from './components/Header';
import { Message, Drawing, User } from './types';
import { getSolution } from './services/geminiService';
import * as db from './services/db';
import { preloadedKnowledgeBase } from './services/preloadedData';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AdminSetupPage } from './components/AdminSetupPage';
import { WrenchScrewdriverIcon } from './components/icons/WrenchScrewdriverIcon';
import { ApiKeySetupPage } from './components/ApiKeySetupPage';

const ADMIN_EMAIL = 'research1@omegaseikimobility.com';

type AppStatus = 'loading' | 'apiKeySetup' | 'adminSetup' | 'login' | 'ready';

export default function App() {
  // App State
  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  
  // Knowledge Base State
  const [knowledgeBaseText, setKnowledgeBaseText] = useState<string>('');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en');

  // Auth & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // UI State
  const [view, setView] = useState<'chat' | 'admin'>('chat');
  const [adminPanelKey, setAdminPanelKey] = useState(Date.now());

  const isKnowledgeBaseLoaded = knowledgeBaseText.trim().length > 0 || drawings.length > 0;

  // --- Effects ---

  const initializeApp = useCallback(async () => {
      try {
        // 0. Check for API Key
        const storedApiKey = sessionStorage.getItem('geminiApiKey');
        if (!storedApiKey) {
            setAppStatus('apiKeySetup');
            return;
        }
        setApiKey(storedApiKey);

        // 1. Check if admin exists
        const adminUser = await db.getUser(ADMIN_EMAIL);
        if (!adminUser) {
          setAppStatus('adminSetup');
          return;
        }

        // 2. Load Knowledge Base
        const kbData = await db.loadKnowledgeBase();
        if (kbData && (kbData.text || kbData.drawings.length > 0)) {
            setKnowledgeBaseText(kbData.text);
            setDrawings(kbData.drawings);
        } else if (preloadedKnowledgeBase) {
            setKnowledgeBaseText(preloadedKnowledgeBase.text);
            setDrawings(preloadedKnowledgeBase.drawings);
            await db.saveKnowledgeBase(preloadedKnowledgeBase.text, preloadedKnowledgeBase.drawings);
        }
        
        // 3. Check for active session
        const sessionUserEmail = sessionStorage.getItem('currentUserEmail');
        if (sessionUserEmail) {
            const sessionUser = await db.getUser(sessionUserEmail);
            if (sessionUser) {
                setCurrentUser(sessionUser);
                if (sessionUser.role === 'admin') {
                  await fetchUsers();
                }
                setAppStatus('ready');
                return;
            }
        }
        
        // 4. If no session, go to login
        setAppStatus('login');
      } catch (error) {
        console.error("Initialization error:", error);
        setAuthError("Failed to initialize the application. Please refresh the page.");
        setAppStatus('login');
      }
    }, []);


  useEffect(() => {
    if (appStatus === 'loading' && !showLandingPage) {
        initializeApp();
    }
  }, [appStatus, showLandingPage, initializeApp]);

  useEffect(() => {
    if (isKnowledgeBaseLoaded && appStatus === 'ready') {
      const welcomeMessage: Message = {
          id: Date.now(),
          sender: 'bot',
          text: 'Knowledge Base Loaded!',
          botResponse: {
              solutionTitle: 'Knowledge Base Loaded Successfully!',
              steps: [{description: 'I am ready to assist. Please ask a question about an error code, symptom, or procedure.', isSafetyWarning: false}],
              clarifyingQuestion: null,
              noSolutionFound: false,
              suggestedQueries: [],
              drawingFileName: null,
          }
      };
      setMessages([welcomeMessage]);
    } else {
        setMessages([]);
    }
  }, [isKnowledgeBaseLoaded, appStatus]);


  // --- Auth Handlers ---

  const handleApiKeySave = (key: string) => {
    sessionStorage.setItem('geminiApiKey', key);
    setApiKey(key);
    setAppStatus('loading'); 
  };
  
  const handleAdminSetup = async (password: string) => {
      try {
        const adminUser: User = { email: ADMIN_EMAIL, password, role: 'admin' };
        await db.saveUser(adminUser);
        setAppStatus('login');
      } catch (error) {
        console.error("Admin setup failed:", error);
        setAuthError("Could not create admin account.");
      }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
        const user = await db.getUser(email.toLowerCase());
        if (user && user.password === password) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUserEmail', user.email);
            if (user.role === 'admin') {
              await fetchUsers();
              setView('chat');
            }
            setAppStatus('ready');
        } else {
            setAuthError("Invalid email or password.");
        }
    } catch (error) {
        console.error("Login failed:", error);
        setAuthError("An error occurred during login.");
    }
  };

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('currentUserEmail');
    setCurrentUser(null);
    setUsers([]);
    setView('chat');
    setAppStatus('login');
  }, []);
  
  const handleForgotPassword = (email: string) => {
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log("Simulating password reset email for", email);
        // In a real app, an email would be sent. Here we just log it.
        // The UI will guide the user to the next step.
    } else {
        setAuthError("Password reset is only available for the admin account in this demo.");
    }
  };

  const handleResetPassword = async (email: string, code: string, newPass: string) => {
      setAuthError(null);
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && code === '123456') {
          const adminUser = await db.getUser(email);
          if (adminUser) {
              await db.saveUser({ ...adminUser, password: newPass });
              alert("Password reset successfully. Please log in with your new password.");
              setAppStatus('login');
          }
      } else {
          setAuthError("Invalid verification code or email.");
      }
  };


  // --- User Management Handlers (Admin only) ---
  
  const fetchUsers = async () => {
      const allUsers = await db.getAllUsers();
      setUsers(allUsers);
  };

  const handleAddUser = async (email: string, password: string): Promise<string | null> => {
      try {
          const existingUser = await db.getUser(email.toLowerCase());
          if (existingUser) {
              return "A user with this email already exists.";
          }
          const newUser: User = { email: email.toLowerCase(), password, role: 'user' };
          await db.saveUser(newUser);
          await fetchUsers();
          return null;
      } catch (error) {
          console.error("Failed to add user:", error);
          return "An error occurred while adding the user.";
      }
  };

  const handleDeleteUser = async (email: string) => {
      try {
          await db.deleteUser(email);
          await fetchUsers();
      } catch (error) {
          console.error("Failed to delete user:", error);
      }
  };

  // --- App Functionality Handlers ---

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !isKnowledgeBaseLoaded) return;

    if (!apiKey) {
      alert("API Key is not set. Please refresh and configure your API key.");
      setAppStatus('apiKeySetup');
      return;
    }

    const userMessage: Message = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const drawingFileNames = drawings.map(d => d.name);
      const botResponseData = await getSolution(apiKey, knowledgeBaseText, text, language, drawingFileNames);
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Here is the information I found:',
        botResponse: botResponseData,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting solution from Gemini:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Sorry, I encountered an error.",
        botResponse: {
            solutionTitle: 'API Error',
            steps: [],
            clarifyingQuestion: null,
            suggestedQueries: [],
            noSolutionFound: true,
            drawingFileName: null,
            error: error instanceof Error ? error.message : "An unknown error occurred. Please check the console.",
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, knowledgeBaseText, drawings, isKnowledgeBaseLoaded, language]);

  const handleKnowledgeBaseUpdate = async (data: { text: string; drawings: Drawing[] }) => {
    setKnowledgeBaseText(data.text);
    setDrawings(data.drawings);
    try {
      await db.saveKnowledgeBase(data.text, data.drawings);
      setView('chat');
    } catch (error) {
      console.error("Failed to save knowledge base:", error);
    }
  };
  
  const handleReset = useCallback(async () => {
    if(window.confirm("Are you sure you want to reset the knowledge base? This action cannot be undone.")){
        setKnowledgeBaseText('');
        setDrawings([]);
        setAdminPanelKey(Date.now());
        try {
          await db.clearKnowledgeBase();
        } catch (error) {
          console.error("Failed to clear knowledge base:", error);
        }
    }
  }, []);

  const handleViewToggle = () => setView(prev => prev === 'chat' ? 'admin' : 'chat');

  // --- Render Logic ---

  if (showLandingPage) {
    return <LandingPage onStart={() => {
        setShowLandingPage(false);
        setAppStatus('loading');
    }} />;
  }
  
  const renderAppStatus = () => {
      switch(appStatus) {
        case 'loading':
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center flex flex-col items-center space-y-3 text-gray-600">
                        <SpinnerIcon className="h-10 w-10 animate-spin text-brand-primary" />
                        <p className="text-lg">Initializing Application...</p>
                    </div>
                </div>
            );
        case 'apiKeySetup':
            return <ApiKeySetupPage onKeySave={handleApiKeySave} />;
        case 'adminSetup':
            return <AdminSetupPage adminEmail={ADMIN_EMAIL} onSetup={handleAdminSetup} error={authError} />;
        case 'login':
            return <LoginPage onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} error={authError} adminEmail={ADMIN_EMAIL} />;
        case 'ready':
            return renderReadyState();
        default:
            return <div className="text-red-500 text-center p-8">Invalid application state.</div>;
      }
  };

  const renderReadyState = () => {
    const isAdmin = currentUser?.role === 'admin';

    const renderContent = () => {
      if (isAdmin && view === 'admin') {
        return (
          <div className="flex-grow flex items-start justify-center pt-6">
              <div className="w-full max-w-4xl">
                  <AdminPanel 
                      key={adminPanelKey}
                      onKnowledgeBaseUpdate={handleKnowledgeBaseUpdate}
                      users={users}
                      onAddUser={handleAddUser}
                      onDeleteUser={handleDeleteUser}
                  />
              </div>
          </div>
        );
      }
      
      if (isKnowledgeBaseLoaded) {
        return (
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            language={language}
            drawings={drawings}
          />
        );
      }
      
      return (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <WrenchScrewdriverIcon className="h-16 w-16 mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-700">Knowledge Base Not Loaded</h2>
              <p className="mt-2 max-w-md">
                  The AI assistant is not yet configured. An administrator must log in to upload troubleshooting documents.
              </p>
          </div>
      );
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto font-sans bg-gray-100">
          <Header 
            currentUser={currentUser}
            onReset={handleReset} 
            onLogout={handleLogout}
            onLoginClick={() => setAppStatus('login')}
            isSheetLoaded={isKnowledgeBaseLoaded} 
            language={language}
            onLanguageChange={setLanguage}
            view={view}
            onViewToggle={handleViewToggle}
          />
          <main className="flex-grow flex flex-col p-4 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
    );
  };

  return renderAppStatus();
}