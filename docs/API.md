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

## Configuration & Public Data

### GET /config/public

Fetch non-sensitive system configuration. Used by the frontend for branding and security checks before login.
**Response:**
```json
{
  "brand_name": "THE GEAR",
  "brand_color": "#4f46e5",
  "global_announcement": "Classes are cancelled tomorrow...",
  "maintenance_mode": "false",
  "allow_public_registration": "true",
  "show_leaderboard": "true"
}
```

## Admin System

### GET /admin/logs

Get last 100 lines of server error logs.

### GET /admin/config

Get system configuration.
**Response Keys:**
- `maintenance_mode`: (bool)
- `global_announcement`: (string)
- `gemini_api_key`: (string - encrypted)
- `allowed_origins`: (string - CSV)
- `allow_public_registration`: (bool)
- `max_file_size_mb`: (int)
- `moodle_url`: (string)
- `moodle_client_id`: (string)
- `brand_name`: (string)
- `brand_color`: (hex)
- `ai_model`: (string)
- `ai_language`: (string: 'Auto' | 'Serbian' | 'English' | ...)
- `ai_temperature`: (float: 0.0 - 1.0)
- `challenge_duration_days`: (int)
- `show_leaderboard`: (bool)

### PUT /admin/config

Update system configuration.

### GET /admin/backup

Download system backup.
**Query Parameters:**
- `format`: `json` (tables only), `sql` (Database only via mysqldump), or `full` (Full System ZIP with DB + Uploads)
- `token`: Client-side token for download tracking (optional)

### POST /admin/restore

Restore system from backup file.
**Body:** Form-Data with `file`.
- Supports `.json` (Data merge), `.sql` (Full Database Restore), or `.zip` (Full System Restore - **Danger: Overwrites DB & Files**).

## WebSockets (Socket.io)

Real-time communication is handled via Socket.io at the root URL (proxied via `/socket.io`).

### Events (Client -> Server)

#### `join-workshop`
Joins a specific workshop room.
- **Payload**: `{ workshopId: string, user: { id, username, role } }`

#### `update-transform`
Broadcasts the user's current spatial information (Head/Hands).
- **Payload**:
  ```json
  {
      "workshopId": "123",
      "transforms": {
          "head": { "pos": { "x": 0, "y": 0, "z": 0 }, "rot": { "x": 0, "y": 0, "z": 0 } },
          "leftHand": { "pos": ..., "rot": ... }, // Optional
          "rightHand": { "pos": ..., "rot": ... } // Optional
      }
  }
  ```

#### `teacher-sync-update` (Teacher Only)
Broadcasts the teacher's camera view to force-sync students.
- **Payload**:
  ```json
  {
      "workshopId": "123",
      "camera": {
          "position": { "x": 0, "y": 1.6, "z": 0 },
          "rotation": { "x": 0, "y": 0, "z": 0 }
      }
  }
  ```

#### `teacher-pointer-move` (Teacher Only)
Broadcasts 3D laser pointer data.
- **Payload**:
  ```json
  {
      "workshopId": "123",
      "pointer": {
          "active": true,
          "origin": { "x": 0, "y": 0, "z": 0 },
          "target": { "x": 0, "y": 0, "z": -10 }
      }
  }
  ```

### Events (Server -> Client)

#### `user-joined`
Fired when a new user enters the room.
- **Payload**: `{ socketId, ...userProfile }`

#### `user-left`
Fired when a user disconnects.
- **Payload**: `socketId`

#### `participant-moved`
Updates a remote user's avatar.
- **Payload**: `{ socketId, transforms }`

#### `teacher-sync-update`
Received by students. Contains teacher's camera transform to comply with.
- **Payload**: `{ socketId, camera }`

#### `teacher-pointer-move`
Received by all. Contains pointer data to render 3D line.
- **Payload**: `{ socketId, pointer }`
