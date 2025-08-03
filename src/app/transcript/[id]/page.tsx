'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  Download, 
  BarChart3, 
  Clock, 
  MessageSquare,
  TrendingUp,
  Users,
  Brain,
  FileAudio,
  FileVideo,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { ScoreCard } from '@/components/ScoreCard';
import { AnalysisCharts } from '@/components/AnalysisCharts';
import { KeyTopics } from '@/components/KeyTopics';
import { TranscriptViewer } from '@/components/TranscriptViewer';

interface TranscriptData {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: 'audio' | 'video';
  fileSize: number;
  transcriptText: string;
  status: string;
  createdAt: string;
  analysis: {
    sentimentScore: number;
    sentimentLabel: string;
    keyTopics: string[];
    speakingPace: number;
    clarityScore: number;
    engagementScore: number;
    questionRelevanceScore: number;
    overallScore: number;
    detailedAnalysis: {
      wordCount: number;
      avgWordsPerSentence: number;
      questionCount: number;
      positiveWords: string[];
      negativeWords: string[];
      namedEntities: string[];
    };
  };
}

export default function TranscriptDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'analysis' | 'export'>('transcript');

  useEffect(() => {
    if (id) {
      fetchTranscript();
    }
  }, [id]);

  const fetchTranscript = async () => {
    try {
      const response = await fetch(`/api/transcript/${id}`);
      
      if (!response.ok) {
        throw new Error('Transcript not found');
      }
      
      const data = await response.json();
      setTranscript(data);
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

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/transcript/${id}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
          <span className="ml-2 text-gray-600">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Link href="/" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Transcript not found</p>
          <Link href="/" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
              {transcript.fileType === 'audio' ? (
                <FileAudio className="h-10 w-10 text-blue-600" />
              ) : (
                <FileVideo className="h-10 w-10 text-purple-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {transcript.originalFilename}
              </h1>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>{formatFileSize(transcript.fileSize)}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(transcript.createdAt)}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{transcript.fileType}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span>Overall Score: {transcript.analysis.overallScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ScoreCard
          title="Sentiment"
          score={transcript.analysis.sentimentScore}
          label={transcript.analysis.sentimentLabel}
          icon={TrendingUp}
          color="blue"
        />
        <ScoreCard
          title="Clarity"
          score={transcript.analysis.clarityScore}
          label={`${Math.round(transcript.analysis.clarityScore)}%`}
          icon={MessageSquare}
          color="green"
        />
        <ScoreCard
          title="Engagement"
          score={transcript.analysis.engagementScore}
          label={`${Math.round(transcript.analysis.engagementScore)}%`}
          icon={Users}
          color="purple"
        />
        <ScoreCard
          title="Speaking Pace"
          score={transcript.analysis.speakingPace}
          label={`${transcript.analysis.speakingPace} WPM`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'transcript', label: 'Transcript', icon: FileText },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 },
            { id: 'export', label: 'Export', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'transcript' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TranscriptViewer 
              text={transcript.transcriptText}
              analysis={transcript.analysis}
            />
          </div>
          <div>
            <KeyTopics 
              topics={transcript.analysis.keyTopics}
              entities={transcript.analysis.detailedAnalysis.namedEntities}
            />
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-8">
          <AnalysisCharts 
            analysis={transcript.analysis}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count</span>
                  <span className="font-medium">{transcript.analysis.detailedAnalysis.wordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Words per Sentence</span>
                  <span className="font-medium">{transcript.analysis.detailedAnalysis.avgWordsPerSentence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Asked</span>
                  <span className="font-medium">{transcript.analysis.detailedAnalysis.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Positive Keywords</span>
                  <span className="font-medium">{transcript.analysis.detailedAnalysis.positiveWords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Named Entities</span>
                  <span className="font-medium">{transcript.analysis.detailedAnalysis.namedEntities.length}</span>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Sentiment:</strong> The overall tone is {transcript.analysis.sentimentLabel.toLowerCase()} 
                    with a score of {Math.round(transcript.analysis.sentimentScore)}%.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Engagement:</strong> The speaker demonstrates {
                      transcript.analysis.engagementScore >= 70 ? 'high' : 
                      transcript.analysis.engagementScore >= 50 ? 'moderate' : 'low'
                    } engagement with the audience.
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Clarity:</strong> The speech clarity is rated as {
                      transcript.analysis.clarityScore >= 80 ? 'excellent' :
                      transcript.analysis.clarityScore >= 70 ? 'good' :
                      transcript.analysis.clarityScore >= 60 ? 'average' : 'needs improvement'
                    }.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Export Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">PDF Report</h4>
                <p className="text-sm text-gray-500">Complete analysis report with charts and insights</p>
              </div>
              <button 
                onClick={() => handleExport('pdf')}
                className="btn-primary"
              >
                Export PDF
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">JSON Data</h4>
                <p className="text-sm text-gray-500">Raw analysis data in JSON format</p>
              </div>
              <button 
                onClick={() => handleExport('json')}
                className="btn-secondary"
              >
                Export JSON
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">CSV Summary</h4>
                <p className="text-sm text-gray-500">Key metrics in spreadsheet format</p>
              </div>
              <button 
                onClick={() => handleExport('csv')}
                className="btn-secondary"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}