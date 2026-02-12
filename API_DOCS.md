# API Documentation

## Overview
This API provides endpoints for managing API key validations with Philippines standard time tracking.

## Base URL
`http://localhost:3000` (when running locally)

## Endpoints

### POST /api/validate
Validates an API key and stores validation data in the database with Philippines time.

#### Request Body
```json
{
  "api_key": "string"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": integer,
    "api_key": "string",
    "count": integer,
    "validated_at": "timestamp with timezone",
    "philippines_time": "timestamp with timezone",
    "created_at": "timestamp with timezone",
    "updated_at": "timestamp with timezone"
  },
  "message": "API validation recorded successfully"
}
```

#### Error Response
```json
{
  "error": "string"
}
```

### GET /api/validations
Retrieves all API validation records, ordered by validation time (descending).

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": integer,
      "api_key": "string",
      "count": integer,
      "validated_at": "timestamp with timezone",
      "philippines_time": "timestamp with timezone",
      "created_at": "timestamp with timezone",
      "updated_at": "timestamp with timezone"
    }
  ],
  "count": integer
}
```

### GET /api/validation/:api_key
Retrieves a specific API validation record by API key.

#### Path Parameter
- `api_key`: The API key to search for

#### Response
```json
{
  "success": true,
  "data": {
    "id": integer,
    "api_key": "string",
    "count": integer,
    "validated_at": "timestamp with timezone",
    "philippines_time": "timestamp with timezone",
    "created_at": "timestamp with timezone",
    "updated_at": "timestamp with timezone"
  }
}
```

## Database Schema

### Table: api_validations
| Column           | Type                 | Description                                |
|------------------|----------------------|--------------------------------------------|
| id               | SERIAL (PRIMARY KEY) | Unique identifier for each record          |
| api_key          | TEXT (NOT NULL)      | The validated API key                      |
| count            | INTEGER (DEFAULT 1)  | Number of times this API key was validated |
| validated_at     | TIMESTAMP WITH TZ    | UTC timestamp when validation occurred     |
| philippines_time | TIMESTAMP WITH TZ    | Timestamp converted to Philippines time    |
| created_at       | TIMESTAMP WITH TZ    | Record creation time                       |
| updated_at       | TIMESTAMP WITH TZ    | Record update time                         |

## Time Zone Handling
All timestamps are stored with timezone information. The `philippines_time` column specifically stores the validation time converted to Asia/Manila timezone (UTC+8).

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string for Supabase database