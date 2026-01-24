# API Reference

Base URL: `/api`

## Authentication

### POST /register
Register a new user account.
**Body:**
```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "institution": "Technical School",
  "password": "securepassword",
  "role": "student" // 'student' or 'teacher'
}
```

### POST /login
Authenticate a user.
**Body:**
```json
{
  "username": "jdoe@example.com", // Email address
  "password": "securepassword"
}
```

## Users

### GET /users/public/:username
Get public profile information for a user.
**Response:**
```json
{
  "username": "jdoe",
  "role": "student",
  "institution": "Technical School",
  "bio": "...",
  "profilePicUrl": "..."
}
```

### GET /users (Admin Only)
Get a list of all users.
**Headers:** `x-user-name: <admin_username>`

### PUT /users/:id (Admin Only)
Update user role or institution.
**Headers:** `x-user-name: <admin_username>`

## Models

### GET /models
Get all uploaded 3D models with their associated hotspots.

### POST /models
Create a new model entry (after file upload).
**Body:**
```json
{
  "id": "model-123",
  "name": "Engine Block",
  "description": "...",
  "sector": "Automotive",
  "modelUrl": "/api/uploads/...",
  "uploadedBy": "jdoe"
}
```

### POST /upload
Upload a file (model or image).
**Form-Data:** `file: <binary>`
**Response:** `{ "url": "/api/uploads/filename.glb" }`

### PUT /models/:id
Update a model's metadata or hotspots.

### DELETE /models/:id
Delete a model and its associated file.

## Lessons

### GET /lessons
Get a list of all lessons.

### GET /lessons/:id
Get a specific lesson details including all steps.

### POST /lessons (Teacher/Admin Only)
Create a new lesson.
**Body:**
```json
{
  "title": "Interactive Engine Assembly",
  "description": "...",
  "sector_id": "Automotive",
  "steps": [ ... ]
}
```

## Workshops

### GET /workshops/active
Get a list of currently active collaborative workshops.

### POST /workshops
Create a new workshop session for a specific model.

## Sectors

### GET /sectors
Get a list of all available industry sectors.
