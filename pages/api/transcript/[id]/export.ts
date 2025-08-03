import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, format } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transcript ID' });
  }

  if (!format || !['pdf', 'json', 'csv'].includes(format as string)) {
    return res.status(400).json({ error: 'Invalid format. Supported: pdf, json, csv' });
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

    if (transcript.status !== 'completed' || !transcript.overall_score) {
      return res.status(400).json({ error: 'Transcript analysis not completed' });
    }

    const analysisData = {
      id: transcript.id,
      filename: transcript.original_filename,
      fileType: transcript.file_type,
      fileSize: transcript.file_size,
      transcriptText: transcript.transcript_text || '',
      status: transcript.status,
      createdAt: transcript.created_at,
      analysis: {
        sentimentScore: parseFloat(transcript.sentiment_score) || 0,
        sentimentLabel: transcript.sentiment_label || 'Unknown',
        keyTopics: transcript.key_topics ? JSON.parse(transcript.key_topics) : [],
        speakingPace: parseFloat(transcript.speaking_pace) || 0,
        clarityScore: parseFloat(transcript.clarity_score) || 0,
        engagementScore: parseFloat(transcript.engagement_score) || 0,
        questionRelevanceScore: parseFloat(transcript.question_relevance_score) || 0,
        overallScore: parseFloat(transcript.overall_score) || 0,
        detailedAnalysis: transcript.detailed_analysis ? JSON.parse(transcript.detailed_analysis) : {}
      }
    };

    switch (format) {
      case 'pdf':
        return exportToPDF(res, analysisData);
      case 'json':
        return exportToJSON(res, analysisData);
      case 'csv':
        return exportToCSV(res, analysisData);
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export transcript' });
  } finally {
    connection.release();
  }
}

function exportToPDF(res: NextApiResponse, data: any) {
  const doc = new PDFDocument();
  const stream = new PassThrough();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="transcript-${data.id}.pdf"`);

  doc.pipe(stream);
  stream.pipe(res);

  // PDF Content
  doc.fontSize(20).text('Transcript Analysis Report', 50, 50);
  
  doc.fontSize(14).text(`Filename: ${data.filename}`, 50, 100);
  doc.text(`File Type: ${data.fileType}`, 50, 120);
  doc.text(`Created: ${new Date(data.createdAt).toLocaleDateString()}`, 50, 140);
  doc.text(`Overall Score: ${data.analysis.overallScore}%`, 50, 160);

  doc.fontSize(16).text('Analysis Results', 50, 200);
  doc.fontSize(12);
  doc.text(`Sentiment: ${data.analysis.sentimentLabel} (${data.analysis.sentimentScore}%)`, 50, 230);
  doc.text(`Clarity Score: ${data.analysis.clarityScore}%`, 50, 250);
  doc.text(`Engagement Score: ${data.analysis.engagementScore}%`, 50, 270);
  doc.text(`Speaking Pace: ${data.analysis.speakingPace} WPM`, 50, 290);

  if (data.analysis.keyTopics.length > 0) {
    doc.fontSize(14).text('Key Topics:', 50, 320);
    doc.fontSize(12).text(data.analysis.keyTopics.join(', '), 50, 340);
  }

  doc.addPage();
  doc.fontSize(16).text('Transcript Text', 50, 50);
  doc.fontSize(10).text(data.transcriptText, 50, 80, { width: 500 });

  doc.end();
}

function exportToJSON(res: NextApiResponse, data: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="transcript-${data.id}.json"`);
  res.json(data);
}

function exportToCSV(res: NextApiResponse, data: any) {
  const csvData = [
    ['Field', 'Value'],
    ['ID', data.id],
    ['Filename', data.filename],
    ['File Type', data.fileType],
    ['Overall Score', `${data.analysis.overallScore}%`],
    ['Sentiment Score', `${data.analysis.sentimentScore}%`],
    ['Sentiment Label', data.analysis.sentimentLabel],
    ['Clarity Score', `${data.analysis.clarityScore}%`],
    ['Engagement Score', `${data.analysis.engagementScore}%`],
    ['Speaking Pace', `${data.analysis.speakingPace} WPM`],
    ['Question Relevance', `${data.analysis.questionRelevanceScore}%`],
    ['Word Count', data.analysis.detailedAnalysis.wordCount || 0],
    ['Question Count', data.analysis.detailedAnalysis.questionCount || 0],
    ['Key Topics', data.analysis.keyTopics.join('; ')],
    ['Created At', data.createdAt]
  ];

  const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transcript-${data.id}.csv"`);
  res.send(csvContent);
}