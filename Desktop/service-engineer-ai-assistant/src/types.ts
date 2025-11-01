export interface User {
    email: string;
    // NOTE: In a real-world application, this should be a securely hashed password.
    // Storing plain text passwords is for demonstration purposes only.
    password: string;
    role: 'admin' | 'user';
}

export interface Drawing {
    name: string;
    dataUrl: string;
}

export interface SolutionStep {
    description: string;
    isSafetyWarning: boolean;
}

export interface BotResponse {
    solutionTitle: string | null;
    steps: SolutionStep[];
    clarifyingQuestion: string | null;
    suggestedQueries: string[];
    noSolutionFound: boolean;
    drawingFileName: string | null;
    error?: string;
}

export interface Message {
    id: number;
    sender: 'user' | 'bot';
    text: string;
    botResponse?: BotResponse;
}
