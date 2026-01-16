# STEP File Support Walkthrough

## Summary
Enabled support for uploading and viewing `.stp` and `.step` (STEP) files.

## Changes
- **Components**: Created `FileDownloadViewer` for handling non-renderable file formats.
- **Upload Form**: Updated `ModelUploadForm` to accept `.stp` and `.step` files and append `#step` fragment to URLs.
- **Edit Form**: Updated `ModelEditForm` to accept `.stp` and `.step` files.
- **Routing**: Updated `App.tsx` to route models with `#step` fragment or `.stp/.step` extension to `FileDownloadViewer`.

## Testing
- [ ] Build passed successfully.
- [ ] Uploaded STEP files should now appear in the gallery.
- [ ] Clicking a STEP model should open the Download Viewer instead of the 3D VR Viewer.
