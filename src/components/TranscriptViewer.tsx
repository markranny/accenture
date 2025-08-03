'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Download, Copy, Highlight, Eye, EyeOff, Volume2, Clock, Hash } from 'lucide-react';

interface TranscriptViewerProps {
  text: string;
  analysis: {
    detailedAnalysis: {
      positiveWords: string[];
      negativeWords: string[];
      namedEntities: string[];
      questionCount: number;
    };
  };
}

export function TranscriptViewer({ text, analysis }: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightMode, setHighlightMode] = useState<'none' | 'positive' | 'negative' | 'entities' | 'questions'>('none');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [selectedText, setSelectedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (text) {
      const words = text.trim().split(/\s+/).length;
      setWordCount(words);
      setReadingTime(Math.ceil(words / 200)); // Average reading speed: 200 WPM
    }
  }, [text]);

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  const copyToClipboard = async (textToCopy: string = text) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
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

  const highlightText = (text: string) => {
    if (!text) return 'No transcript available.';

    let processedText = text;

    // Handle search highlighting first
    if (searchTerm.trim()) {
      const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      processedText = processedText.replace(searchRegex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    // Apply mode-specific highlighting
    switch (highlightMode) {
      case 'positive':
        if (analysis?.detailedAnalysis?.positiveWords) {
          analysis.detailedAnalysis.positiveWords.forEach(word => {
            const wordRegex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
            processedText = processedText.replace(wordRegex, '<span class="bg-green-100 text-green-800 px-1 rounded font-medium">$1</span>');
          });
        }
        break;
      
      case 'negative':
        if (analysis?.detailedAnalysis?.negativeWords) {
          analysis.detailedAnalysis.negativeWords.forEach(word => {
            const wordRegex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
            processedText = processedText.replace(wordRegex, '<span class="bg-red-100 text-red-800 px-1 rounded font-medium">$1</span>');
          });
        }
        break;
      
      case 'entities':
        if (analysis?.detailedAnalysis?.namedEntities) {
          analysis.detailedAnalysis.namedEntities.forEach(entity => {
            const entityRegex = new RegExp(`\\b(${entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
            processedText = processedText.replace(entityRegex, '<span class="bg-purple-100 text-purple-800 px-1 rounded font-medium">$1</span>');
          });
        }
        break;
      
      case 'questions':
        // Highlight questions (sentences ending with ?)
        processedText = processedText.replace(/([^.!?]*\?)/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">$1</span>');
        break;
    }

    return processedText;
  };

  const getHighlightButtonClass = (mode: string) => {
    return `flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
      highlightMode === mode
        ? 'bg-blue-100 text-blue-700 border border-blue-300'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;
  };

  return (
    <div className="card">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">Transcript</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              {wordCount.toLocaleString()} words
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              ~{readingTime} min read
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`p-2 rounded-md transition-colors ${
              showLineNumbers ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Toggle line numbers"
          >
            {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => copyToClipboard(selectedText || text)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={downloadTranscript}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Download transcript"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search and highlighting controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Highlight className="h-4 w-4 text-gray-400" />
          <div className="flex space-x-1">
            <button
              onClick={() => setHighlightMode(highlightMode === 'none' ? 'none' : 'none')}
              className={getHighlightButtonClass('none')}
            >
              Clear
            </button>
            <button
              onClick={() => setHighlightMode(highlightMode === 'positive' ? 'none' : 'positive')}
              className={getHighlightButtonClass('positive')}
            >
              Positive
            </button>
            <button
              onClick={() => setHighlightMode(highlightMode === 'negative' ? 'none' : 'negative')}
              className={getHighlightButtonClass('negative')}
            >
              Negative
            </button>
            <button
              onClick={() => setHighlightMode(highlightMode === 'entities' ? 'none' : 'entities')}
              className={getHighlightButtonClass('entities')}
            >
              Entities
            </button>
            <button
              onClick={() => setHighlightMode(highlightMode === 'questions' ? 'none' : 'questions')}
              className={getHighlightButtonClass('questions')}
            >
              Questions
            </button>
          </div>
        </div>
      </div>

      {/* Font size control */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-sm text-gray-600">Font size:</span>
        <input
          type="range"
          min="12"
          max="20"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm text-gray-600">{fontSize}px</span>
      </div>

      {/* Transcript content */}
      <div className="relative">
        {showLineNumbers && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200 flex flex-col text-xs text-gray-500 select-none">
            {sentences.map((_, index) => (
              <div key={index} className="px-2 py-1 text-right">
                {index + 1}
              </div>
            ))}
          </div>
        )}
        
        <div
          ref={textRef}
          className={`prose max-w-none text-gray-900 leading-relaxed ${showLineNumbers ? 'pl-16' : ''}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
          onMouseUp={handleTextSelection}
          dangerouslySetInnerHTML={{
            __html: highlightText(text)
          }}
        />
      </div>

      {/* Selected text info */}
      {selectedText && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Volume2 className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Selected text:</span>
            </div>
            <button
              onClick={() => copyToClipboard(selectedText)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Copy
            </button>
          </div>
          <p className="mt-1 text-sm text-blue-800 italic">"{selectedText}"</p>
          <div className="mt-2 text-xs text-blue-600">
            {selectedText.split(/\s+/).length} words selected
          </div>
        </div>
      )}

      {/* Transcript statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{sentences.length}</div>
            <div className="text-sm text-gray-600">Sentences</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{analysis?.detailedAnalysis?.questionCount || 0}</div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(wordCount / sentences.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Words/Sentence</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {analysis?.detailedAnalysis?.namedEntities?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Named Entities</div>
          </div>
        </div>
      </div>
    </div>
  );
}