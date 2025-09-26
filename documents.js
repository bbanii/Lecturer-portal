// Function to create folder content area
function createFolderContentArea() {
  // Remove any existing folder contents area
  const existingContent = document.getElementById('folder-contents');
  if (existingContent) {
    existingContent.remove();
  }

  const folderContentArea = document.createElement('div');
  folderContentArea.id = 'folder-contents';
  folderContentArea.className = 'folder-contents';
  
  // Find the documents section
  const documentsSection = document.getElementById('documents');
  if (!documentsSection) {
    console.error('Documents section not found');
    return null;
  }
  
  // Insert after the folders list
  const foldersList = document.getElementById('folders-list');
  if (foldersList) {
    foldersList.parentNode.insertBefore(folderContentArea, foldersList.nextSibling);
  } else {
    // If folders list doesn't exist, just append to the documents section
    documentsSection.appendChild(folderContentArea);
  }
  
  return folderContentArea;
}

// Function to open folder and display contents
async function openFolder(folderId) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const folderContentArea = document.getElementById('folder-contents') || createFolderContentArea();
    if (!folderContentArea) {
      throw new Error('Could not create folder content area');
    }

    folderContentArea.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading folder contents...</p>
      </div>
    `;

    const response = await fetch(
      `https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/folders/${folderId}/documents`,
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
      throw new Error(errorData.message || 'Failed to fetch folder contents');
    }

    const data = await response.json();
    console.log('Folder contents:', data);

    // Update folder content area with documents
    folderContentArea.innerHTML = `
      <div class="folder-view" data-folder-id="${data.folder._id}">
        <div class="folder-header">
          <div class="folder-info">
            <h3><i class="fas fa-folder-open"></i> ${data.folder.name}</h3>
            <span class="folder-meta">
              ${data.total} file${data.total !== 1 ? 's' : ''} • 
              <span class="folder-status ${data.folder.status.toLowerCase()}">${data.folder.status}</span>
            </span>
          </div>
          <div class="folder-actions">
            <button class="btn-primary" onclick="showUploadModal('${data.folder._id}')" title="Upload Document">
              <i class="fas fa-upload"></i> Upload Document
            </button>
          </div>
        </div>

        ${data.documents.length === 0 ? `
          <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>No documents in this folder</p>
            <p class="empty-message">Documents can only be added by administrators.</p>
          </div>
        ` : `
          <div class="documents-grid">
            ${data.documents.map(doc => {
              // Handle both nested and direct document structures
              const document = doc.document_id || doc;
              const documentId = document._id || doc._id;
              const fileInfo = document.fileInfo || {};
              
              return `
                <div class="document-card" data-id="${documentId}">
                  <div class="document-icon">
                    <i class="fas ${getFileIconByExtension(fileInfo.originalName || document.title)}"></i>
                  </div>
                  <div class="document-info">
                    <h4>${document.title}</h4>
                    <p class="file-name">${fileInfo.originalName || 'N/A'}</p>
                    <p class="file-meta">
                      <span class="file-size">${fileInfo.size ? formatFileSize(fileInfo.size) : 'Unknown size'}</span>
                      <span class="upload-date">Uploaded ${fileInfo.uploadDate ? new Date(fileInfo.uploadDate).toLocaleDateString() : 'Unknown date'}</span>
                    </p>
                    ${document.status ? `<p class="document-status status-${document.status.toLowerCase()}">${document.status}</p>` : ''}
                  </div>
                  <div class="document-actions">
                    <button onclick="downloadDocumentFromFolder('${document.file_url}', '${fileInfo.originalName || document.title}')" title="Download">
                      <i class="fas fa-download"></i>
                    </button>
                    <button onclick="shareDocument('${documentId}')" title="Share">
                      <i class="fas fa-share-alt"></i>
                    </button>
                    <button onclick="deleteDocument('${documentId}')" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${data.totalPages > 1 ? `
            <div class="pagination">
              <button ${data.currentPage <= 1 ? 'disabled' : ''} onclick="loadFolderPage('${data.folder._id}', ${data.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              <span>Page ${data.currentPage} of ${data.totalPages}</span>
              <button ${data.currentPage >= data.totalPages ? 'disabled' : ''} onclick="loadFolderPage('${data.folder._id}', ${data.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          ` : ''}
        `}
      </div>
    `;

  } catch (error) {
    console.error('Error opening folder:', error);
    const folderContentArea = document.getElementById('folder-contents') || createFolderContentArea();
    folderContentArea.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>${error.message}</p>
        <button onclick="openFolder('${folderId}')" class="retry-btn">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    `;
  }
}

// Helper function to get file icon based on extension
function getFileIconByExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    'pdf': 'fa-file-pdf',
    'doc': 'fa-file-word',
    'docx': 'fa-file-word',
    'xls': 'fa-file-excel',
    'xlsx': 'fa-file-excel',
    'ppt': 'fa-file-powerpoint',
    'pptx': 'fa-file-powerpoint',
    'txt': 'fa-file-alt',
    'jpg': 'fa-file-image',
    'jpeg': 'fa-file-image',
    'png': 'fa-file-image',
    'gif': 'fa-file-image',
    'zip': 'fa-file-archive',
    'rar': 'fa-file-archive'
  };
  return icons[ext] || 'fa-file';
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to load a specific page of folder contents
async function loadFolderPage(folderId, page) {
  await openFolder(folderId, page);
}

// Function to download a document
// We'll use the downloadDocument function from lecturer.js since it handles all types of downloads
// This ensures consistent download behavior across the application
async function downloadDocumentFromFolder(fileId, fileName) {
  // Use the shared downloadDocument function from lecturer.js
  return window.downloadDocument(fileId, fileName);
}

// Function to share a document
async function shareDocument(documentId) {
    try {
        // Show sharing modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'share-document-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-share-alt"></i> Share Document</h3>
                    <button type="button" class="close" onclick="closeShareModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="share-loading" class="text-center">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading users...</p>
                    </div>
                    <div id="share-error" class="error-message hidden">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load users</p>
                        <button onclick="loadUsers()">Retry</button>
                    </div>
                    <div id="share-users-container" class="hidden">
                        <div class="filters-container">
                            <div class="search-container">
                                <input type="text" 
                                       id="search-users" 
                                       placeholder="Search users..." 
                                       onkeyup="debounce(() => handleSearch(this.value), 300)">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="role-filter">
                                <select onchange="handleRoleFilter(this.value)">
                                    <option value="all">All Roles</option>
                                    <option value="Student">Students</option>
                                    <option value="Lecturer">Lecturers</option>
                                    <option value="HoD">Head of Department</option>
                                </select>
                            </div>
                        </div>
                        <div class="users-list" id="users-list">
                            <!-- Users will be populated here -->
                        </div>
                        <div id="users-pagination" class="pagination">
                            <!-- Pagination controls will be added here -->
                        </div>
                        <div class="selected-users" id="selected-users">
                            <h4>Selected Users:</h4>
                            <div class="selected-users-list" id="selected-users-list"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeShareModal()">Cancel</button>
                    <button type="button" class="btn-primary" onclick="submitShare('${documentId}')">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Load users
        loadUsers();

    } catch (error) {
        console.error('Error showing share modal:', error);
        showNotification('Failed to open share dialog', 'error');
    }
}

// Users pagination state
const usersState = {
    currentPage: 1,
    totalPages: 1,
    searchTerm: '',
    selectedRole: 'all',
    limit: 10
};

// Function to load users for sharing
async function loadUsers(resetPage = true) {
    const loadingElement = document.getElementById('share-loading');
    const errorElement = document.getElementById('share-error');
    const usersContainer = document.getElementById('share-users-container');
    const usersList = document.getElementById('users-list');

    try {
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
        usersContainer.classList.add('hidden');

        if (resetPage) {
            usersState.currentPage = 1;
        }

        // Build query parameters
        const queryParams = new URLSearchParams({
            page: usersState.currentPage,
            limit: usersState.limit
        });

        if (usersState.searchTerm) {
            queryParams.append('search', usersState.searchTerm);
        }

        if (usersState.selectedRole !== 'all') {
            queryParams.append('role', usersState.selectedRole);
        }

        const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/file-share/users?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const result = await response.json();
        
        if (!result.success || !result.data || !Array.isArray(result.data.users)) {
            throw new Error('Invalid response format');
        }

        const { users, pagination } = result.data;

        // Update pagination state
        usersState.currentPage = pagination.current;
        usersState.totalPages = pagination.total;

        // Render users list
        usersList.innerHTML = users.map(user => `
            <div class="user-item" data-id="${user._id}">
                <div class="user-info">
                    <span class="user-name">${user.name}</span>
                    <span class="user-email">${user.email}</span>
                    <div class="user-details">
                        <span class="user-role">${user.role}</span>
                        ${user.studentId ? `<span class="user-id">ID: ${user.studentId}</span>` : ''}
                        ${user.level ? `<span class="user-level">Level: ${user.level}</span>` : ''}
                    </div>
                </div>
                <button class="select-user-btn" onclick="toggleUserSelection('${user._id}', '${user.name}')">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');

        // Add pagination controls if needed
        const paginationContainer = document.getElementById('users-pagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = pagination.totalRecords > usersState.limit ? `
                <button ${pagination.current <= 1 ? 'disabled' : ''} 
                        onclick="changePage(${pagination.current - 1})">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span>Page ${pagination.current} of ${pagination.total}</span>
                <button ${!pagination.hasNextPage ? 'disabled' : ''} 
                        onclick="changePage(${pagination.current + 1})">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            ` : '';
        }

        loadingElement.classList.add('hidden');
        usersContainer.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading users:', error);
        loadingElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
    }
}

// Function to handle search input
function handleSearch(searchTerm) {
    usersState.searchTerm = searchTerm;
    loadUsers();
}

// Function to handle role filter change
function handleRoleFilter(role) {
    usersState.selectedRole = role;
    loadUsers();
}

// Function to change page
function changePage(page) {
    usersState.currentPage = page;
    loadUsers(false);
}

// Selected users storage
const selectedUsers = new Set();

// Function to toggle user selection
function toggleUserSelection(userId, userName) {
    const selectedList = document.getElementById('selected-users-list');
    const button = document.querySelector(`.user-item[data-id="${userId}"] .select-user-btn`);

    if (selectedUsers.has(userId)) {
        selectedUsers.delete(userId);
        document.getElementById(`selected-${userId}`).remove();
        button.innerHTML = '<i class="fas fa-plus"></i>';
    } else {
        selectedUsers.add(userId);
        selectedList.insertAdjacentHTML('beforeend', `
            <div class="selected-user" id="selected-${userId}">
                <span>${userName}</span>
                <button onclick="toggleUserSelection('${userId}', '${userName}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        button.innerHTML = '<i class="fas fa-check"></i>';
    }
}

