import { Request, Response } from 'express';
import { Pool } from 'pg';
import { getPhilippinesTime } from '../server';

// Define the interface for API validation data
interface ApiValidationData {
  api_key: string;
  count?: number;
}

// Function to insert or update API validation record
export const validateApi = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { api_key } = req.body;
    
    if (!api_key) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    // Get current time in Philippines timezone
    const philippinesTime = getPhilippinesTime();
    
    // Check if an entry already exists for this API key
    const existingRecord = await pool.query(
      'SELECT id, count FROM api_validations WHERE api_key = $1',
      [api_key]
    );
    
    let result;
    
    if (existingRecord.rows.length > 0) {
      // Update existing record and increment count
      result = await pool.query(
        `UPDATE api_validations 
         SET count = count + 1, 
             validated_at = CURRENT_TIMESTAMP, 
             philippines_time = $1 
         WHERE api_key = $2 
         RETURNING *`,
        [philippinesTime, api_key]
      );
    } else {
      // Insert new record
      result = await pool.query(
        `INSERT INTO api_validations (api_key, count, validated_at, philippines_time) 
         VALUES ($1, 1, CURRENT_TIMESTAMP, $2) 
         RETURNING *`,
        [api_key, philippinesTime]
      );
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'API validation recorded successfully'
    });
  } catch (error) {
    console.error('Error validating API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get all API validations
export const getAllApiValidations = async (_req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM api_validations ORDER BY validated_at DESC'
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching API validations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get a specific API validation by API key
export const getApiValidationByApiKey = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { api_key } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM api_validations WHERE api_key = $1',
      [api_key]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'API validation not found' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching API validation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};