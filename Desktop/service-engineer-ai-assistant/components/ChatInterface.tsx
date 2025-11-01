

// FIX: Add global declarations for the Web Speech API to prevent TypeScript
// errors, as 'SpeechRecognition' and 'webkitSpeechRecognition' are not
// part of the standard 'Window' type.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useRef, useEffect } from 'react';
import { Message, Drawing } from '../types';
import { ChatMessage } from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { BotIcon } from './icons/BotIcon';
import { SearchIcon } from './icons/SearchIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  language: string;
  drawings: Drawing[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, language, drawings }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const speechRecognitionRef = useRef<any>(null); // Using 'any' for cross-browser compatibility

  const languageMap: { [key: string]: string } = {
    'en': 'en-US', 'hi': 'hi-IN', 'pa': 'pa-IN',
    'ta': 'ta-IN', 'kn': 'kn-IN', 'gu': 'gu-IN',
  };

  useEffect(() => {
    // Check for SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = languageMap[language] || 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          onSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings to use this feature.');
        } else if (event.error === 'network') {
          alert('A network error occurred during speech recognition. Please check your internet connection and try again.');
        } else {
          alert(`An error occurred during speech recognition: ${event.error}. Please try again.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      speechRecognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported in this browser.");
      setIsSpeechRecognitionSupported(false);
    }

    return () => {
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.abort();
        }
    };
  }, [language, onSendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!searchQuery) {
        scrollToBottom();
    }
  }, [messages, searchQuery]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (!speechRecognitionRef.current || isRecording) {
      return;
    }
    try {
        setInputValue(''); // Clear input when starting voice
        speechRecognitionRef.current.start();
        setIsRecording(true);
    } catch (e) {
        console.error("Could not start recognition:", e);
        setIsRecording(false);
    }
  };

  const getPlaceholderText = (lang: string): string => {
    switch (lang) {
      case 'hi': return "त्रुटि कोड या समस्या के बारे में पूछें...";
      case 'pa': return "ਕੋਈ ਗਲਤੀ ਕੋਡ ਜਾਂ ਮੁੱਦੇ ਬਾਰੇ ਪੁੱਛੋ...";
      case 'ta': return "பிழைக் குறியீடு அல்லது சிக்கலைப் பற்றி கேளுங்கள்...";
      case 'kn': return "ದೋಷ ಕೋಡ್ ಅಥವಾ ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ ಕೇಳಿ...";
      case 'gu': return "ભૂલ કોડ અથવા સમસ્યા વિશે પૂછો...";
      case 'en': default: return "Ask about an error code or issue...";
    }
  };
  
  const placeholderText = getPlaceholderText(language);

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (msg.text && msg.text.toLowerCase().includes(query)) return true;
    if (msg.botResponse) {
        const { solutionTitle, steps, clarifyingQuestion } = msg.botResponse;
        if (solutionTitle?.toLowerCase().includes(query)) return true;
        if (clarifyingQuestion?.toLowerCase().includes(query)) return true;
        if (steps?.some(step => step.description.toLowerCase().includes(query))) return true;
    }
    return false;
  });

  return (
    <div className="flex-grow flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-gray-200 bg-gray-50/50">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary transition"
                />
            </div>
        </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-brand-light">
        {filteredMessages.length > 0 && filteredMessages.map(msg => (
          <ChatMessage 
            key={msg.id} 
            message={msg}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            searchQuery={searchQuery}
            drawings={drawings}
            language={language}
          />
        ))}

        {filteredMessages.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center text-center p-8 text-gray-500 h-full">
                <SearchIcon className="h-12 w-12 mb-3 text-gray-400" />
                <p className="font-semibold text-lg text-gray-700">No Results Found</p>
                <p className="text-sm mt-1">Your search for "<span className="font-medium text-gray-800">{searchQuery}</span>" did not match any messages.</p>
            </div>
        )}

        {isLoading && !searchQuery && (
          <div className="flex items-end space-x-2 justify-start animate-fade-in-up">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white">
              <BotIcon className="h-5 w-5"/>
            </div>
            <div className="rounded-lg p-3 max-w-lg shadow-sm bg-white text-gray-800 border border-gray-200">
              <div className="flex items-center justify-center space-x-1.5 h-5">
                <span className="sr-only">Bot is typing</span>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? 'Listening...' : placeholderText}
            className="flex-grow p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
            rows={1}
            disabled={isLoading || isRecording}
          />
          <button
            onClick={handleMicClick}
            disabled={isLoading || isRecording || !isSpeechRecognitionSupported}
            aria-label={isRecording ? 'Recording...' : 'Use microphone'}
            title={isSpeechRecognitionSupported ? (isRecording ? 'Listening...' : 'Use microphone') : 'Microphone not supported'}
            className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-white text-brand-secondary border border-brand-secondary hover:bg-brand-light'
            } disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed`}
          >
              <MicrophoneIcon className="h-6 w-6" />
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim() || isRecording}
            className="bg-brand-secondary text-white p-2 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};