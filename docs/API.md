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

### GET /users (Admin Only)

Get a list of all users.
**Headers:** `x-user-name: <admin_username>`

### POST /users (Admin Only)

Create a new user manually.
**Headers:** `x-user-name: <admin_username>`
**Body:** Same as `/register`

### PUT /users/:id (Admin Only)

Update user role or institution.
**Headers:** `x-user-name: <admin_username>`
**Body:** `{"role": "teacher", "institution": "..."}`

### PUT /users/:id/profile

Update own profile information.
**Body:** `{"username": "...", "institution": "...", "bio": "...", "profilePicUrl": "..."}`

### DELETE /users/:id (Admin Only)

Delete a user account.
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
    "uploadedBy": "jdoe",
    "fileSize": 1024,
    "equipmentType": "Machine",
    "level": "Basic"
}
```

### POST /models/:id/optimize

Trigger AI optimization and analysis for a model.
**Response:** `{"success": true, "stats": {...}, "ai": "..."}`

### POST /upload

Upload a file (model or image).
**Form-Data:** `file: <binary>`
**Response:** `{ "url": "/api/uploads/filename.glb" }`

### PUT /models/:id

Update a model's metadata or hotspots.

### DELETE /models/:id

Delete a model and its associated file.

## Sectors

### GET /sectors

Get a list of all available industry sectors.
**Response:** `["Chemistry", "Mechanical", ...]`

### POST /sectors (Admin Only)

**Headers:** `X-User-Name: <admin_username>`
**Body:** `{"name": "New Sector"}`

### PUT /sectors/:name (Admin Only)

Rename a sector and migrate all models.
**Headers:** `X-User-Name: <admin_username>`
**Body:** `{"newName": "Updated Sector Name"}`

### DELETE /sectors/:name (Admin Only)

Delete a sector (only if unused).
**Headers:** `X-User-Name: <admin_username>`

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

### PUT /lessons/:id

Update lesson metadata and steps.

### DELETE /lessons/:id

Delete a lesson.

### POST /lessons/:id/attempt

Record a student's progress.
**Body:** `{"status": "completed", "score": 100, "last_step": 5}`

## Teacher Stats

### GET /teacher/stats

Get performance statistics for lessons created by the requesting teacher.
**Headers:** `X-User-Name: <teacher_username>`

## Workshops

### GET /workshops/active

Get a list of currently active collaborative workshops.

### POST /workshops

Create a new workshop session for a specific model.
**Body:** `{"modelId": "...", "createdBy": "..."}`

## GEAR Academy

### GET /academy

Get list of training videos.

### POST /academy (Admin Only)

Add a new video.
**Body:** `{"category": "basics", "video": {"title": "...", "url": "..."}}`

### PUT /academy/:id

Update a video.

### DELETE /academy/:id

Remove a video.

## Admin System

### GET /admin/logs

Get last 100 lines of server error logs.

### GET /admin/config

Get system configuration (maintenance mode, etc).

### PUT /admin/config

Update system configuration.

### GET /admin/backup

Download database backup (JSON or SQL).

### POST /admin/restore

Restore database from backup file.
