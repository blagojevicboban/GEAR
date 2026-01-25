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

## Admin Endpoints

### Get System Logs
**GET** `/api/admin/logs`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Response**: Plain text (last 100 lines of server error log).

### Get System Config
**GET** `/api/admin/config`
*   **Response**: `200 OK`
    ```json
    {
      "maintenance_mode": "false",
      "global_announcement": "Check out the new engine model!"
    }
    ```

### Update System Config
**PUT** `/api/admin/config`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Body**:
    ```json
    {
      "maintenance_mode": "true",
      "global_announcement": "System maintenance in 1 hour."
    }
    ```

### Database Backup
**GET** `/api/admin/backup`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Query Params**: `format=json` (default) or `format=sql`
*   **Response**: File download (`.json` or `.sql`).

### Database Restore
**POST** `/api/admin/restore`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Body** (Multipart): `file` (.json or .sql)
*   **Response**: `200 OK` or `500 Error`

---

## Sector Endpoints

### Get All Sectors
**GET** `/api/sectors`
*   **Response**: Array of strings. `["Chemistry", "Mechanical", ...]`

### Create Sector
**POST** `/api/sectors`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Body**: `{"name": "New Sector"}`
*   **Response**: `200 OK`

### Rename Sector
**PUT** `/api/sectors/:name`
*   **Headers**: `X-User-Name: <admin_username>`
*   **Body**: `{"newName": "Updated Sector Name"}`

### Delete Sector
**DELETE** `/api/sectors/:name`
*   **Headers**: `X-User-Name: <admin_username>`

---

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
