# Chats and Notes Application with Express.js Backend

This project integrates a React frontend with an Express.js backend and PostgreSQL database for storing API validation data with Philippines standard time.

## Features

- React frontend with Tailwind CSS styling
- Express.js backend server
- PostgreSQL database integration with Supabase
- API key validation tracking
- Philippines standard time (Asia/Manila) conversion for all timestamps
- Automatic API validation data storage

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- PostgreSQL database (using Supabase in this project)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
DATABASE_URL=postgresql://postgres.xtlwimbkyjapyyaskinl:YOUR_ACTUAL_PASSWORD_HERE@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

**Note:** Replace `YOUR_ACTUAL_PASSWORD_HERE` with your actual Supabase database password.

### 3. Start the Development Servers

Run both the backend and frontend servers:

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

### 4. Access the Application

- Frontend: `http://localhost:5173` (or as displayed in your terminal)
- Backend API: `http://localhost:3000`
- API Documentation: See `API_DOCS.md` in the project root

## API Endpoints

See `API_DOCS.md` for detailed API documentation.

## Database Schema

The application creates and uses the following table:

### api_validations
Stores API validation records with Philippines time conversion.

| Column           | Type                 | Description                                |
|------------------|----------------------|--------------------------------------------|
| id               | SERIAL (PRIMARY KEY) | Unique identifier for each record          |
| api_key          | TEXT (NOT NULL)      | The validated API key                      |
| count            | INTEGER (DEFAULT 1)  | Number of times this API key was validated |
| validated_at     | TIMESTAMP WITH TZ    | UTC timestamp when validation occurred     |
| philippines_time | TIMESTAMP WITH TZ    | Timestamp converted to Philippines time    |
| created_at       | TIMESTAMP WITH TZ    | Record creation time                       |
| updated_at       | TIMESTAMP WITH TZ    | Record update time                         |

## Time Zone Conversion

All API validations are automatically timestamped with both UTC time (`validated_at`) and Philippines Standard Time (`philippines_time`) which follows Asia/Manila timezone (UTC+8).

## Project Structure

```
.
├── server/
│   ├── server.ts              # Main Express server
│   ├── controllers/
│   │   └── apiController.ts   # API validation controllers
│   └── utils/
│       └── db.ts              # Database utilities
├── src/
│   ├── App.tsx               # Main React app component
│   ├── components/           # React components
│   ├── context/              # React contexts
│   │   └── SettingsContext.tsx # Settings context with API validation
│   └── utils/
│       └── apiUtils.ts       # API utility functions
├── database/
│   └── schema.sql            # Database schema definition
├── API_DOCS.md               # API documentation
├── README.md                 # This file
├── .env                      # Environment variables (not committed)
├── package.json
└── ...
```

## Testing the Integration

1. Start both servers as described above
2. Navigate to the frontend application
3. Go to the Settings page
4. Enter an API key in the AI settings panel
5. Click "Validate API Key"
6. The validation will be sent to the backend and stored in the database with Philippines time
7. You can view all validations by accessing the `/api/validations` endpoint

## Troubleshooting

### Database Connection Issues
- Ensure your Supabase database is accessible
- Verify the connection string in `.env` is correct
- Check that the password in `.env` is accurate
- Confirm that your IP address is whitelisted in Supabase settings

### API Validation Not Working
- Check that the backend server is running on port 3000
- Verify CORS settings if running on different ports
- Check browser console and server logs for error messages

## Security Notes

- Never commit the `.env` file to version control
- Store API keys securely and consider using additional encryption
- Limit database access rights to only necessary operations
- Regularly rotate database passwords and API keys