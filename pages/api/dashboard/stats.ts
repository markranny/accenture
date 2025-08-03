import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const connection = await pool.getConnection();

  try {
    // Get total transcripts count
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM transcripts'
    );
    const totalTranscripts = (totalResult as any[])[0].total;

    // Get processing transcripts count
    const [processingResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM transcripts WHERE status = ?',
      ['processing']
    );
    const processingTranscripts = (processingResult as any[])[0].total;

    // Get average score
    const [scoreResult] = await connection.execute(
      'SELECT AVG(overall_score) as average FROM analysis_results WHERE overall_score IS NOT NULL'
    );
    const averageScore = (scoreResult as any[])[0].average || 0;

    // Get completed transcripts in the last 30 days
    const [recentResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM transcripts 
       WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const recentCompletedTranscripts = (recentResult as any[])[0].total;

    // Get status distribution
    const [statusResult] = await connection.execute(
      `SELECT status, COUNT(*) as count FROM transcripts GROUP BY status`
    );
    const statusDistribution = statusResult as any[];

    // Get score distribution
    const [scoreDistResult] = await connection.execute(
      `SELECT 
        CASE 
          WHEN overall_score >= 80 THEN 'excellent'
          WHEN overall_score >= 70 THEN 'good'
          WHEN overall_score >= 60 THEN 'average'
          ELSE 'poor'
        END as score_range,
        COUNT(*) as count
       FROM analysis_results 
       WHERE overall_score IS NOT NULL
       GROUP BY score_range`
    );
    const scoreDistribution = scoreDistResult as any[];

    // Get daily upload trends (last 7 days)
    const [trendsResult] = await connection.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as uploads
       FROM transcripts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );
    const uploadTrends = trendsResult as any[];

    res.status(200).json({
      totalTranscripts,
      processingTranscripts,
      averageScore: Math.round(averageScore * 10) / 10,
      totalUsers: 1, // Placeholder - implement user system as needed
      recentCompletedTranscripts,
      statusDistribution,
      scoreDistribution,
      uploadTrends
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  } finally {
    connection.release();
  }
}