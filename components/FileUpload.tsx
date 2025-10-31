
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './IconComponents';

interface FileUploadProps {
    onFileChange: (files: FileList | null) => void;
    title?: string;
    description?: string;
    accept?: string;
    multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileChange,
    title = "Click to upload",
    description = "or drag and drop",
    accept,
    multiple = true
 }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [onFileChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFileChange(e.target.files);
    };

    const dragDropClasses = isDragging ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600';

    return (
        <div 
            className={`relative group w-full p-8 border-2 border-dashed ${dragDropClasses} rounded-xl text-center cursor-pointer transition-all duration-300`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`file-input-${multiple ? 'multi' : 'single'}`)?.click()}
        >
            <input
                type="file"
                id={`file-input-${multiple ? 'multi' : 'single'}`}
                className="hidden"
                multiple={multiple}
                onChange={handleChange}
                accept={accept}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
                <UploadCloudIcon className={`w-16 h-16 text-gray-500 group-hover:text-blue-400 transition-colors duration-300 ${isDragging ? 'text-blue-400' : ''}`} />
                <p className="text-gray-400">
                    <span className="font-semibold text-blue-400">{title}</span> {description}
                </p>
                <p className="text-xs text-gray-500">
                    {multiple ? "Upload any CAN log file (.log, .trc, etc.)" : "Upload a CAN Matrix file (.dbc)"}
                </p>
            </div>
        </div>
    );
};
