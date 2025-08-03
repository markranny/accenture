import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transcript ID' });
  }

  const connection = await pool.getConnection();

  try {
    // Get transcript with analysis results
    const [rows] = await connection.execute(
      `SELECT 
        t.id,
        t.filename,
        t.original_filename,
        t.file_type,
        t.file_size,
        t.transcript_text,
        t.status,
        t.created_at,
        t.updated_at,
        ar.sentiment_score,
        ar.sentiment_label,
        ar.key_topics,
        ar.speaking_pace,
        ar.clarity_score,
        ar.engagement_score,
        ar.question_relevance_score,
        ar.overall_score,
        ar.detailed_analysis
       FROM transcripts t
       LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
       WHERE t.id = ?`,
      [id]
    );

    const transcripts = rows as any[];
    
    if (transcripts.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const transcript = transcripts[0];

    // Check if transcript is completed and has analysis
    if (transcript.status !== 'completed' || !transcript.overall_score) {
      return res.status(200).json({
        id: transcript.id,
        filename: transcript.filename,
        originalFilename: transcript.original_filename,
        fileType: transcript.file_type,
        fileSize: transcript.file_size,
        transcriptText: transcript.transcript_text || '',
        status: transcript.status,
        createdAt: transcript.created_at,
        analysis: null
      });
    }

    // Parse JSON fields
    const keyTopics = transcript.key_topics ? JSON.parse(transcript.key_topics) : [];
    const detailedAnalysis = transcript.detailed_analysis ? JSON.parse(transcript.detailed_analysis) : {};

    const response = {
      id: transcript.id,
      filename: transcript.filename,
      originalFilename: transcript.original_filename,
      fileType: transcript.file_type,
      fileSize: transcript.file_size,
      transcriptText: transcript.transcript_text || '',
      status: transcript.status,
      createdAt: transcript.created_at,
      analysis: {
        sentimentScore: parseFloat(transcript.sentiment_score) || 0,
        sentimentLabel: transcript.sentiment_label || 'Unknown',
        keyTopics,
        speakingPace: parseFloat(transcript.speaking_pace) || 0,
        clarityScore: parseFloat(transcript.clarity_score) || 0,
        engagementScore: parseFloat(transcript.engagement_score) || 0,
        questionRelevanceScore: parseFloat(transcript.question_relevance_score) || 0,
        overallScore: parseFloat(transcript.overall_score) || 0,
        detailedAnalysis: {
          wordCount: detailedAnalysis.wordCount || 0,
          avgWordsPerSentence: detailedAnalysis.avgWordsPerSentence || 0,
          questionCount: detailedAnalysis.questionCount || 0,
          positiveWords: detailedAnalysis.positiveWords || [],
          negativeWords: detailedAnalysis.negativeWords || [],
          namedEntities: detailedAnalysis.namedEntities || []
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Transcript fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  } finally {
    connection.release();
  }
}