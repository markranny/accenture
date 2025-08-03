'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  FileAudio, 
  FileVideo, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Download,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';

interface Transcript {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: 'audio' | 'video';
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  overallScore?: number;
}

interface TranscriptListProps {
  limit?: number;
  showSearch?: boolean;
  showFilters?: boolean;
}

export function TranscriptList({ 
  limit, 
  showSearch = false, 
  showFilters = false 
}: TranscriptListProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchTranscripts();
    
    // Set up polling for processing transcripts
    const interval = setInterval(() => {
      if (transcripts.some(t => t.status === 'processing')) {
        fetchTranscripts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [limit, searchTerm, statusFilter, typeFilter]);

  const fetchTranscripts = async () => {
    try {
      let url = '/api/transcripts';
      const params = new URLSearchParams();
      
      if (limit) params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      
      const data = await response.json();
      setTranscripts(Array.isArray(data) ? data : data.transcripts || []);
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
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: Transcript['status']) => {
    const iconClass = "h-4 w-4";
    
    switch (status) {
      case 'uploaded':
        return <Clock className={`${iconClass} text-blue-600`} />;
      case 'processing':
        return <div className="loading-spinner h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />;
      case 'completed':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'failed':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const getStatusColor = (status: Transcript['status']) => {
    switch (status) {
      case 'uploaded':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreBadge = (score: number | undefined) => {
    if (!score) return null;
    
    let badgeClass = 'score-badge ';
    if (score >= 80) badgeClass += 'score-excellent';
    else if (score >= 70) badgeClass += 'score-good';
    else if (score >= 60) badgeClass += 'score-average';
    else badgeClass += 'score-poor';

    return (
      <span className={badgeClass}>
        {score}%
      </span>
    );
  };

  const filteredTranscripts = transcripts.filter(transcript => {
    const matchesSearch = transcript.originalFilename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transcript.status === statusFilter;
    const matchesType = typeFilter === 'all' || transcript.fileType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2 text-gray-600">Loading transcripts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={fetchTranscripts}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Transcript List */}
      <div className="space-y-3">
        {filteredTranscripts.length > 0 ? (
          filteredTranscripts.map((transcript) => (
            <div 
              key={transcript.id} 
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {transcript.fileType === 'audio' ? (
                    <FileAudio className="h-8 w-8 text-blue-600" />
                  ) : (
                    <FileVideo className="h-8 w-8 text-purple-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {transcript.originalFilename}
                    </h3>
                    {getScoreBadge(transcript.overallScore)}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{formatFileSize(transcript.fileSize)}</span>
                    <span>{formatDate(transcript.createdAt)}</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transcript.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transcript.status)}`}>
                        {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {transcript.status === 'completed' ? (
                  <Link
                    href={`/transcript/${transcript.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                ) : transcript.status === 'processing' ? (
                  <div className="text-sm text-yellow-600 font-medium">
                    Processing...
                  </div>
                ) : transcript.status === 'failed' ? (
                  <button
                    onClick={() => {
                      // Retry processing
                      fetch('/api/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcriptId: transcript.id })
                      }).then(() => fetchTranscripts());
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Start processing
                      fetch('/api/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcriptId: transcript.id })
                      }).then(() => fetchTranscripts());
                    }}
                    className="btn-primary text-sm"
                  >
                    Process
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No transcripts match your filters' 
                : 'No transcripts found'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Link href="/upload" className="btn-primary">
                Upload your first file
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Load More (if needed) */}
      {limit && transcripts.length === limit && (
        <div className="text-center pt-4">
          <Link 
            href="/transcripts" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View all transcripts
          </Link>
        </div>
      )}
    </div>
  );
}