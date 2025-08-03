import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';
import { SpeechToTextService } from '@/lib/speechToText';
import { TranscriptAnalyzer } from '@/lib/aiAnalysis';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcriptId } = req.body;

  if (!transcriptId) {
    return res.status(400).json({ error: 'Transcript ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    // Get transcript information
    const [rows] = await connection.execute(
      'SELECT * FROM transcripts WHERE id = ?',
      [transcriptId]
    );

    const transcripts = rows as any[];
    if (transcripts.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const transcript = transcripts[0];

    // Update status to processing
    await connection.execute(
      'UPDATE transcripts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['processing', transcriptId]
    );

    // Start background processing
    processTranscriptInBackground(transcript);

    res.status(200).json({ 
      message: 'Processing started',
      transcriptId,
      status: 'processing'
    });

  } catch (error) {
    console.error('Process initiation error:', error);
    
    // Update status to failed
    await connection.execute(
      'UPDATE transcripts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['failed', transcriptId]
    ).catch(console.error);

    res.status(500).json({ error: 'Failed to start processing' });
  } finally {
    connection.release();
  }
}

async function processTranscriptInBackground(transcript: any) {
  const connection = await pool.getConnection();
  
  try {
    // Get file path
    const filePath = path.join(process.cwd(), 'uploads', transcript.filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Convert to File object for speech-to-text service
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], transcript.original_filename, {
      type: transcript.file_type === 'audio' ? 'audio/mpeg' : 'video/mp4'
    });

    // Step 1: Speech-to-text conversion
    const speechToTextService = new SpeechToTextService();
    const transcriptionResult = await speechToTextService.transcribeFile(file);

    // Update transcript text in database
    await connection.execute(
      'UPDATE transcripts SET transcript_text = ? WHERE id = ?',
      [transcriptionResult.transcript, transcript.id]
    );

    // Step 2: AI Analysis
    const analyzer = new TranscriptAnalyzer();
    const analysisResult = await analyzer.analyzeTranscript(transcriptionResult.transcript);

    // Save analysis results
    await connection.execute(
      `INSERT INTO analysis_results (
        transcript_id, sentiment_score, sentiment_label, key_topics,
        speaking_pace, clarity_score, engagement_score, question_relevance_score,
        overall_score, detailed_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transcript.id,
        analysisResult.sentimentScore,
        analysisResult.sentimentLabel,
        JSON.stringify(analysisResult.keyTopics),
        analysisResult.speakingPace,
        analysisResult.clarityScore,
        analysisResult.engagementScore,
        analysisResult.questionRelevanceScore,
        analysisResult.overallScore,
        JSON.stringify(analysisResult.detailedAnalysis)
      ]
    );

    // Update transcript status to completed
    await connection.execute(
      'UPDATE transcripts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', transcript.id]
    );

    console.log(`Successfully processed transcript ${transcript.id}`);

  } catch (error) {
    console.error(`Error processing transcript ${transcript.id}:`, error);
    
    // Update status to failed
    await connection.execute(
      'UPDATE transcripts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['failed', transcript.id]
    ).catch(console.error);

  } finally {
    connection.release();
  }
}