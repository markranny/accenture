// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

// Import the components we have
import { TranscriptList } from '@/components/TranscriptList';
import { StatsCards } from '@/components/StatsCards';
import { RecentActivity } from '@/components/RecentActivity';

interface DashboardStats {
  totalTranscripts: number;
  processingTranscripts: number;
  averageScore: number;
  totalUsers: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTranscripts: 0,
    processingTranscripts: 0,
    averageScore: 0,
    totalUsers: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Transcripts',
      value: stats.totalTranscripts.toString(),
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Processing',
      value: stats.processingTranscripts.toString(),
      icon: Clock,
      color: 'yellow',
      change: undefined
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'green',
      change: '+5.2%'
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'purple',
      change: '+2'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Rianna
        </h1>
        <p className="text-gray-600">
          AI-powered transcript analysis and scoring system
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/upload" className="group">
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Upload className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  Upload File
                </h3>
                <p className="text-sm text-gray-500">
                  Upload audio or video files for analysis
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/analytics" className="group">
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  View Analytics
                </h3>
                <p className="text-sm text-gray-500">
                  Explore detailed analytics and insights
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/settings" className="group">
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  Configure Settings
                </h3>
                <p className="text-sm text-gray-500">
                  Adjust scoring criteria and preferences
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <StatsCards stats={statCards} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transcripts */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Transcripts</h2>
              <Link href="/transcripts" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <TranscriptList limit={5} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <RecentActivity />
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">Speech-to-Text Service</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">AI Analysis Engine</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-gray-700">File Storage</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Limited Capacity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}