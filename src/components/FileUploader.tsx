'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileAudio, FileVideo } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  isUploading: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export function FileUploader({ 
  onFileSelect, 
  isUploading, 
  maxFiles = 5, 
  maxFileSize = 50 * 1024 * 1024 // 50MB 
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB.`;
    }

    // Check file type
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has an unsupported format.`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check total file count
    if (selectedFiles.length + fileArray.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} files at once.`);
      setErrors(newErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [selectedFiles, maxFiles, maxFileSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setErrors([]);
  };

  const uploadFiles = () => {
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles);
      setSelectedFiles([]);
      setErrors([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drag and Drop Area */}
      <div
        className={`file-upload-area relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="audio/*,video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className={`h-12 w-12 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload your files'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop your audio or video files here, or click to browse
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Supported formats: MP3, WAV, M4A, AAC, MP4, MOV, AVI, WebM</p>
            <p>Maximum file size: {Math.round(maxFileSize / (1024 * 1024))}MB per file</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Files</h3>
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {file.type.startsWith('audio/') ? (
                      <FileAudio className="h-6 w-6 text-blue-600" />
                    ) : (
                      <FileVideo className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={uploadFiles}
              disabled={isUploading || selectedFiles.length === 0}
              className="btn-primary flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}