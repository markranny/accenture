'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileText, Brain, Mic } from 'lucide-react';
import Link from 'next/link';

interface ProcessingStatusProps {
  transcriptId: string;
  onComplete?: (transcriptData: any) => void;
  onError?: (error: string) => void;
}

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  current: boolean;
  error: boolean;
}

export function ProcessingStatus({ transcriptId, onComplete, onError }: ProcessingStatusProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<'upload' | 'transcription' | 'analysis'>('upload');
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: 'upload',
      name: 'File Upload',
      description: 'Uploading and validating file',
      icon: FileText,
      completed: false,
      current: true,
      error: false
    },
    {
      id: 'transcription',
      name: 'Speech-to-Text',
      description: 'Converting audio to text',
      icon: Mic,
      completed: false,
      current: false,
      error: false
    },
    {
      id: 'analysis',
      name: 'AI Analysis',
      description: 'Analyzing transcript content',
      icon: Brain,
      completed: false,
      current: false,
      error: false
    }
  ]);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!transcriptId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/transcript/${transcriptId}`);
        if (response.ok) {
          const data = await response.json();
          
          switch (data.status) {
            case 'uploaded':
              updateStage('upload', 25);
              break;
            case 'processing':
              // Determine which stage we're in based on transcript text availability
              if (data.transcriptText) {
                updateStage('analysis', 75);
              } else {
                updateStage('transcription', 50);
              }
              break;
            case 'completed':
              updateStage('analysis', 100);
              setStatus('completed');
              setTranscriptData(data);
              if (onComplete) {
                onComplete(data);
              }
              break;
            case 'failed':
              setStatus('failed');
              setErrorMessage('Processing failed. Please try again.');
              updateStageError(currentStage);
              if (onError) {
                onError('Processing failed');
              }
              break;
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setStatus('failed');
        setErrorMessage('Failed to check processing status.');
        if (onError) {
          onError('Status check failed');
        }
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 2 seconds while processing
    const interval = setInterval(() => {
      if (status === 'processing') {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [transcriptId, status, currentStage, onComplete, onError]);

  const updateStage = (stage: 'upload' | 'transcription' | 'analysis', progressValue: number) => {
    setCurrentStage(stage);
    setProgress(progressValue);
    
    setStages(prev => prev.map(s => ({
      ...s,
      completed: getStageOrder(s.id) < getStageOrder(stage),
      current: s.id === stage,
      error: false
    })));

    // Update estimated time remaining
    const remainingProgress = 100 - progressValue;
    const estimatedSeconds = Math.round((remainingProgress / 100) * 120); // Estimate 2 minutes total
    setEstimatedTimeRemaining(estimatedSeconds);
  };

  const updateStageError = (stage: 'upload' | 'transcription' | 'analysis') => {
    setStages(prev => prev.map(s => ({
      ...s,
      error: s.id === stage,
      current: s.id === stage
    })));
  };

  const getStageOrder = (stageId: string): number => {
    const order = { upload: 0, transcription: 1, analysis: 2 };
    return order[stageId as keyof typeof order] || 0;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const retryProcessing = async () => {
    try {
      setStatus('processing');
      setErrorMessage('');
      setProgress(0);
      updateStage('upload', 0);

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcriptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to restart processing');
      }
    } catch (error) {
      setStatus('failed');
      setErrorMessage('Failed to restart processing. Please try again.');
      if (onError) {
        onError('Retry failed');
      }
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {status === 'processing' && <Clock className="h-5 w-5 text-blue-600 mr-2" />}
          {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
          {status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
          
          <h3 className="text-lg font-medium text-gray-900">
            {status === 'processing' && 'Processing Transcript'}
            {status === 'completed' && 'Processing Complete'}
            {status === 'failed' && 'Processing Failed'}
          </h3>
        </div>

        {status === 'processing' && estimatedTimeRemaining > 0 && (
          <div className="text-sm text-gray-500">
            ~{formatTime(estimatedTimeRemaining)} remaining
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status === 'processing' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Stages */}
      <div className="space-y-4 mb-6">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                stage.error 
                  ? 'bg-red-100 text-red-600' 
                  : stage.completed 
                  ? 'bg-green-100 text-green-600'
                  : stage.current 
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {stage.error ? (
                  <AlertCircle className="h-4 w-4" />
                ) : stage.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : stage.current ? (
                  <div className="loading-spinner h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <h4 className={`text-sm font-medium ${
                  stage.error 
                    ? 'text-red-900' 
                    : stage.completed || stage.current 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>
                  {stage.name}
                </h4>
                <p className={`text-xs ${
                  stage.error 
                    ? 'text-red-600' 
                    : stage.completed || stage.current 
                    ? 'text-gray-600' 
                    : 'text-gray-400'
                }`}>
                  {stage.error ? 'Failed to complete this step' : stage.description}
                </p>
              </div>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className={`absolute ml-4 mt-8 w-0.5 h-4 ${
                  stage.completed ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Messages */}
      <div className={`p-4 rounded-lg ${
        status === 'processing' ? 'bg-blue-50 border border-blue-200' :
        status === 'completed' ? 'bg-green-50 border border-green-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <div className="text-sm">
          {status === 'processing' && (
            <div className="text-blue-800">
              <p className="font-medium">Processing your transcript...</p>
              <p className="mt-1">Please wait while we convert your audio to text and analyze the content. This usually takes 1-2 minutes depending on file size.</p>
            </div>
          )}
          
          {status === 'completed' && (
            <div className="text-green-800">
              <p className="font-medium">Analysis completed successfully!</p>
              <p className="mt-1">Your transcript has been processed and analyzed. You can now view the detailed results.</p>
              {transcriptData && (
                <div className="mt-3">
                  <Link 
                    href={`/transcript/${transcriptId}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    View Results
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {status === 'failed' && (
            <div className="text-red-800">
              <p className="font-medium">Processing failed</p>
              <p className="mt-1">{errorMessage || 'An error occurred while processing your transcript. Please try again.'}</p>
              <div className="mt-3">
                <button 
                  onClick={retryProcessing}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry Processing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
          <div>Transcript ID: {transcriptId}</div>
          <div>Current Stage: {currentStage}</div>
          <div>Progress: {progress}%</div>
          <div>Status: {status}</div>
        </div>
      )}
    </div>
  );
}