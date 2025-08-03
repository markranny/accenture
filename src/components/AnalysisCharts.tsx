'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface AnalysisChartsProps {
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

export function AnalysisCharts({ analysis }: AnalysisChartsProps) {
  const scoreData = [
    { name: 'Sentiment', score: analysis.sentimentScore, color: '#3B82F6' },
    { name: 'Clarity', score: analysis.clarityScore, color: '#10B981' },
    { name: 'Engagement', score: analysis.engagementScore, color: '#8B5CF6' },
    { name: 'Relevance', score: analysis.questionRelevanceScore, color: '#F59E0B' },
  ];

  const radarData = [
    { subject: 'Sentiment', score: analysis.sentimentScore, fullMark: 100 },
    { subject: 'Clarity', score: analysis.clarityScore, fullMark: 100 },
    { subject: 'Engagement', score: analysis.engagementScore, fullMark: 100 },
    { subject: 'Pace', score: Math.min(100, (analysis.speakingPace / 200) * 100), fullMark: 100 },
    { subject: 'Relevance', score: analysis.questionRelevanceScore, fullMark: 100 },
  ];

  const wordAnalysisData = [
    { name: 'Positive Words', count: analysis.detailedAnalysis.positiveWords?.length || 0, color: '#10B981' },
    { name: 'Negative Words', count: analysis.detailedAnalysis.negativeWords?.length || 0, color: '#EF4444' },
    { name: 'Named Entities', count: analysis.detailedAnalysis.namedEntities?.length || 0, color: '#8B5CF6' },
    { name: 'Questions', count: analysis.detailedAnalysis.questionCount || 0, color: '#F59E0B' },
  ];

  const sentimentDistribution = [
    { name: 'Positive', value: analysis.sentimentScore, color: '#10B981' },
    { name: 'Neutral', value: 100 - Math.abs(analysis.sentimentScore - 50), color: '#6B7280' },
    { name: 'Negative', value: 100 - analysis.sentimentScore, color: '#EF4444' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-gray-900 font-medium">
            Score: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Main Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              <Radar 
                name="Score" 
                dataKey="score" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Word Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wordAnalysisData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={(entry: any) => entry.color} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sentimentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${Math.round(value)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Speaking Pace Analysis */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Speaking Pace Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analysis.speakingPace}</div>
            <div className="text-sm text-gray-600">Words per Minute</div>
            <div className="mt-2">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                analysis.speakingPace >= 120 && analysis.speakingPace <= 180
                  ? 'bg-green-100 text-green-800'
                  : analysis.speakingPace >= 100 && analysis.speakingPace <= 200
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysis.speakingPace >= 120 && analysis.speakingPace <= 180
                  ? 'Optimal'
                  : analysis.speakingPace >= 100 && analysis.speakingPace <= 200
                  ? 'Acceptable'
                  : 'Needs Adjustment'}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analysis.detailedAnalysis.wordCount || 0}</div>
            <div className="text-sm text-gray-600">Total Words</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analysis.detailedAnalysis.avgWordsPerSentence || 0}</div>
            <div className="text-sm text-gray-600">Avg Words/Sentence</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Speaking Pace Guidelines</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• <strong>Optimal:</strong> 120-180 WPM - Clear and engaging</div>
            <div>• <strong>Too Fast:</strong> 200+ WPM - May be hard to follow</div>
            <div>• <strong>Too Slow:</strong> Under 100 WPM - May lose audience attention</div>
          </div>
        </div>
      </div>

      {/* Key Topics Visualization */}
      {analysis.keyTopics && analysis.keyTopics.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Topics Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {analysis.keyTopics.map((topic, index) => (
              <div 
                key={index}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}