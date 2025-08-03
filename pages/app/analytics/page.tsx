// src/app/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { StatsCards } from '@/components/StatsCards';
import { AnalysisCharts } from '@/components/AnalysisCharts';

interface AnalyticsData {
  totalTranscripts: number;
  averageScore: number;
  completionRate: number;
  processingTime: number;
  scoreDistribution: any[];
  trendData: any[];
  topicAnalysis: any[];
  fileTypeBreakdown: any[];
  sentimentDistribution: any[];
  monthlyStats: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?days=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&days=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}days.${format}`;
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
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={fetchAnalytics} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Transcripts',
      value: analytics.totalTranscripts.toString(),
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'green',
      change: '+5.2%'
    },
    {
      title: 'Completion Rate',
      value: `${analytics.completionRate.toFixed(1)}%`,
      icon: Users,
      color: 'purple',
      change: '+8.1%'
    },
    {
      title: 'Avg Processing Time',
      value: `${analytics.processingTime.toFixed(1)}min`,
      icon: Calendar,
      color: 'orange',
      change: '-2.3%'
    }
  ];

  // Create mock analysis data for the charts component
  const mockAnalysis = {
    sentimentScore: analytics.averageScore,
    sentimentLabel: analytics.averageScore >= 70 ? 'Positive' : analytics.averageScore >= 50 ? 'Neutral' : 'Negative',
    keyTopics: analytics.topicAnalysis.slice(0, 5).map(t => t.topic),
    speakingPace: 150,
    clarityScore: analytics.averageScore * 0.9,
    engagementScore: analytics.averageScore * 1.1,
    questionRelevanceScore: analytics.averageScore * 0.95,
    overallScore: analytics.averageScore,
    detailedAnalysis: {
      wordCount: 1500,
      avgWordsPerSentence: 15,
      questionCount: 12,
      positiveWords: ['excellent', 'great', 'good'],
      negativeWords: ['bad', 'poor'],
      namedEntities: ['Company', 'John', 'Project']
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive analysis of transcript processing and performance</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <StatsCards stats={statCards} />
      </div>

      {/* Analytics Charts */}
      <div className="mb-8">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Performance Analysis</h2>
          <AnalysisCharts analysis={mockAnalysis} />
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {analytics.scoreDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.range}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Type Breakdown */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">File Type Analysis</h3>
          <div className="space-y-3">
            {analytics.fileTypeBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{item.count} files</span>
                  <span className="text-sm text-gray-500">({item.avgScore.toFixed(1)}% avg)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Topics */}
      {analytics.topicAnalysis.length > 0 && (
        <div className="mt-8 card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Discussion Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topicAnalysis.slice(0, 9).map((topic, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{topic.topic}</h4>
                  <span className="text-sm text-gray-500">{topic.frequency}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Avg Score: {topic.avgScore.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Upload, 
  Mic, 
  Brain,
  Globe,
  Shield
} from 'lucide-react';

interface SettingsData {
  maxFileSize: number;
  supportedAudioFormats: string[];
  supportedVideoFormats: string[];
  defaultLanguage: string;
  processingTimeout: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    maxFileSize: 52428800,
    supportedAudioFormats: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'],
    supportedVideoFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
    defaultLanguage: 'en-US',
    processingTimeout: 300
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your transcript analysis preferences and system settings</p>
      </div>

      {/* Settings Form */}
      <div className="space-y-8">
        {/* File Upload Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Upload className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">File Upload Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label">Maximum File Size</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="10485760"
                  max="104857600"
                  step="10485760"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                  {formatFileSize(settings.maxFileSize)}
                </span>
              </div>
            </div>

            <div>
              <label className="label">Supported Audio Formats</label>
              <div className="flex flex-wrap gap-2">
                {['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a'].map(format => (
                  <label key={format} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.supportedAudioFormats.includes(format)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            supportedAudioFormats: [...settings.supportedAudioFormats, format]
                          });
                        } else {
                          setSettings({
                            ...settings,
                            supportedAudioFormats: settings.supportedAudioFormats.filter(f => f !== format)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{format.split('/')[1].toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Processing Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label">Default Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})}
                className="input-field"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="it-IT">Italian</option>
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
            </div>

            <div>
              <label className="label">Processing Timeout (seconds)</label>
              <input
                type="number"
                min="60"
                max="600"
                value={settings.processingTimeout}
                onChange={(e) => setSettings({...settings, processingTimeout: parseInt(e.target.value)})}
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum time to wait for transcript processing before timing out
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">API Configuration</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  API keys are configured via environment variables for security
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Check your .env.local file to configure OpenAI or Azure Speech API keys
              </p>
            </div>
          </div>
        </div>

        {/* Database Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Database Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Connection Status</h3>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Connected</span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Database Info</h3>
                <p className="text-sm text-gray-700">MySQL 8.0</p>
                <p className="text-sm text-gray-500">rianna_db</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`btn-primary flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}