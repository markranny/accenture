const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  let connection;
  
  try {
    // First, connect without specifying a database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'rianna_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);

    // Switch to the database
    await connection.execute(`USE \`${dbName}\``);

    // Create transcripts table
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Transcripts table created');

    // Create analysis_results table
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
        FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE,
        INDEX idx_transcript_id (transcript_id),
        INDEX idx_overall_score (overall_score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Analysis results table created');

    // Create scoring_criteria table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS scoring_criteria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        weight DECIMAL(3,2) DEFAULT 1.00,
        enabled BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Scoring criteria table created');

    // Insert default scoring criteria
    const defaultCriteria = [
      ['sentiment_analysis', 0.20, 'Overall emotional tone and positivity'],
      ['key_topics', 0.15, 'Relevance and coverage of important topics'],
      ['speaking_pace', 0.15, 'Appropriate speed and rhythm of speech'],
      ['clarity', 0.20, 'Clarity and comprehensibility of speech'],
      ['engagement', 0.15, 'Level of audience engagement and interaction'],
      ['question_relevance', 0.15, 'Relevance of answers to questions asked']
    ];

    for (const [name, weight, description] of defaultCriteria) {
      await connection.execute(`
        INSERT IGNORE INTO scoring_criteria (name, weight, description) 
        VALUES (?, ?, ?)
      `, [name, weight, description]);
    }
    console.log('Default scoring criteria inserted');

    // Create users table (for future user management)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Users table created');

    // Create settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Settings table created');

    // Insert default settings
    const defaultSettings = [
      ['max_file_size', '52428800', 'number', 'Maximum file size in bytes (50MB)'],
      ['supported_audio_formats', '["audio/mpeg","audio/wav","audio/mp4","audio/aac"]', 'json', 'Supported audio file formats'],
      ['supported_video_formats', '["video/mp4","video/quicktime","video/webm"]', 'json', 'Supported video file formats'],
      ['default_language', 'en-US', 'string', 'Default language for speech recognition'],
      ['processing_timeout', '300', 'number', 'Processing timeout in seconds']
    ];

    for (const [key_name, value, type, description] of defaultSettings) {
      await connection.execute(`
        INSERT IGNORE INTO settings (key_name, value, type, description) 
        VALUES (?, ?, ?, ?)
      `, [key_name, value, type, description]);
    }
    console.log('Default settings inserted');

    // Create activity_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transcript_id INT,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_transcript_id (transcript_id),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Activity logs table created');

    console.log('\n✅ Database initialization completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - transcripts');
    console.log('   - analysis_results');
    console.log('   - scoring_criteria');
    console.log('   - users');
    console.log('   - settings');
    console.log('   - activity_logs');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };