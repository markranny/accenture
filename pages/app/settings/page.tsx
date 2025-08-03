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
