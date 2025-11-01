import React, { useState, useEffect } from 'react';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';

interface SpeechControlProps {
  textToSpeak: string;
  language: string;
}

const languageMap: { [key:string]: string } = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'pa': 'pa-IN',
    'ta': 'ta-IN',
    'kn': 'kn-IN',
    'gu': 'gu-IN',
};

export const SpeechControl: React.FC<SpeechControlProps> = ({ textToSpeak, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Effect to load the list of available system voices. This can be asynchronous.
  useEffect(() => {
    const populateVoiceList = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // Cleanup when component unmounts
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Effect to stop any ongoing speech if the text or language changes.
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [textToSpeak, language]);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Sorry, your browser doesn't support text-to-speech.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any previous utterance

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const targetLang = languageMap[language] || 'en-US';
      utterance.lang = targetLang;

      // Actively find and assign the best voice for the selected language.
      // This is more reliable than just setting the 'lang' property.
      const bestVoice = voices.find(voice => voice.lang === targetLang);
      const partialMatchVoice = voices.find(voice => voice.lang.startsWith(language));
      
      // Prefer an exact language-region match, but fall back to a generic language match.
      utterance.voice = bestVoice || partialMatchVoice || null;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error("SpeechSynthesis Error:", event.error);
        }
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const Icon = isSpeaking ? StopCircleIcon : SpeakerWaveIcon;
  const title = isSpeaking ? 'Stop reading' : 'Listen to solution';
  const isDisabled = !textToSpeak.trim();

  return (
    <button
      onClick={handleToggleSpeech}
      title={title}
      aria-label={title}
      disabled={isDisabled}
      className="p-1 rounded-full text-brand-secondary hover:bg-brand-light transition-colors disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
    >
      <Icon className={`h-6 w-6 transition-colors ${isSpeaking ? 'text-blue-500 animate-pulse' : ''}`} />
    </button>
  );
};
