import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { processTextFile, processImageFile } from '../services/fileParser';
import { Drawing, User } from '../types';
import { UserManagementPanel } from './UserManagementPanel';
import { UserGroupIcon } from './icons/UserGroupIcon';


// FIX: Changed from `declare module` to `declare global` to augment the React
// namespace directly. This resolves module augmentation errors that can occur in
// certain TypeScript configurations where 'react' is not found as a module.
declare global {
  namespace React {
    interface InputHTMLAttributes<T> {
      webkitdirectory?: string;
    }
  }
}

interface AdminPanelProps {
  onKnowledgeBaseUpdate: (data: { text: string; drawings: Drawing[] }) => void;
  users: User[];
  onAddUser: (email: string, password: string) => Promise<string | null>;
  onDeleteUser: (email: string) => Promise<void>;
}

type AdminTab = 'kb' | 'users';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onKnowledgeBaseUpdate, users, onAddUser, onDeleteUser }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('kb');
  const [activeUploadTab, setActiveUploadTab] = useState('local');
  const [driveMessage, setDriveMessage] = useState('');

  const supportedExtensions = ['.xlsx', '.xls', '.pptx', '.docx', '.pdf', '.txt', '.csv', '.md', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
  const supportedFileTypesString = supportedExtensions.join(',');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    if (event.target.files) {
      const allFiles = Array.from(event.target.files);
      // FIX: Add explicit File type to 'file' parameter to fix type inference issue.
      const supportedFiles = allFiles.filter((file: File) => 
          supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );
      
      if (supportedFiles.length === 0 && allFiles.length > 0) {
          setError(`The selected folder or files do not contain any supported types (${supportedExtensions.join(', ')}).`);
          setSelectedFiles([]);
      } else if (supportedFiles.length > 0) {
          setSelectedFiles(supportedFiles);
          setError(null); 
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files }});
      e.dataTransfer.clearData();
    }
  };

  const handleLoadData = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);

    const textAndDocExtensions = ['.xlsx', '.xls', '.pptx', '.docx', '.pdf', '.txt', '.csv', '.md'];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

    const textFiles = selectedFiles.filter(file => textAndDocExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
    const imageFiles = selectedFiles.filter(file => imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
    
    const textProcessingPromises = textFiles.map(processTextFile);
    const imageProcessingPromises = imageFiles.map(processImageFile);
    
    const textResults = await Promise.allSettled(textProcessingPromises);
    const imageResults = await Promise.allSettled(imageProcessingPromises);

    let combinedData = '';
    const loadedDrawings: Drawing[] = [];
    const errorMessages: string[] = [];
    let successfulUploads = 0;

    textResults.forEach((result, index) => {
        const file = textFiles[index];
        if (result.status === 'fulfilled' && file) {
            combinedData += result.value + `\n\n--- End of File: ${file.name} ---\n\n`;
            successfulUploads++;
        } else if (result.status === 'rejected') {
            errorMessages.push(result.reason as string);
        }
    });

    imageResults.forEach((result) => {
        if (result.status === 'fulfilled') {
            loadedDrawings.push(result.value);
            successfulUploads++;
        } else if (result.status === 'rejected') {
            errorMessages.push(result.reason as string);
        }
    });

    if (errorMessages.length > 0) {
        setError(errorMessages.join('\n'));
    }

    if(successfulUploads > 0) {
        onKnowledgeBaseUpdate({ text: combinedData, drawings: loadedDrawings });
    }
  };
  
  const renderKBPanel = () => (
    <>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md" role="alert">
        Your loaded knowledge base will be stored locally in your browser for future sessions. Use the 'Reset' button in the header to clear it.
      </div>
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                  onClick={() => { setActiveUploadTab('local'); setDriveMessage(''); }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeUploadTab === 'local' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  From Device
              </button>
              <button
                  onClick={() => { setActiveUploadTab('drive'); setError(null); }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeUploadTab === 'drive' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  From Google Drive
              </button>
          </nav>
      </div>
      <div className="mt-4">
        {activeUploadTab === 'local' && (
            <div>
                <p className="text-sm text-gray-600 mb-2">
                  Upload files or a folder. Content from all supported files ({supportedExtensions.join(', ')}) will be combined.
                </p>
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full p-6 rounded-md flex flex-col items-center justify-center text-gray-500 transition border-2 border-dashed ${isDragging ? 'border-brand-primary' : (error ? 'border-red-500' : 'border-gray-300')}`}
                >
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={supportedFileTypesString}
                    multiple
                    />
                    <input
                    type="file"
                    ref={folderInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    webkitdirectory=""
                    multiple
                    />
                    {selectedFiles.length > 0 && !error ? (
                    <div className="text-center p-2 w-full">
                        <DocumentIcon className="h-8 w-8 mx-auto text-brand-primary" />
                        <ul className="mt-2 text-sm text-left max-h-24 overflow-y-auto">
                            {selectedFiles.map(file => (
                                <li key={file.name} className="truncate" title={file.name}>
                                    - {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </li>
                            ))}
                        </ul>
                    </div>
                    ) : (
                    <div className="text-center flex flex-col justify-center items-center pointer-events-none">
                        <UploadIcon className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="mt-3 text-base text-gray-600">Drag & drop files or a folder here</p>
                        <p className="my-2 text-sm text-gray-400">or</p>
                        <div className="flex items-center space-x-4 pointer-events-auto">
                            <button
                                onClick={handleFileClick}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Select Files
                            </button>
                            <button
                                onClick={handleFolderClick}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Select Folder
                            </button>
                        </div>
                    </div>
                    )}
                </div>
                {error && <pre className="text-red-600 text-sm mt-2 whitespace-pre-wrap font-sans">{error}</pre>}
                <div className="mt-4">
                    <button
                        onClick={handleLoadData}
                        disabled={selectedFiles.length === 0}
                        className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Load Knowledge Base
                    </button>
                </div>
            </div>
        )}
        {activeUploadTab === 'drive' && (
            <div className="text-center py-8 px-4 flex flex-col items-center justify-center bg-gray-50 rounded-md">
                <GoogleDriveIcon className="h-16 w-16 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-gray-800">Connect to Google Drive</h3>
                <p className="mt-2 max-w-sm mx-auto text-sm text-gray-600">
                  Import files directly from your Google Drive account to build the knowledge base.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => setDriveMessage('This is a demonstration. A full Google Drive integration requires API credentials and a secure OAuth setup, which is not configured in this environment.')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <GoogleDriveIcon className="h-5 w-5" />
                        <span>Connect to Google Drive</span>
                    </button>
                </div>
                {driveMessage && (
                    <div className="mt-4 text-sm text-center text-blue-800 bg-blue-100 p-3 rounded-md max-w-md mx-auto animate-fade-in-up">
                        <p className="font-semibold">Feature Demo</p>
                        <p>{driveMessage}</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-fade-in-up w-full">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('kb')}
                    className={`flex items-center space-x-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeTab === 'kb' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <UploadIcon className="h-5 w-5"/>
                    <span>Knowledge Base</span>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center space-x-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <UserGroupIcon className="h-5 w-5"/>
                    <span>User Management</span>
                </button>
            </nav>
        </div>

        <div className="mt-4">
            {activeTab === 'kb' && renderKBPanel()}
            {activeTab === 'users' && <UserManagementPanel users={users} onAddUser={onAddUser} onDeleteUser={onDeleteUser}/>}
        </div>
    </div>
  );
};