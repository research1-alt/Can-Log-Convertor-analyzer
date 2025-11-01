import React from 'react';
import { Message, SolutionStep, Drawing } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { WarningIcon } from './icons/WarningIcon';
import { SpeechControl } from './SpeechControl';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onSendMessage?: (text: string) => void;
  searchQuery?: string;
  drawings?: Drawing[];
  language?: string;
}

const highlightMatches = (text: string | null | undefined, query: string | undefined): React.ReactNode => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-200 rounded-sm">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};


const Step: React.FC<{ step: SolutionStep; index: number; searchQuery?: string }> = ({ step, index, searchQuery }) => {
  const highlightedDescription = highlightMatches(step.description, searchQuery);
  
  if (step.isSafetyWarning) {
    return (
      <li className="flex items-start space-x-3 p-3 bg-warning-bg border-l-4 border-warning-border rounded-r-md">
        <WarningIcon className="h-5 w-5 text-warning-text flex-shrink-0 mt-0.5" />
        <div className="text-warning-text">
          <span className="font-bold">Safety Warning:</span> {highlightedDescription}
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start space-x-3">
      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-brand-secondary text-white rounded-full font-bold text-sm">
        {index + 1}
      </div>
      <span className="text-gray-700">{highlightedDescription}</span>
    </li>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, onSendMessage, searchQuery, drawings, language = 'en' }) => {
  const { sender, text, botResponse } = message;

  const isUser = sender === 'user';
  
  const bubbleClass = isUser
    ? "bg-brand-primary text-white"
    : "bg-white text-gray-800 border border-gray-200";

  const wrapperClass = isUser ? "justify-end" : "justify-start";
  
  const Icon = isUser ? UserIcon : BotIcon;

  const drawingFileName = botResponse?.drawingFileName;
  const drawing = drawings?.find(d => d.name === drawingFileName);

  const textToSpeak = React.useMemo(() => {
    if (!botResponse || isUser) return '';
    let speechText = '';
    if (botResponse.solutionTitle) {
        speechText += botResponse.solutionTitle + '. ';
    }
    if (botResponse.steps && botResponse.steps.length > 0) {
        speechText += botResponse.steps.map((step, index) => {
            const prefix = step.isSafetyWarning ? "Safety Warning: " : `Step ${index + 1}: `;
            return prefix + step.description;
        }).join('. ');
    }
    if (botResponse.clarifyingQuestion) {
        speechText += botResponse.clarifyingQuestion;
    }
    if (!speechText && botResponse.noSolutionFound) {
        speechText = "I couldn't find a solution in the knowledge base for your query.";
    }
    return speechText.trim();
  }, [botResponse, isUser]);

  const hasActions = (botResponse?.suggestedQueries && botResponse.suggestedQueries.length > 0) || !!textToSpeak;

  return (
    <div className={`flex items-end space-x-2 ${wrapperClass} animate-fade-in-up`}>
       {!isUser && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white"><Icon className="h-5 w-5"/></div>}
      <div className={`rounded-lg p-3 max-w-lg shadow-sm ${bubbleClass}`}>
        {isUser ? (
          <p>{highlightMatches(text, searchQuery)}</p>
        ) : (
          <div className="space-y-3">
            {botResponse?.solutionTitle && <h3 className="font-bold text-lg">{highlightMatches(botResponse.solutionTitle, searchQuery)}</h3>}

            {drawing && (
              <div className="mt-2">
                <img 
                  src={drawing.dataUrl} 
                  alt={botResponse?.solutionTitle || 'Solution Drawing'} 
                  className="rounded-lg border border-gray-200 shadow-sm w-full object-contain max-h-96 bg-white" 
                />
              </div>
            )}
            
            {botResponse?.clarifyingQuestion && <p>{highlightMatches(botResponse.clarifyingQuestion, searchQuery)}</p>}
            
            {botResponse && botResponse.steps.length > 0 && (
              <ul className="space-y-2">
                {botResponse.steps.map((step, index) => <Step key={index} step={step} index={index} searchQuery={searchQuery} />)}
              </ul>
            )}

            {botResponse?.noSolutionFound && (
                <div>
                    <p className="font-semibold">I couldn't find a solution in the knowledge base for your query.</p>
                    {botResponse.error && <p className="text-red-500 text-sm mt-2">Details: {botResponse.error}</p>}
                </div>
            )}

            {hasActions && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200/50 mt-3">
                <div className="flex flex-wrap gap-2">
                  {botResponse?.suggestedQueries?.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage?.(query)}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm font-semibold text-brand-primary bg-white border border-brand-secondary rounded-full hover:bg-brand-light transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                    >
                      {query}
                    </button>
                  ))}
                </div>
                
                {textToSpeak && (
                  <div className="flex-shrink-0">
                      <SpeechControl textToSpeak={textToSpeak} language={language} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center text-white"><Icon className="h-5 w-5"/></div>}
    </div>
  );
};
