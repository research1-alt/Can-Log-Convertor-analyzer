import React, { useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { Spinner } from './components/Spinner';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { parseCanLogFile, decodeMessages, parseExcelFile, parseDecodedFile } from './services/canParser';
import { getInitialAnalysisPrompt, createChat } from './services/geminiService';
import { defaultMatrix } from './services/defaultMatrix';
import type { CANMessage, CanMatrix, ChatMessage } from './types';
import { FileIcon, SparklesIcon, AlertTriangleIcon, LineChartIcon, DocumentTextIcon, CodeBracketIcon, ChartBarIcon, ComputerDesktopIcon, RefreshCwIcon } from './components/IconComponents';
import { Chat } from '@google/genai';


const App: React.FC = () => {
    const [mode, setMode] = useState<'decode' | 'visualize'>('decode');
    const [files, setFiles] = useState<File[]>([]);
    const [rawFileContent, setRawFileContent] = useState<string>('');
    const [convertedData, setConvertedData] = useState<string | null>(null);
    const [processedMessages, setProcessedMessages] = useState<CANMessage[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const chatSessionRef = useRef<Chat | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [showChart, setShowChart] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setFiles([]);
        setConvertedData(null);
        setChatHistory([]);
        chatSessionRef.current = null;
        setRawFileContent('');
        setProcessedMessages([]);
        setShowChart(false);
        setError(null);
    }, []);
    
    const handleModeChange = (newMode: 'decode' | 'visualize') => {
        if (mode !== newMode) {
            resetState();
            setMode(newMode);
        }
    };

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            resetState(); // Reset on new file selection
            const acceptedFiles = Array.from(selectedFiles);
            setFiles(acceptedFiles);
        }
    };
    
    const processRawLogFiles = useCallback(async () => {
        if (files.length === 0) {
            setError('Please select at least one log file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setConvertedData(null);
        setProcessedMessages([]);
        setChatHistory([]);

        try {
            let allMessages: CANMessage[] = [];
            let firstFileContent = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const lowerFileName = file.name.toLowerCase();
                let messages: CANMessage[] = [];

                if (lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls')) {
                    messages = await parseExcelFile(file);
                    if (i === 0) {
                        const previewMessages = messages.slice(0, 20);
                        let preview = "Preview from Excel file:\nTimestamp,ID,Type,DLC,Data\n";
                        preview += previewMessages.map(msg => 
                           `${msg.timestamp},${msg.id},${msg.isTx ? 'Tx' : 'Rx'},${msg.dlc},"${msg.data.join(' ')}"`
                        ).join('\n');
                        firstFileContent = preview;
                    }
                } else {
                    const content = await file.text();
                    if (i === 0) {
                        firstFileContent = content;
                    }
                    messages = parseCanLogFile(content, file.name);
                }
                allMessages.push(...messages);
            }
            
            setRawFileContent(firstFileContent);
            
            allMessages = decodeMessages(allMessages, defaultMatrix);
            setProcessedMessages(allMessages);

            if (allMessages.length === 0) {
                setError('No valid CAN messages found in the provided files.');
                setIsLoading(false);
                return;
            }

            const hasDecodedData = allMessages.some(msg => msg.decoded && Object.keys(msg.decoded).length > 0);
            let header = 'Timestamp,ID,Type,DLC,Data';
            if (hasDecodedData) {
                header += ',Decoded Signals';
            }
            
            const csvRows = allMessages.map(msg => {
                const baseRow = `${msg.timestamp},${msg.id},${msg.isTx ? 'Tx' : 'Rx'},${msg.dlc},"${msg.data.join(' ')}"`;
                if (hasDecodedData) {
                    const decodedJson = msg.decoded ? JSON.stringify(msg.decoded).replace(/"/g, '""') : '';
                    return `${baseRow},"${decodedJson}"`;
                }
                return baseRow;
            });
            setConvertedData(header + '\n' + csvRows.join('\n'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
        } finally {
            setIsLoading(false);
        }
    }, [files]);

    const processDecodedFile = useCallback(async () => {
        if (files.length === 0) {
            setError('Please select a decoded data file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setConvertedData(null);
        setProcessedMessages([]);
        setChatHistory([]);
        
        try {
            const messages = await parseDecodedFile(files[0]);
            setProcessedMessages(messages);
            if (messages.length === 0) {
                setError('No data found in the provided file.');
            } else {
                setShowChart(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
        } finally {
            setIsLoading(false);
        }
    }, [files]);
    
    const handleDownloadAnalysis = () => {
        if (chatHistory.length === 0) return;
        const chatLog = chatHistory.map(msg => {
            const prefix = msg.role === 'user' ? '[USER]' : '[AI]';
            return `${prefix}:\n${msg.content}\n`;
        }).join('\n---------------------------------\n');

        const blob = new Blob([chatLog], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = files[0]?.name.replace(/\.[^/.]+$/, "") + "_analysis.txt" || "can_analysis.txt";
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAnalyze = async () => {
        if (!rawFileContent) {
            setError('No file content available to analyze. Please process files first.');
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        setChatHistory([]);

        try {
            const hasDecodedData = convertedData?.includes('Decoded Signals') ?? false;
            const prompt = getInitialAnalysisPrompt(rawFileContent, convertedData, hasDecodedData);
            
            chatSessionRef.current = createChat();
            const response = await chatSessionRef.current.sendMessage({ message: prompt });

            setChatHistory([{ role: 'model', content: response.text }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSendChatMessage = async (message: string) => {
        if (!chatSessionRef.current) return;
        
        const newUserMessage: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, newUserMessage]);
        setIsAnalyzing(true);
        
        try {
            const response = await chatSessionRef.current.sendMessage({ message: message });
            const newModelMessage: ChatMessage = { role: 'model', content: response.text };
            setChatHistory(prev => [...prev, newModelMessage]);
        } catch(err) {
             setError(err instanceof Error ? `Failed to get response: ${err.message}` : 'An unknown error occurred.');
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleResetChat = useCallback(() => {
        setChatHistory([]);
        chatSessionRef.current = null;
    }, []);

    const maxWClass = showChart ? 'max-w-7xl' : 'max-w-5xl';

    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className={`w-full ${maxWClass} mx-auto transition-all duration-500`}>
                <header className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <ComputerDesktopIcon className="w-12 h-12 text-blue-400"/>
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            CAN Signal Intelligence
                        </h1>
                    </div>
                    <p className="text-lg text-gray-400">
                        Decode raw CAN logs, visualize signal data, and analyze with AI.
                    </p>
                </header>

                <main style={{
                    backgroundColor: 'var(--color-container)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 0 30px -10px var(--color-accent-glow)'
                }}
                className="backdrop-blur-sm rounded-2xl p-6 sm:p-8 space-y-8">
                    
                    <div className="flex border-b" style={{ borderColor: 'var(--color-border)'}}>
                         <button
                            onClick={() => handleModeChange('decode')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                                mode === 'decode' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <CodeBracketIcon className="w-5 h-5" />
                            CAN File Decode
                        </button>
                        <button
                            onClick={() => handleModeChange('visualize')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                                mode === 'visualize' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            Graphical Representation
                        </button>
                    </div>
                    
                    {mode === 'decode' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-1 gap-6">
                                <FileUpload 
                                    onFileChange={handleFileChange}
                                    title="Upload CAN Log File(s)"
                                    description="Drop .log, .trc, .xlsx, or any text-based log here"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'visualize' && (
                        <div className="animate-fade-in">
                            <FileUpload 
                                onFileChange={handleFileChange} 
                                multiple={false}
                                accept=".csv,.xlsx,.xls"
                                title="Upload Decoded Data"
                                description="Drop a CSV or Excel file here"
                            />
                        </div>
                    )}


                    {files.length > 0 && (
                        <div className="border-t pt-6" style={{ borderColor: 'var(--color-border)'}}>
                            <h3 className="font-semibold text-gray-300 mb-3 text-lg">Selected Files:</h3>
                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center p-3 rounded-lg" style={{backgroundColor: 'rgba(13, 119, 248, 0.05)', border: '1px solid var(--color-border)'}}>
                                        <FileIcon className="w-5 h-5 text-blue-400 mr-4 flex-shrink-0" />
                                        <span className="text-gray-200 truncate font-medium">{file.name}</span>
                                        <span className="ml-auto text-gray-500 text-sm pl-4">{(file.size / 1024).toFixed(2)} KB</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={mode === 'decode' ? processRawLogFiles : processDecodedFile}
                            disabled={isLoading || files.length === 0}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:saturate-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                            {isLoading ? <Spinner /> : (mode === 'decode' ? 'Convert & Process' : 'Process & Visualize')}
                        </button>
                    </div>

                    {error && (
                         <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start" role="alert">
                            <AlertTriangleIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0"/>
                            <div>
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        </div>
                    )}
                    
                    {processedMessages.length > 0 && mode === 'decode' && (
                         <div className="border-t pt-6 space-y-4 animate-fade-in" style={{ borderColor: 'var(--color-border)'}}>
                            <h2 className="text-2xl font-semibold text-green-400 text-center">Processing Successful!</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => setShowChart(prev => !prev)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-teal-500/50 text-sm font-medium rounded-lg shadow-sm text-teal-300 bg-teal-600/20 hover:bg-teal-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 transition-all duration-300 transform hover:scale-105">
                                    <LineChartIcon className="w-5 h-5 mr-2" />
                                    {showChart ? 'Hide Dashboard' : 'Open Dashboard'}
                                </button>
                                {mode === 'decode' && convertedData && (
                                    chatHistory.length > 0 ? (
                                        <button onClick={handleResetChat} className="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-500/50 text-sm font-medium rounded-lg shadow-sm text-yellow-300 bg-yellow-600/20 hover:bg-yellow-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 transition-all duration-300 transform hover:scale-105">
                                            <RefreshCwIcon className="w-5 h-5 mr-2" />
                                            Reset Analysis
                                        </button>
                                    ) : (
                                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-500/50 text-sm font-medium rounded-lg shadow-sm text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-600/20 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                                            {isAnalyzing ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" />Analyze with AI</>}
                                        </button>
                                    )
                                )}
                             </div>
                        </div>
                    )}

                     {showChart && (
                        <div className="border-t pt-6 space-y-4 animate-fade-in" style={{ borderColor: 'var(--color-border)'}}>
                            <Dashboard messages={processedMessages} />
                        </div>
                    )}

                    {chatHistory.length > 0 && (
                        <div className="border-t pt-6 space-y-4 animate-fade-in" style={{ borderColor: 'var(--color-border)'}}>
                             <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-purple-400">AI Analysis Chat</h2>
                                <button
                                    onClick={handleDownloadAnalysis}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600/80 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                >
                                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                                    Export Chat
                                </button>
                            </div>
                            <ChatInterface 
                                messages={chatHistory}
                                onSendMessage={handleSendChatMessage}
                                isLoading={isAnalyzing}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;