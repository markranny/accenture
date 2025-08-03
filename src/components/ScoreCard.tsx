'use client';

import { LucideIcon } from 'lucide-react';

interface ScoreCardProps {
  title: string;
  score: number;
  label: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  showProgress?: boolean;
}

export function ScoreCard({ 
  title, 
  score, 
  label, 
  icon: Icon, 
  color, 
  showProgress = true 
}: ScoreCardProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        progress: 'bg-blue-600',
        text: 'text-blue-600'
      },
      green: {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        progress: 'bg-green-600',
        text: 'text-green-600'
      },
      purple: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        progress: 'bg-purple-600',
        text: 'text-purple-600'
      },
      orange: {
        icon: 'text-orange-600',
        bg: 'bg-orange-50',
        progress: 'bg-orange-600',
        text: 'text-orange-600'
      },
      red: {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        progress: 'bg-red-600',
        text: 'text-red-600'
      },
      yellow: {
        icon: 'text-yellow-600',
        bg: 'bg-yellow-50',
        progress: 'bg-yellow-600',
        text: 'text-yellow-600'
      }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color);
  const normalizedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{Math.round(normalizedScore)}</div>
          <div className={`text-sm font-medium ${colorClasses.text}`}>{label}</div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{title}</span>
          <span className="text-gray-900 font-medium">{Math.round(normalizedScore)}%</span>
        </div>
      </div>
      
      {showProgress && (
        <div className="progress-bar">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClasses.progress}`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        {normalizedScore >= 80 && 'Excellent'}
        {normalizedScore >= 70 && normalizedScore < 80 && 'Good'}
        {normalizedScore >= 60 && normalizedScore < 70 && 'Average'}
        {normalizedScore >= 40 && normalizedScore < 60 && 'Below Average'}
        {normalizedScore < 40 && 'Needs Improvement'}
      </div>
    </div>
  );
}