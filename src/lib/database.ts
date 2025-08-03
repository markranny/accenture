import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rianna_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

// Database initialization script
export const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  
  try {
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_type ENUM('audio', 'video') NOT NULL,
        file_size BIGINT NOT NULL,
        transcript_text LONGTEXT,
        status ENUM('uploaded', 'processing', 'completed', 'failed') DEFAULT 'uploaded',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transcript_id INT NOT NULL,
        sentiment_score DECIMAL(5,2),
        sentiment_label VARCHAR(50),
        key_topics JSON,
        speaking_pace DECIMAL(5,2),
        clarity_score DECIMAL(5,2),
        engagement_score DECIMAL(5,2),
        question_relevance_score DECIMAL(5,2),
        overall_score DECIMAL(5,2),
        detailed_analysis JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS scoring_criteria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        weight DECIMAL(3,2) DEFAULT 1.00,
        enabled BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default scoring criteria
    await connection.execute(`
      INSERT IGNORE INTO scoring_criteria (name, weight, description) VALUES
      ('sentiment_analysis', 0.20, 'Overall emotional tone and positivity'),
      ('key_topics', 0.15, 'Relevance and coverage of important topics'),
      ('speaking_pace', 0.15, 'Appropriate speed and rhythm of speech'),
      ('clarity', 0.20, 'Clarity and comprehensibility of speech'),
      ('engagement', 0.15, 'Level of audience engagement and interaction'),
      ('question_relevance', 0.15, 'Relevance of answers to questions asked')
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
};