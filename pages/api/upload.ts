import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/database';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filter: ({ mimetype }) => {
        // Allow audio and video files
        return mimetype?.startsWith('audio/') || mimetype?.startsWith('video/') || false;
      },
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!allowedTypes.includes(uploadedFile.mimetype || '')) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Determine file type
    const fileType = uploadedFile.mimetype?.startsWith('audio/') ? 'audio' : 'video';

    // Save file information to database
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO transcripts (filename, original_filename, file_type, file_size, status) 
         VALUES (?, ?, ?, ?, 'uploaded')`,
        [
          path.basename(uploadedFile.filepath),
          uploadedFile.originalFilename || 'unknown',
          fileType,
          uploadedFile.size
        ]
      );

      const transcriptId = (result as any).insertId;

      res.status(200).json({
        message: 'File uploaded successfully',
        transcriptId,
        filename: uploadedFile.originalFilename,
        fileType,
        fileSize: uploadedFile.size
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}