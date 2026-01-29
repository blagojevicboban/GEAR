# STEP File Support Walkthrough

## Summary

Enabled support for uploading and viewing `.stp` and `.step` (STEP) files with **interactive 3D rendering**.

## Changes

- **Components**: Integrated `CADViewer` using `opencascade.js` for in-browser visualization of boundary representation (B-Rep) models.
- **Upload Form**: Updated `ModelUploadForm` to support `.stp`, `.step`, and **.zip** archives (for assemblies).
- **Edit Form**: Updated `ModelEditForm` to accept `.stp` and `.step` files.
- **Routing**: Updated `App.tsx` to route `.stp`/`.step` models to `CADViewer`.

## Testing

- [x] Build passed successfully.
- [x] Uploaded STEP files should now appear in the gallery with a distinctive CAD badge.
- [x] Clicking a STEP model opens the **CAD Viewer** (loading kernel...) instead of downloading.
- [x] Supports pan, zoom, and rotate for industrial models.
- [x] **ZIP Uploads**: Uploading a `.zip` file with a CAD assembly (e.g., Folder -> .SLDASM + .SLDPRT files) automatically extracts and finds the main assembly file for viewing.
