import { Pool } from 'pg';

// Initialize the database schema
export const initializeSchema = async (pool: Pool): Promise<void> => {
  try {
    // Read and execute the schema SQL
    await pool.query(`
      -- Drop triggers if they exist
      DROP TRIGGER IF EXISTS update_api_validations_updated_at ON api_validations;
      DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
      
      -- Drop function if it exists
      DROP FUNCTION IF EXISTS update_updated_at_column();
      
      -- Function to update the updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create table for API validation records
      CREATE TABLE IF NOT EXISTS api_validations (
        id SERIAL PRIMARY KEY,
        api_key TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        philippines_time TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for API validation records
      CREATE INDEX IF NOT EXISTS idx_api_validations_api_key ON api_validations(api_key);
      CREATE INDEX IF NOT EXISTS idx_api_validations_validated_at ON api_validations(validated_at);
      CREATE INDEX IF NOT EXISTS idx_api_validations_philippines_time ON api_validations(philippines_time);

      -- Trigger to automatically update the updated_at column for API validations
      CREATE TRIGGER update_api_validations_updated_at
          BEFORE UPDATE ON api_validations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      -- Create table for notes
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT DEFAULT 'note',
        color TEXT DEFAULT '#ffffff',
        status TEXT DEFAULT 'active', -- for task type notes
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for notes
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
      CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
      CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);

      -- Trigger to automatically update the updated_at column for notes
      CREATE TRIGGER update_notes_updated_at
          BEFORE UPDATE ON notes
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};