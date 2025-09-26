# Document Management System

## File Structure Overview

### folders.js
Handles the creation and management of folders in the system.
- Folder listing
- Folder grid view
- Empty state handling
- Folder navigation

### documents.js
Manages documents within folders, including viewing and actions.
- Document viewing
- Document actions (download, share, delete)
- Document grid view
- Document search and filtering

### upload-document.js
Handles all document upload functionality.
- Document upload modal
- File selection with drag and drop
- Upload progress tracking
- File validation

### lecturer-upload.js
Manages assignment-specific uploads and related functionality.
- Assignment file uploads
- Progress tracking
- Assignment form handling

## Component Relationships

1. Folders (folders.js)
   ↳ Contains → Documents (documents.js)
   ↳ Uses → Upload (upload-document.js)

2. Documents (documents.js)
   ↳ Uses → Upload (upload-document.js)
   ↳ Belongs to → Folders (folders.js)

3. Upload (upload-document.js)
   ↳ Serves → Folders (folders.js)
   ↳ Serves → Documents (documents.js)

4. Assignment Upload (lecturer-upload.js)
   ↳ Independent functionality for assignments