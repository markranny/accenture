import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const connection = await pool.getConnection();

  try {
    const { limit, offset = 0, status, search } = req.query;

    let query = `
      SELECT 
        t.id,
        t.filename,
        t.original_filename,
        t.file_type,
        t.file_size,
        t.status,
        t.created_at,
        t.updated_at,
        ar.overall_score
      FROM transcripts t
      LEFT JOIN analysis_results ar ON t.id = ar.transcript_id
    `;

    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Add search filter
    if (search && typeof search === 'string') {
      conditions.push('t.original_filename LIKE ?');
      queryParams.push(`%${search}%`);
    }

    // Add status filter
    if (status && typeof status === 'string') {
      conditions.push('t.status = ?');
      queryParams.push(status);
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add ORDER BY
    query += ' ORDER BY t.created_at DESC';

    // Add LIMIT and OFFSET
    if (limit && typeof limit === 'string') {
      query += ' LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    if (offset && typeof offset === 'string') {
      query += ' OFFSET ?';
      queryParams.push(parseInt(offset as string));
    }

    const [rows] = await connection.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM transcripts t';
    const countParams: any[] = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Use the same search and status parameters for count
      if (search && typeof search === 'string') {
        countParams.push(`%${search}%`);
      }
      if (status && typeof status === 'string') {
        countParams.push(status);
      }
    }

    const [countRows] = await connection.execute(countQuery, countParams);
    const total = (countRows as any[])[0].total;

    // Format the response to match expected structure
    const transcripts = (rows as any[]).map(row => ({
      id: row.id,
      filename: row.filename,
      originalFilename: row.original_filename,
      fileType: row.file_type,
      fileSize: row.file_size,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      overallScore: row.overall_score ? parseFloat(row.overall_score) : null
    }));

    // If no limit specified, return just the transcripts array for compatibility
    if (!limit) {
      res.status(200).json({ transcripts });
      return;
    }

    res.status(200).json({
      transcripts,
      pagination: {
        total,
        limit: limit ? parseInt(limit as string) : null,
        offset: parseInt(offset as string),
        hasMore: limit ? (parseInt(offset as string) + parseInt(limit as string)) < total : false
      }
    });

  } catch (error) {
    console.error('Transcripts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  } finally {
    connection.release();
  }
}