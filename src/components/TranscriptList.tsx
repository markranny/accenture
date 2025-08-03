'use client';

import { useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FileText, Clock, CheckCircle, AlertCircle, FileAudio, FileVideo } from 'lucide-react';
import Link from 'next/link';

interface Transcript {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: 'audio' | 'video';
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  overallScore?: number;
}

interface TranscriptListProps {
  limit?: number;
  showVirtualization?: boolean;
}

export function TranscriptList({ limit, showVirtualization = false }: TranscriptListProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscripts();
  }, [limit]);

  const fetchTranscripts = async () => {
    try {
      const url = limit ? `/api/transcripts?limit=${limit}` : '/api/transcripts';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      
      const data = await response.json();
      setTranscripts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: Transcript['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Transcript['status']) => {
    switch (status) {
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

  const getScoreBadgeClass = (score?: number): string => {
    if (!score) return 'score-badge score-average';
    if (score >= 80) return 'score-badge score-excellent';
    if (score >= 70) return 'score-badge score-good';
    if (score >= 60) return 'score-badge score-average';
    return 'score-badge score-poor';
  };

  const TranscriptRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const transcript = transcripts[index];
    
    return (
      <div style={style} className="px-4">
        <TranscriptItem transcript={transcript} />
      </div>
    );
  };

  const TranscriptItem = ({ transcript }: { transcript: Transcript }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex-shrink-0 mr-4">
          {transcript.fileType === 'audio' ? (
            <FileAudio className="h-8 w-8 text-blue-600" />
          ) : (
            <FileVideo className="h-8 w-8 text-purple-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-900 truncate">
              {transcript.originalFilename}
            </p>
            {transcript.overallScore && (
              <span className={`ml-2 ${getScoreBadgeClass(transcript.overallScore)}`}>
                {transcript.overallScore}%
              </span>
            )}
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span>{formatFileSize(transcript.fileSize)}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(transcript.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center ml-4">
        <div className="flex items-center mr-4">
          {getStatusIcon(transcript.status)}
          <span className={`ml-2 text-sm font-medium ${getStatusColor(transcript.status)}`}>
            {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
          </span>
        </div>
        
        {transcript.status === 'completed' ? (
          <Link 
            href={`/transcript/${transcript.id}`}
            className="btn-primary text-sm"
          >
            View Details
          </Link>
        ) : transcript.status === 'processing' ? (
          <div className="text-sm text-gray-500">Processing...</div>
        ) : transcript.status === 'failed' ? (
          <button 
            onClick={() => handleRetry(transcript.id)}
            className="btn-secondary text-sm"
          >
            Retry
          </button>
        ) : (
          <div className="text-sm text-gray-500">Uploaded</div>
        )}
      </div>
    </div>
  );

  const handleRetry = async (transcriptId: number) => {
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptId }),
      });

      if (response.ok) {
        // Refresh the list
        fetchTranscripts();
      }
    } catch (error) {
      console.error('Failed to retry processing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        <span className="ml-2 text-gray-600">Loading transcripts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error loading transcripts: {error}</p>
        <button onClick={fetchTranscripts} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No transcripts found</p>
        <Link href="/upload" className="btn-primary">
          Upload Your First File
        </Link>
      </div>
    );
  }

  // Use virtualization for large lists
  if (showVirtualization && transcripts.length > 50) {
    return (
      <div className="h-96">
        <List
          height={384}
          itemCount={transcripts.length}
          itemSize={80}
          width="100%"
        >
          {TranscriptRow}
        </List>
      </div>
    );
  }

  // Regular list for smaller datasets
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {transcripts.map((transcript) => (
        <TranscriptItem key={transcript.id} transcript={transcript} />
      ))}
    </div>
  );
}