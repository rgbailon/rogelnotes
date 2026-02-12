import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import moment from 'moment-timezone';
import { initializeSchema } from './utils/db.js';
import { validateApi, getAllApiValidations, getApiValidationByApiKey } from './controllers/apiController.js';
import { 
  getAllNotes, 
  getNoteById, 
  createNote, 
  updateNote, 
  deleteNote 
} from './controllers/notesController.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

// Initialize database schema
initializeSchema(pool)
  .then(() => {
    console.log('Database schema initialized successfully');
  })
  .catch((err) => {
    console.error('Error initializing database schema:', err);
  });

// Helper function to get Philippines time
export const getPhilippinesTime = (): Date => {
  return moment().tz('Asia/Manila').toDate();
};

// API routes
app.post('/api/validate', (req: Request, res: Response) => {
  validateApi(req, res, pool);
});

app.get('/api/validations', (req: Request, res: Response) => {
  getAllApiValidations(req, res, pool);
});

app.get('/api/validation/:api_key', (req: Request, res: Response) => {
  getApiValidationByApiKey(req, res, pool);
});

// Notes routes
app.get('/api/notes', (req: Request, res: Response) => {
  getAllNotes(req, res, pool);
});

app.get('/api/notes/:id', (req: Request, res: Response) => {
  getNoteById(req, res, pool);
});

app.post('/api/notes', (req: Request, res: Response) => {
  createNote(req, res, pool);
});

app.put('/api/notes/:id', (req: Request, res: Response) => {
  updateNote(req, res, pool);
});

app.delete('/api/notes/:id', (req: Request, res: Response) => {
  deleteNote(req, res, pool);
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Express server with PostgreSQL integration is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});