// Function to load and display folders
async function loadFolders() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const foldersList = document.getElementById('folders-list');
    if (!foldersList) {
      throw new Error('Folders list container not found');
    }

    foldersList.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading folders...</p>
      </div>
    `;

    const response = await fetch(
      'https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/folders',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch folders');
    }

    const data = await response.json();
    
    if (data.folders.length === 0) {
      foldersList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No folders found</p>
          <p>Create a new folder to get started</p>
        </div>
      `;
      return;
    }

    foldersList.innerHTML = `
      <div class="folders-grid">
        ${data.folders.map(folder => `
          <div class="folder-card" data-id="${folder._id}">
            <div class="folder-icon" onclick="openFolder('${folder._id}')">
              <i class="fas fa-folder"></i>
            </div>
            <div class="folder-info">
              <h4>${folder.name}</h4>
              <p class="folder-meta">
                ${folder.documentCount || 0} document${folder.documentCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div class="folder-actions">
              <button class="btn-primary" onclick="showUploadModal('${folder._id}')" title="Upload to this folder">
                <i class="fas fa-upload"></i> Upload
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error loading folders:', error);
    const foldersList = document.getElementById('folders-list');
    if (foldersList) {
      foldersList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>${error.message}</p>
          <button onclick="loadFolders()" class="retry-btn">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }
}

// Load folders when the page loads
document.addEventListener('DOMContentLoaded', loadFolders);