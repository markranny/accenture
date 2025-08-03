'use client';

import { TranscriptList } from '@/components/TranscriptList';
import { FileText, Upload, Filter } from 'lucide-react';
import Link from 'next/link';

export default function TranscriptsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Transcripts</h1>
          <p className="text-gray-600">Manage and view all your transcript analysis results</p>
        </div>
        
        <Link href="/upload" className="btn-primary flex items-center mt-4 sm:mt-0">
          <Upload className="h-4 w-4 mr-2" />
          Upload New File
        </Link>
      </div>

      {/* Transcript List with Search and Filters */}
      <div className="card">
        <TranscriptList showSearch={true} showFilters={true} />
      </div>
    </div>
  );
}