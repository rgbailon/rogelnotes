import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all notes
        const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
        return res.status(200).json({
          success: true,
          data: result.rows,
          count: result.rows.length
        });

      case 'POST':
        // Create new note
        const { title, content, type, color, status } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const insertResult = await pool.query(
          `INSERT INTO notes (title, content, type, color, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [title, content, type, color, status]
        );

        return res.status(201).json({
          success: true,
          data: insertResult.rows[0],
          message: 'Note created successfully'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}