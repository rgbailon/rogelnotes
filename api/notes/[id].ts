import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool, { initializeSchema } from '../_db';

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

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  try {
    // Initialize schema on first request
    await initializeSchema();
    
    switch (req.method) {
      case 'GET':
        // Get note by ID
        const getNoteId = parseInt(id as string, 10);
        if (isNaN(getNoteId)) {
          return res.status(400).json({ error: 'Invalid note ID format' });
        }
        
        const result = await pool.query('SELECT * FROM notes WHERE id = $1', [getNoteId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0]
        });

      case 'PUT':
        // Update note
        const { title, content, type, color, status } = req.body;
        
        console.log('PUT request received:', { id, title, type, body: req.body });

        // Convert id to number if it's a string
        const noteId = parseInt(id as string, 10);
        if (isNaN(noteId)) {
          return res.status(400).json({ error: 'Invalid note ID format' });
        }

        // Check if note exists
        const existingNote = await pool.query('SELECT id FROM notes WHERE id = $1', [noteId]);
        
        if (existingNote.rows.length === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        const updateResult = await pool.query(
          `UPDATE notes
           SET title = COALESCE($1, title),
               content = COALESCE($2, content),
               type = COALESCE($3, type),
               color = COALESCE($4, color),
               status = COALESCE($5, status),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6
           RETURNING *`,
          [title, content, type, color, status, noteId]
        );

        return res.status(200).json({
          success: true,
          data: updateResult.rows[0],
          message: 'Note updated successfully'
        });

      case 'DELETE':
        // Delete note
        const deleteNoteId = parseInt(id as string, 10);
        if (isNaN(deleteNoteId)) {
          return res.status(400).json({ error: 'Invalid note ID format' });
        }
        
        const deleteResult = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [deleteNoteId]);

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Note not found' });
        }

        return res.status(200).json({
          success: true,
          data: deleteResult.rows[0],
          message: 'Note deleted successfully'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}