import React, { useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { Spinner } from './components/Spinner';
import { DataVisualizer } from './components/DataVisualizer';
import { ChatInterface } from './components/ChatInterface';
import { parseCanLogFile, decodeMessages } from './services/canParser';
import { parseDbcFile } from './services/matrixParser';
import { getInitialAnalysisPrompt, createChat } from './services/geminiService';
import { defaultMatrix } from './services/defaultMatrix';
import type { CANMessage, CanMatrix, ChatMessage } from './types';
import { FileIcon, DownloadIcon, SparklesIcon, AlertTriangleIcon, QuestionMarkCircleIcon, LineChartIcon, DocumentTextIcon, ListIcon } from './components/IconComponents';
import { Chat } from '@google/genai';


const App: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [matrixFile, setMatrixFile] = useState<File | null>(null);
    const [rawFileContent, setRawFileContent] = useState<string>('');
    const [convertedData, setConvertedData] = useState<string | null>(null);
    const [processedMessages, setProcessedMessages] = useState<CANMessage[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const chatSessionRef = useRef<Chat | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [showChart, setShowChart] = useState<boolean>(false);
    const [showRawText, setShowRawText] = useState<boolean>(false);
    const [showParsedMessages, setShowParsedMessages] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setConvertedData(null);
        setChatHistory([]);
        chatSessionRef.current = null;
        setRawFileContent('');
        setShowChart(false);
        setShowRawText(false);
        setShowParsedMessages(false);
    };

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            const acceptedFiles = Array.from(selectedFiles);
            setError(null);
            setFiles(acceptedFiles);
            resetState();
        }
    };
    
    const handleMatrixFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles && selectedFiles.length > 0) {
            setMatrixFile(selectedFiles[0]);
        } else {
            setMatrixFile(null);
        }
        resetState();
    }

    const processFiles = useCallback(async () => {
        if (files.length === 0) {
            setError('Please select at least one log file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        resetState();

        try {
            let allMessages: CANMessage[] = [];
            let firstFileContent = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = await file.text();
                if (i === 0) {
                    firstFileContent = content;
                }
                const messages = parseCanLogFile(content, file.name);
                allMessages.push(...messages);
            }
            
            setRawFileContent(firstFileContent);
            
            let matrixToUse: CanMatrix = defaultMatrix;

            if (matrixFile) {
                try {
                    const matrixContent = await matrixFile.text();
                    matrixToUse = parseDbcFile(matrixContent);
                } catch (e) {
                     setError("Could not parse the provided DBC matrix file. Falling back to default decoding.");
                }
            }
            
            allMessages = decodeMessages(allMessages, matrixToUse);
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
    }, [files, matrixFile]);

    const handleDownload = () => {
        if (!convertedData) return;
        const blob = new Blob([convertedData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'converted_can_log.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
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

    const handleDownloadSampleDbc = () => {
        const sampleDbcContent = `
VERSION ""

NS_ :
    BU_: DBG DRIVER IO

BS_:

// BO_ (Message Definition) Syntax:
// BO_ [Message ID (decimal)] [Message Name] : [DLC (bytes)] [Sender Node]
BO_ 257 EngineStatus: 8 Vector__XXX

// SG_ (Signal Definition) Syntax:
// SG_ [Signal Name] : [Start Bit]|[Length (bits)]@[Byte Order][Sign] ([Scale],[Offset]) [[Min]|[Max]] "[Unit]" [Receivers]
// Byte Order: 0 = Big Endian (Motorola), 1 = Little Endian (Intel)
// Sign: + = Unsigned, - = Signed

// Example 1: Big Endian, Unsigned
SG_ Engine_RPM : 0|16@0+ (0.125,0) [0|8000] "rpm" DBG

// Example 2: Little Endian, Signed
SG_ Oil_Temp : 32|8@1- (1,-40) [-40|210] "degC" DBG

// Example 3: A 1-bit flag
SG_ Engine_Running : 16|1@0+ (1,0) [0|1] "" DRIVER
`;
        const blob = new Blob([sampleDbcContent.trim()], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample.dbc');
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
            // FIX: The sendMessage method expects an object with a `message` property.
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
            // FIX: The sendMessage method expects an object with a `message` property.
            const response = await chatSessionRef.current.sendMessage({ message: message });
            const newModelMessage: ChatMessage = { role: 'model', content: response.text };
            setChatHistory(prev => [...prev, newModelMessage]);
        } catch(err) {
             setError(err instanceof Error ? `Failed to get response: ${err.message}` : 'An unknown error occurred.');
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        CAN Log Converter & Analyzer
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Logs are automatically decoded using a built-in matrix. Upload a custom DBC file to override.
                    </p>
                </header>

                <main className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl shadow-blue-500/10 p-6 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileUpload onFileChange={handleFileChange} accept=".log,.trc" />
                        <div>
                            <FileUpload 
                                onFileChange={handleMatrixFileChange} 
                                multiple={false} 
                                accept=".dbc"
                                title="Upload Matrix (Optional)"
                                description="to override default"
                            />
                             <div className="text-center mt-2">
                                <button
                                    onClick={handleDownloadSampleDbc}
                                    className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    <QuestionMarkCircleIcon className="w-4 h-4 mr-1" />
                                    Download Sample DBC
                                </button>
                            </div>
                        </div>
                    </div>

                    {(files.length > 0 || matrixFile) && (
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="font-semibold text-gray-300 mb-3">Selected Files:</h3>
                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center bg-gray-700/50 p-3 rounded-lg">
                                        <FileIcon className="w-5 h-5 text-cyan-400 mr-3" />
                                        <span className="text-gray-200 truncate">{file.name}</span>
                                        <span className="ml-auto text-gray-500 text-sm">{(file.size / 1024).toFixed(2)} KB</span>
                                    </li>
                                ))}
                                {matrixFile && (
                                     <li className="flex items-center bg-gray-700/50 p-3 rounded-lg">
                                        <FileIcon className="w-5 h-5 text-purple-400 mr-3" />
                                        <span className="text-gray-200 truncate font-medium">{matrixFile.name} (Override Matrix)</span>
                                        <span className="ml-auto text-gray-500 text-sm">{(matrixFile.size / 1024).toFixed(2)} KB</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={processFiles}
                            disabled={isLoading || files.length === 0}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? <Spinner /> : 'Convert to CSV'}
                        </button>
                    </div>

                    {error && (
                         <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start" role="alert">
                            <AlertTriangleIcon className="w-5 h-5 mr-3 mt-1"/>
                            <div>
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        </div>
                    )}
                    
                    {convertedData && (
                         <div className="border-t border-gray-700 pt-6 space-y-4 animate-fade-in">
                            <h2 className="text-2xl font-semibold text-green-400">Conversion Successful!</h2>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <button onClick={handleDownload} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-400 transition-all duration-200">
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    Download CSV
                                </button>
                                <button onClick={() => setShowChart(prev => !prev)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 transition-all duration-200">
                                    <LineChartIcon className="w-5 h-5 mr-2" />
                                    {showChart ? 'Hide Chart' : 'Visualize'}
                                </button>
                                 <button onClick={() => setShowRawText(prev => !prev)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-slate-500 transition-all duration-200">
                                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                                    {showRawText ? 'Hide Raw' : 'Show Raw'}
                                </button>
                                <button onClick={() => setShowParsedMessages(prev => !prev)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-200">
                                    <ListIcon className="w-5 h-5 mr-2" />
                                    {showParsedMessages ? 'Hide Parsed' : 'Show Parsed'}
                                </button>
                                <button onClick={handleAnalyze} disabled={isAnalyzing || chatHistory.length > 0} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200">
                                    {isAnalyzing && chatHistory.length === 0 ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" />Analyze</>}
                                </button>
                             </div>
                        </div>
                    )}
                    
                    {showRawText && (
                        <div className="border-t border-gray-700 pt-6 space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-300">Raw Log Content ({files[0]?.name})</h3>
                            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                                <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap break-all">
                                    {rawFileContent ? rawFileContent : 'No content to display.'}
                                </pre>
                            </div>
                        </div>
                    )}
                    
                    {showParsedMessages && (
                        <div className="border-t border-gray-700 pt-6 space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-gray-300">Parsed CAN Messages (JSON)</h3>
                            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                                <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap break-all">
                                    {processedMessages.length > 0 ? JSON.stringify(processedMessages, null, 2) : 'No messages to display.'}
                                </pre>
                            </div>
                        </div>
                    )}

                     {showChart && (
                        <div className="border-t border-gray-700 pt-6 space-y-4 animate-fade-in">
                            <DataVisualizer messages={processedMessages} />
                        </div>
                    )}

                    {chatHistory.length > 0 && (
                        <div className="border-t border-gray-700 pt-6 space-y-4 animate-fade-in">
                             <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-purple-400">AI Chat</h2>
                                <button
                                    onClick={handleDownloadAnalysis}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
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