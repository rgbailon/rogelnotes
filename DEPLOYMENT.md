# Deployment Guide for Vercel

## Database Will Work on Vercel Free Tier ✓

Your Supabase PostgreSQL database **WILL work** on Vercel, but you need to make some adjustments.

## Current Architecture Issue

Your app has:
- **Frontend**: React + Vite ✓ (Works on Vercel)
- **Backend**: Express server ✗ (Needs modification)
- **Database**: Supabase PostgreSQL ✓ (External service)

## The Problem

Vercel only supports:
- Static sites
- Serverless functions (short-lived)
- ❌ NOT long-running servers like Express

## Solutions

### Option 1: Convert to Serverless Functions (Recommended)

I've created the API folder structure for you:

```
api/
├── _db.ts           # Database connection
├── notes/
│   ├── index.ts     # GET /api/notes, POST /api/notes
│   └── [id].ts      # GET/PUT/DELETE /api/notes/:id
```

**Setup Steps:**

1. **Install dependency:**
   ```bash
   npm install @vercel/node --save-dev
   ```

2. **Update frontend API calls** (change in `src/services/notesService.ts`):
   ```typescript
   // For Vercel deployment
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? '/api'  // Vercel serverless
     : 'http://localhost:3000/api';  // Local dev
   ```

3. **Create `vercel.json`**:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/$1" }
     ]
   }
   ```

4. **Set Environment Variable in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add: `DATABASE_URL` = your Supabase connection string

5. **Deploy:**
   ```bash
   npm i -g vercel
   vercel
   ```

### Option 2: Deploy Backend Separately

Keep Express server and deploy it elsewhere:

**Recommended free options:**
- **Render.com** - Free tier with 15-min sleep
- **Railway.app** - Free tier with usage limits
- **Fly.io** - Generous free tier

**Steps:**
1. Deploy frontend to Vercel
2. Deploy backend (server folder) to Render/Railway
3. Update API_BASE_URL in frontend to point to your backend URL
4. Add CORS configuration to Express server

### Option 3: Use Supabase Directly (Simpler)

Remove Express entirely and call Supabase directly from frontend:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Direct database calls from frontend
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .order('created_at', { ascending: false })
```

⚠️ **Security Warning**: Only use this if you set up Row Level Security (RLS) policies in Supabase!

## Database Connection Considerations

### ✅ Good News
- Your Supabase connection uses port 6543 (connection pooler) - optimal for serverless
- Connection pooling prevents "too many connections" errors
- SSL is already configured

### ⚠️ Watch Out For
- **Cold starts**: First request may be slow (~1-3s) as function initializes
- **Connection timeouts**: Functions timeout after 10s (free tier)
- **Database initialization**: Schema runs on every cold start (I optimized this)

## Quick Fix for Immediate Deployment

If you want to deploy **right now** with minimal changes:

1. Deploy only the frontend to Vercel
2. Keep Express server running locally or on Render
3. Update API calls to use your backend URL

**In `src/services/notesService.ts`:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

Then in Vercel environment variables:
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Recommended Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel        │ ───────▶│   Supabase       │
│   (Frontend)    │         │   (PostgreSQL)   │
└─────────────────┘         └──────────────────┘
        │
        ▼
┌─────────────────┐
│   Vercel        │
│   Serverless    │
│   Functions     │
└─────────────────┘
```

## Database Schema on Supabase

Make sure to run this SQL in your Supabase SQL Editor:

```sql
-- Create table for notes
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'note',
  color TEXT DEFAULT '#ffffff',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
```

## Summary

**Will database work?** ✅ YES

**What you need to do:**
1. Choose Option 1, 2, or 3 above
2. Option 1 is best for staying on Vercel entirely
3. Set DATABASE_URL in Vercel dashboard
4. Deploy and test

**Expected behavior:**
- All CRUD operations will work
- May experience 1-3s delay on first load (cold start)
- Subsequent requests will be fast
- Database will persist all data correctly