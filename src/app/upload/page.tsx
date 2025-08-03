'use client';

import { useState, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { Upload, FileAudio, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  transcriptId?: string;
  error?: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      const fileId = Math.random().toString(36).substring(2, 15);
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      try {
        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadResult = await uploadResponse.json();
        
        // Update file status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'processing', progress: 100, transcriptId: uploadResult.transcriptId }
              : f
          )
        );

        // Start processing
        await processTranscript(fileId, uploadResult.transcriptId);

      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'failed', error: error.message }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  }, []);

  const processTranscript = async (fileId: string, transcriptId: string) => {
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptId }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      // Update file status to completed
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed' }
            : f
        )
      );

    } catch (error) {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'failed', error: error.message }
            : f
        )
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="loading-spinner h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Files</h1>
        <p className="text-gray-600">
          Upload audio or video files to generate transcripts and AI analysis
        </p>
      </div>

      {/* File Upload Area */}
      <div className="mb-8">
        <FileUploader 
          onFileSelect={handleFileUpload}
          isUploading={isUploading}
        />
      </div>

      {/* Supported Formats */}
      <div className="card mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Supported Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <FileAudio className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-gray-900">Audio Files</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• MP3 (up to 50MB)</li>
              <li>• WAV (up to 50MB)</li>
              <li>• M4A (up to 50MB)</li>
              <li>• AAC (up to 50MB)</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <FileVideo className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-gray-900">Video Files</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• MP4 (up to 50MB)</li>
              <li>• MOV (up to 50MB)</li>
              <li>• AVI (up to 50MB)</li>
              <li>• WebM (up to 50MB)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload History */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Status</h2>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 mr-3">
                    {file.type.startsWith('audio/') ? (
                      <FileAudio className="h-8 w-8 text-gray-400" />
                    ) : (
                      <FileVideo className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <div className="flex items-center mr-3">
                    {getStatusIcon(file.status)}
                    <span className={`ml-2 text-sm font-medium ${getStatusColor(file.status)}`}>
                      {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                    </span>
                  </div>
                  {file.status === 'completed' && file.transcriptId && (
                    <a
                      href={`/transcript/${file.transcriptId}`}
                      className="btn-primary text-sm"
                    >
                      View Results
                    </a>
                  )}
                  {file.status === 'failed' && file.error && (
                    <div className="text-sm text-red-600">
                      Error: {file.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Tips */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Tips for Better Results</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure clear audio quality with minimal background noise</li>
                <li>Speaker should be clearly audible throughout the recording</li>
                <li>Avoid overlapping speech from multiple speakers</li>
                <li>Longer recordings may take several minutes to process</li>
                <li>Check your internet connection for large file uploads</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}