// Function to close share modal
function closeShareModal() {
    const modal = document.getElementById('share-document-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
    selectedUsers.clear();
}

// Function to submit share
async function submitShare(documentId) {
    try {
        if (selectedUsers.size === 0) {
            showNotification('Please select at least one user to share with', 'warning');
            return;
        }

        const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/file-share/documents/${documentId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_ids: Array.from(selectedUsers)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to share document');
        }

        showNotification(data.message || 'Document shared successfully', 'success');
        closeShareModal();

    } catch (error) {
        console.error('Error sharing document:', error);
        showNotification(error.message || 'Failed to share document', 'error');
    }
}

// Function to delete a document
async function deleteDocument(documentId) {
    // Show confirmation dialog with document details
    const documentCard = document.querySelector(`[data-id="${documentId}"]`);
    if (!documentCard) {
        showNotification('Document not found', 'error');
        return;
    }

    const documentTitle = documentCard.querySelector('h4').textContent;
    const deleteModal = document.createElement('div');
    deleteModal.className = 'delete-modal';
    deleteModal.innerHTML = `
        <div class="delete-modal-content">
            <div class="delete-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
                <button class="delete-close-btn">&times;</button>
            </div>
            <div class="delete-body">
                <div class="delete-message">
                    Are you sure you want to delete the following document?
                </div>
                <div class="document-info">
                    <i class="fas fa-file-alt"></i>
                    <span class="delete-item-name">${documentTitle}</span>
                </div>
                <div class="delete-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>This action cannot be undone. The document will be permanently deleted.</span>
                </div>
                <div class="delete-confirmation">
                    <label for="delete-confirm">Type "delete" to confirm:</label>
                    <input type="text" id="delete-confirm" placeholder="Type 'delete' to confirm" autocomplete="off">
                </div>
            </div>
            <div class="delete-actions">
                <button class="delete-btn delete-btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="delete-btn delete-btn-confirm" disabled>
                    <i class="fas fa-trash"></i> Delete Document
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(deleteModal);

    // Add event listeners for modal actions
    const closeBtn = deleteModal.querySelector('.delete-close-btn');
    const cancelBtn = deleteModal.querySelector('.delete-btn-cancel');
    const deleteBtn = deleteModal.querySelector('.delete-btn-confirm');
    const confirmInput = deleteModal.querySelector('#delete-confirm');

    const closeModal = () => {
        deleteModal.classList.remove('active');
        setTimeout(() => deleteModal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Add confirmation input listener
    confirmInput.addEventListener('input', (e) => {
        deleteBtn.disabled = e.target.value.toLowerCase() !== 'delete';
    });
    
    // Handle delete confirmation
    deleteBtn.addEventListener('click', async () => {
        try {
            // Show loading state
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

            // Use the correct API endpoint for document deletion
            const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                // If response is not JSON or empty, create a default response
                data = { message: response.statusText };
            }
            
            // Consider both 200 (OK) and 404 (Not Found) as successful deletions
            // since in both cases we want to remove the document from the UI
            if (response.status === 200 || response.status === 404) {
                documentCard.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    documentCard.remove();
                    closeModal();
                    showNotification('Document has been removed', 'success');
                    
                    // Check if folder is empty and show empty state if needed
                    const documentsGrid = documentCard.parentElement;
                    if (documentsGrid && documentsGrid.children.length === 0) {
                        documentsGrid.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-folder-open"></i>
                                <p>No documents in this folder</p>
                                <p class="empty-message">Upload documents using the button above.</p>
                            </div>
                        `;
                    }
                }, 300);
                return;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to delete this document');
                } else {
                    throw new Error(data.message || 'Failed to delete document');
                }
            }

            // Success case
            documentCard.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                documentCard.remove();
                closeModal();
                showNotification('Document deleted successfully', 'success');
                
                // Check if folder is empty and show empty state if needed
                const documentsGrid = documentCard.parentElement;
                if (documentsGrid && documentsGrid.children.length === 0) {
                    documentsGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-folder-open"></i>
                            <p>No documents in this folder</p>
                            <p class="empty-message">Upload documents using the button above.</p>
                        </div>
                    `;
                }
            }, 300);

        } catch (error) {
            console.error('Error deleting document:', error);
            
            // Handle specific error cases
            let errorMessage = 'Failed to delete document';
            if (error.message.includes('not found')) {
                errorMessage = 'Document not found or already deleted';
            } else if (error.message.includes('access denied')) {
                errorMessage = 'You do not have permission to delete this document';
            } else if (error.message.includes('Authentication')) {
                errorMessage = 'Please log in again to delete this document';
                // Optionally redirect to login
                setTimeout(() => window.location.href = '/login.html', 2000);
            }
            
            showNotification(errorMessage, 'error');
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Document';
        }
    });

    // Show modal with animation
    document.body.appendChild(deleteModal);
    setTimeout(() => deleteModal.classList.add('active'), 50);
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// File upload functionality has been removed