// pages/api/analytics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { days = '30' } = req.query;
  const daysBack = parseInt(days as string);

  const connection = await pool.getConnection();

  try {
    // Get total transcripts count for the period
    const [totalResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM transcripts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysBack]
    );
    const totalTranscripts = (totalResult as any[])[0].total;

    // Get average score
    const [avgScoreResult] = await connection.execute(
      `SELECT AVG(overall_score) as average FROM analysis_results ar
       JOIN transcripts t ON ar.transcript_id = t.id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND ar.overall_score IS NOT NULL`,
      [daysBack]
    );
    const averageScore = (avgScoreResult as any[])[0].average || 0;

    // Get completion rate
    const [completionResult] = await connection.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM transcripts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysBack]
    );
    const completionData = (completionResult as any[])[0];
    const completionRate = completionData.total > 0 ? (completionData.completed / completionData.total) * 100 : 0;

    // Get average processing time (estimate based on file size and completion time)
    const [processingTimeResult] = await connection.execute(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_time
       FROM transcripts 
       WHERE status = 'completed' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysBack]
    );
    const processingTime = (processingTimeResult as any[])[0].avg_time || 2;

    // Get score distribution
    const [scoreDistResult] = await connection.execute(
      `SELECT 
         CASE 
           WHEN overall_score >= 90 THEN '90-100%'
           WHEN overall_score >= 80 THEN '80-89%'
           WHEN overall_score >= 70 THEN '70-79%'
           WHEN overall_score >= 60 THEN '60-69%'
           WHEN overall_score >= 50 THEN '50-59%'
           ELSE 'Below 50%'
         END as range,
         COUNT(*) as count,
         (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analysis_results ar2 
                               JOIN transcripts t2 ON ar2.transcript_id = t2.id 
                               WHERE t2.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                               AND ar2.overall_score IS NOT NULL)) as percentage
       FROM analysis_results ar
       JOIN transcripts t ON ar.transcript_id = t.id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND ar.overall_score IS NOT NULL
       GROUP BY range
       ORDER BY overall_score DESC`,
      [daysBack, daysBack]
    );
    const scoreDistribution = scoreDistResult as any[];

    // Get trend data (daily uploads and average scores)
    const [trendResult] = await connection.execute(
      `SELECT 
         DATE(t.created_at) as date,
         COUNT(t.id) as uploads,
         COALESCE(AVG(ar.overall_score), 0) as avgScore
       FROM transcripts t
       LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(t.created_at)
       ORDER BY date ASC`,
      [daysBack]
    );
    const trendData = (trendResult as any[]).map(row => ({
      date: row.date.toISOString().split('T')[0],
      uploads: row.uploads,
      avgScore: parseFloat(row.avgScore) || 0
    }));

    // Get topic analysis
    const [topicResult] = await connection.execute(
      `SELECT 
         JSON_UNQUOTE(JSON_EXTRACT(key_topics, '$[0]')) as topic,
         COUNT(*) as frequency,
         AVG(overall_score) as avgScore
       FROM analysis_results ar
       JOIN transcripts t ON ar.transcript_id = t.id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND key_topics IS NOT NULL
       AND JSON_LENGTH(key_topics) > 0
       GROUP BY topic
       HAVING topic IS NOT NULL AND topic != 'null'
       ORDER BY frequency DESC
       LIMIT 20`,
      [daysBack]
    );
    const topicAnalysis = (topicResult as any[]).map(row => ({
      topic: row.topic,
      frequency: row.frequency,
      avgScore: parseFloat(row.avgScore) || 0
    }));

    // Get file type breakdown
    const [fileTypeResult] = await connection.execute(
      `SELECT 
         file_type as type,
         COUNT(*) as count,
         AVG(COALESCE(ar.overall_score, 0)) as avgScore
       FROM transcripts t
       LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY file_type`,
      [daysBack]
    );
    const fileTypeBreakdown = (fileTypeResult as any[]).map(row => ({
      type: row.type,
      count: row.count,
      avgScore: parseFloat(row.avgScore) || 0
    }));

    // Get sentiment distribution
    const [sentimentResult] = await connection.execute(
      `SELECT 
         sentiment_label as sentiment,
         COUNT(*) as count,
         (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analysis_results ar2 
                               JOIN transcripts t2 ON ar2.transcript_id = t2.id 
                               WHERE t2.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                               AND ar2.sentiment_label IS NOT NULL)) as percentage
       FROM analysis_results ar
       JOIN transcripts t ON ar.transcript_id = t.id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND ar.sentiment_label IS NOT NULL
       GROUP BY sentiment_label`,
      [daysBack, daysBack]
    );
    const sentimentDistribution = (sentimentResult as any[]).map(row => ({
      sentiment: row.sentiment,
      count: row.count,
      percentage: parseFloat(row.percentage) || 0
    }));

    // Get monthly stats for longer periods
    const [monthlyResult] = await connection.execute(
      `SELECT 
         DATE_FORMAT(t.created_at, '%Y-%m') as month,
         COUNT(t.id) as transcripts,
         AVG(COALESCE(ar.overall_score, 0)) as avgScore
       FROM transcripts t
       LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
       ORDER BY month ASC`,
      [daysBack]
    );
    const monthlyStats = (monthlyResult as any[]).map(row => ({
      month: row.month,
      transcripts: row.transcripts,
      avgScore: parseFloat(row.avgScore) || 0
    }));

    res.status(200).json({
      totalTranscripts,
      averageScore,
      completionRate,
      processingTime,
      scoreDistribution,
      trendData,
      topicAnalysis,
      fileTypeBreakdown,
      sentimentDistribution,
      monthlyStats
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  } finally {
    connection.release();
  }
}

// pages/api/analytics/export.ts
import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { format, days = '30' } = req.query;
  const daysBack = parseInt(days as string);

  if (!format || !['csv', 'json'].includes(format as string)) {
    return res.status(400).json({ error: 'Invalid format. Supported: csv, json' });
  }

  const connection = await pool.getConnection();

  try {
    // Get detailed analytics data
    const [detailedResult] = await connection.execute(
      `SELECT 
         t.id,
         t.original_filename,
         t.file_type,
         t.file_size,
         t.status,
         t.created_at,
         ar.overall_score,
         ar.sentiment_score,
         ar.sentiment_label,
         ar.clarity_score,
         ar.engagement_score,
         ar.speaking_pace,
         ar.question_relevance_score
       FROM transcripts t
       LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
       WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY t.created_at DESC`,
      [daysBack]
    );

    const data = detailedResult as any[];

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${daysBack}days.json"`);
      res.json(data);
    } else if (format === 'csv') {
      const csvHeaders = [
        'ID', 'Filename', 'File Type', 'File Size', 'Status', 'Created At',
        'Overall Score', 'Sentiment Score', 'Sentiment Label', 'Clarity Score',
        'Engagement Score', 'Speaking Pace', 'Question Relevance Score'
      ];

      const csvRows = data.map(row => [
        row.id,
        `"${row.original_filename}"`,
        row.file_type,
        row.file_size,
        row.status,
        row.created_at,
        row.overall_score || '',
        row.sentiment_score || '',
        row.sentiment_label || '',
        row.clarity_score || '',
        row.engagement_score || '',
        row.speaking_pace || '',
        row.question_relevance_score || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${daysBack}days.csv"`);
      res.send(csvContent);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  } finally {
    connection.release();
  }
}