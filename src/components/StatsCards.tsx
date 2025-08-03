// src/components/StatsCards.tsx
'use client';

import { LucideIcon } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change?: string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <span className="ml-2 text-sm font-medium text-green-600">
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// src/components/RecentActivity.tsx
'use client';

import { useEffect, useState } from 'react';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'upload' | 'completed' | 'failed';
  filename: string;
  timestamp: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setActivities([
      {
        id: '1',
        type: 'completed',
        filename: 'meeting-recording.mp3',
        timestamp: '2 minutes ago'
      },
      {
        id: '2',
        type: 'upload',
        filename: 'presentation.mp4',
        timestamp: '5 minutes ago'
      },
      {
        id: '3',
        type: 'completed',
        filename: 'interview.wav',
        timestamp: '1 hour ago'
      },
      {
        id: '4',
        type: 'failed',
        filename: 'corrupted-file.mp3',
        timestamp: '2 hours ago'
      }
    ]);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'upload':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'upload':
        return 'Uploaded';
      case 'completed':
        return 'Analysis completed for';
      case 'failed':
        return 'Processing failed for';
      default:
        return 'Activity for';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              {getActivityText(activity)} <span className="font-medium">{activity.filename}</span>
            </p>
            <p className="text-xs text-gray-500">{activity.timestamp}</p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
      )}
    </div>
  );
}

// src/components/ProcessingStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProcessingStatusProps {
  transcriptId: string;
  onComplete?: () => void;
}

export function ProcessingStatus({ transcriptId, onComplete }: ProcessingStatusProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<'upload' | 'transcription' | 'analysis'>('upload');

  useEffect(() => {
    // Mock progress simulation - replace with actual WebSocket connection
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        
        if (newProgress < 30) {
          setCurrentStage('upload');
        } else if (newProgress < 70) {
          setCurrentStage('transcription');
        } else {
          setCurrentStage('analysis');
        }

        if (newProgress >= 100) {
          setStatus('completed');
          clearInterval(interval);
          if (onComplete) {
            onComplete();
          }
        }

        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [transcriptId, onComplete]);

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'upload':
        return 'Uploading file...';
      case 'transcription':
        return 'Converting speech to text...';
      case 'analysis':
        return 'Analyzing transcript...';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        {getStatusIcon()}
        <h3 className="ml-2 text-lg font-medium text-gray-900">
          {status === 'processing' && 'Processing'}
          {status === 'completed' && 'Completed'}
          {status === 'failed' && 'Failed'}
        </h3>
      </div>

      {status === 'processing' && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{getStageLabel(currentStage)}</span>
              <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="progress-bar mb-4">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      <div className="text-sm text-gray-500">
        {status === 'processing' && 'Please wait while we process your file...'}
        {status === 'completed' && 'Your transcript has been analyzed successfully!'}
        {status === 'failed' && 'Something went wrong. Please try again.'}
      </div>
    </div>
  );
}

// src/components/TranscriptViewer.tsx
'use client';

import { useState } from 'react';
import { Search, Download } from 'lucide-react';

interface TranscriptViewerProps {
  text: string;
  analysis: any;
}

export function TranscriptViewer({ text, analysis }: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightWords, setHighlightWords] = useState<string[]>([]);

  const highlightText = (text: string, searchTerm: string, highlights: string[]) => {
    if (!searchTerm && highlights.length === 0) return text;
    
    let highlightedText = text;
    
    // Highlight search term
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    }
    
    // Highlight positive/negative words
    highlights.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="bg-green-100 text-green-800 px-1 rounded">$1</span>');
    });
    
    return highlightedText;
  };

  const downloadTranscript = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Transcript</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={downloadTranscript}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Download transcript"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <button
          onClick={() => setHighlightWords(analysis?.detailedAnalysis?.positiveWords || [])}
          className="text-sm text-green-600 hover:text-green-700"
        >
          Highlight Positive Words
        </button>
        <button
          onClick={() => setHighlightWords(analysis?.detailedAnalysis?.negativeWords || [])}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Highlight Negative Words
        </button>
        <button
          onClick={() => setHighlightWords([])}
          className="text-sm text-gray-600 hover:text-gray-700"
        >
          Clear Highlights
        </button>
      </div>

      <div 
        className="prose max-w-none text-gray-900 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: highlightText(text || 'No transcript available.', searchTerm, highlightWords)
        }}
      />
    </div>
  );
}

// src/components/KeyTopics.tsx
'use client';

interface KeyTopicsProps {
  topics: string[];
  entities: string[];
}

export function KeyTopics({ topics, entities }: KeyTopicsProps) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.length > 0 ? (
            topics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {topic}
              </span>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No topics identified</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Named Entities</h3>
        <div className="flex flex-wrap gap-2">
          {entities.length > 0 ? (
            entities.map((entity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
              >
                {entity}
              </span>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No entities identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

// src/components/AnalysisCharts.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AnalysisChartsProps {
  analysis: any;
}

export function AnalysisCharts({ analysis }: AnalysisChartsProps) {
  const scoreData = [
    { name: 'Sentiment', score: analysis.sentimentScore },
    { name: 'Clarity', score: analysis.clarityScore },
    { name: 'Engagement', score: analysis.engagementScore },
    { name: 'Relevance', score: analysis.questionRelevanceScore },
  ];

  const radarData = [
    { subject: 'Sentiment', score: analysis.sentimentScore },
    { subject: 'Clarity', score: analysis.clarityScore },
    { subject: 'Engagement', score: analysis.engagementScore },
    { subject: 'Pace', score: analysis.speakingPace > 100 ? 100 : analysis.speakingPace },
    { subject: 'Relevance', score: analysis.questionRelevanceScore },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Score Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Radar</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}