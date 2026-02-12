import { Request, Response } from 'express';
import { Pool } from 'pg';
import moment from 'moment-timezone';

// Define the interface for Note data
export interface NoteData {
  id?: number;
  title: string;
  content?: string;
  type?: string;
  color?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Helper function to get Philippines time
const getPhilippinesTime = (): Date => {
  return moment().tz('Asia/Manila').toDate();
};

// Function to get all notes
export const getAllNotes = async (_req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get a note by ID
export const getNoteById = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to create a new note
export const createNote = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { title, content, type, color, status } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO notes (title, content, type, color, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, content, type, color, status]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to update a note
export const updateNote = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, type, color, status } = req.body;

    // Check if note exists
    const existingNote = await pool.query(
      'SELECT id FROM notes WHERE id = $1',
      [id]
    );

    if (existingNote.rows.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           color = COALESCE($4, color),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, content, type, color, status, id]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to delete a note
export const deleteNote = async (req: Request, res: Response, pool: Pool): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};