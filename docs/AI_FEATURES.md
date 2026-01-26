# AI & Analytics Features - User Guide

## 1. AI Lesson Generator

The **AI Lesson Generator** uses Google's Gemini 2.0 Flash model to automatically create educational steps for 3D Technical models.

### How to Use
1.  **Go to Workbook Builder**: Create a new lesson or edit an existing one.
2.  **Select a Model**: Ensure a 3D model is associated with the lesson (or step).
3.  **Click "Generate with AI"**: A magic wand icon button appears in the step editor.
4.  **Configure**:
    *   **Topic**: E.g., "Safety procedures" or "Maintenance guide".
    *   **Level**: Beginner, Intermediate, Advanced.
    *   **Count**: Number of steps to generate (3-10).
5.  **Review**: The AI will populate the timeline. You can edit any text before saving.
    *   **Pro Tip**: The AI is now optimized to generate various interaction types, including **Model Identification** quizzes (where students must click parts in 3D) and **Multiple Choice** checks.

### Requirements
*   A valid `GEMINI_API_KEY` must be configured in **Admin Settings > Configuration**.

---

## 2. 3D Heatmaps (Analytics)

Heatmaps provide visual feedback on how students interact with 3D content during lessons.

### Telemetry Collection
*   **Automatic**: Tracking starts automatically when a student enters the **VR Viewer**.
*   **Gaze Tracking**: The system records the intersection point of the user's view (center of screen) with the model every second from a batch buffer.
*   **Privacy**: Data is aggregated. Individual sessions are logged anonymously or by User ID if logged in.

### Viewing Heatmaps
1.  **Teacher Dashboard**: Navigate to the new **Analytics** tab.
2.  **Select Model**: Choose a model from the list of those you have uploaded or have admin access to.
3.  **Analyze**:
    *   **Red Clouds**: Indicate high engagement/focus areas.
    *   **Density**: More points = more time spent looking at that specific coordinate.
    *   **Rotation**: You can rotate the model to inspect engagement from all angles.

### Troubleshooting
*   **No Data**: Ensure students have spent at least 10 seconds in the viewer. Logs are flushed on exit or every 10s.
*   **Server Logs**: Check `server_error.log` if analytics fail to save.
