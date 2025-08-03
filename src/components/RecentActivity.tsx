'use client';

import { useEffect, useState } from 'react';
import { Clock, FileText, CheckCircle, AlertCircle, Upload, BarChart3, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'upload' | 'processing' | 'completed' | 'failed' | 'deleted';
  transcriptId?: number;
  filename: string;
  timestamp: string;
  fileType?: 'audio' | 'video';
  score?: number;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/transcripts?limit=20');
      if (response.ok) {
        const data = await response.json();
        
        // Convert transcript data to activity format
        const activities: Activity[] = data.transcripts.map((transcript: any) => {
          const baseActivity = {
            id: `${transcript.id}-${transcript.status}`,
            transcriptId: transcript.id,
            filename: transcript.original_filename,
            timestamp: getRelativeTime(transcript.updated_at || transcript.created_at),
            fileType: transcript.file_type
          };

          switch (transcript.status) {
            case 'uploaded':
              return { ...baseActivity, type: 'upload' as const };
            case 'processing':
              return { ...baseActivity, type: 'processing' as const };
            case 'completed':
              return { 
                ...baseActivity, 
                type: 'completed' as const,
                score: transcript.overall_score 
              };
            case 'failed':
              return { ...baseActivity, type: 'failed' as const };
            default:
              return { ...baseActivity, type: 'upload' as const };
          }
        });

        setActivities(activities);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'upload':
        return <Upload className={`${iconClass} text-blue-600`} />;
      case 'processing':
        return <div className="loading-spinner h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />;
      case 'completed':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'failed':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case 'deleted':
        return <Trash2 className={`${iconClass} text-gray-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const fileName = activity.filename.length > 25 
      ? `${activity.filename.substring(0, 25)}...` 
      : activity.filename;

    switch (activity.type) {
      case 'upload':
        return (
          <span>
            Uploaded <span className="font-medium text-gray-900">{fileName}</span>
          </span>
        );
      case 'processing':
        return (
          <span>
            Processing <span className="font-medium text-gray-900">{fileName}</span>
          </span>
        );
      case 'completed':
        return (
          <span>
            Analysis completed for <span className="font-medium text-gray-900">{fileName}</span>
            {activity.score && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {activity.score}%
              </span>
            )}
          </span>
        );
      case 'failed':
        return (
          <span>
            Processing failed for <span className="font-medium text-gray-900">{fileName}</span>
          </span>
        );
      case 'deleted':
        return (
          <span>
            Deleted <span className="font-medium text-gray-900">{fileName}</span>
          </span>
        );
      default:
        return (
          <span>
            Activity for <span className="font-medium text-gray-900">{fileName}</span>
          </span>
        );
    }
  };

  const getActivityAction = (activity: Activity) => {
    if (activity.type === 'completed' && activity.transcriptId) {
      return (
        <Link 
          href={`/transcript/${activity.transcriptId}`}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View
        </Link>
      );
    }
    
    if (activity.type === 'failed' && activity.transcriptId) {
      return (
        <button 
          onClick={() => handleRetry(activity.transcriptId!)}
          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
        >
          Retry
        </button>
      );
    }
    
    return null;
  };

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
        // Refresh activity list
        fetchRecentActivity();
      }
    } catch (error) {
      console.error('Failed to retry processing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.length > 0 ? (
        <>
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 py-2 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">
                  {getActivityText(activity)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  {getActivityAction(activity)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Show more link */}
          <div className="pt-3 border-t border-gray-200">
            <Link 
              href="/transcripts" 
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all activity
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No recent activity</p>
          <Link 
            href="/upload" 
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Upload your first file
          </Link>
        </div>
      )}
      
      {/* Activity summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {activities.filter(a => a.type === 'processing').length}
            </div>
            <div className="text-xs text-gray-500">Processing</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {activities.filter(a => a.type === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {activities.filter(a => a.type === 'failed').length}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
}