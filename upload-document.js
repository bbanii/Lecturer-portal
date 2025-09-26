// Upload Document Modal and Functionality
function showUploadModal(folderId) {
  // Check if modal already exists and remove it to prevent duplicates
  const existingModal = document.getElementById('upload-document-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modalHtml = `
    <div class="modal" id="upload-document-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-upload"></i> Upload Document</h3>
          <button type="button" class="close" onclick="closeUploadModal()">&times;</button>
        </div>
        <form id="upload-document-form">
          <div class="form-group">
            <label for="document-title">Document Title*</label>
            <input type="text" id="document-title" name="title" required placeholder="Enter document title">
          </div>
          <div class="form-group">
            <label for="document-file">Select File*</label>
            <div class="file-input-container">
              <input type="file" id="document-file" name="file" required accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.ppt,.pptx,.xls,.xlsx">
              <div class="file-input-placeholder" onclick="triggerFileInput()">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to select a file or drag and drop</p>
                <small>Supported formats: PDF, DOC, DOCX, TXT, Images, ZIP, RAR, PPT, XLS</small>
              </div>
              <div class="selected-file-info"></div>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeUploadModal()">Cancel</button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-upload"></i> Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Show modal
  const modal = document.getElementById('upload-document-modal');
  setTimeout(() => modal.classList.add('show'), 10);

  // Handle file selection
  const fileInput = document.getElementById('document-file');
  const fileInfo = document.querySelector('.selected-file-info');
  const filePlaceholder = document.querySelector('.file-input-placeholder');

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      filePlaceholder.style.display = 'none';
      fileInfo.innerHTML = `
        <div class="selected-file">
          <div class="file-info">
            <i class="fas ${getFileIconByExtension(file.name)}"></i>
            <span>${file.name}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
          </div>
          <button type="button" class="remove-file" onclick="clearFileSelection()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      fileInfo.style.display = 'block';
    } else {
      clearFileSelection();
    }
  });

  // Add drag and drop functionality
  const fileContainer = document.querySelector('.file-input-container');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileContainer.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    fileContainer.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    fileContainer.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    fileContainer.classList.add('drag-over');
  }

  function unhighlight(e) {
    fileContainer.classList.remove('drag-over');
  }

  fileContainer.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  }

  // Handle form submission
  const form = document.getElementById('upload-document-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
      const file = form.querySelector('#document-file').files[0];
      const title = form.querySelector('#document-title').value.trim();

      if (!file) {
        throw new Error('Please select a file to upload');
      }

      if (!title) {
        throw new Error('Please enter a document title');
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds maximum limit (50MB)');
      }

      // Check authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);
      formData.append('title', title);

      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/upload/folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      if (!data.folderDocument) {
        throw new Error('Invalid server response format');
      }

      showNotification(data.message || 'Document uploaded successfully!', 'success');
      closeUploadModal();
      
      // Refresh folder contents
      if (typeof openFolder === 'function') {
        await openFolder(folderId);
      } else {
        showNotification('Document uploaded successfully. Please refresh to see changes.', 'info');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showNotification(error.message || 'Failed to upload document', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Function to trigger file input
function triggerFileInput() {
  const fileInput = document.getElementById('document-file');
  if (fileInput) {
    fileInput.click();
  }
}

// Function to clear file selection
function clearFileSelection() {
  const fileInput = document.getElementById('document-file');
  const fileInfo = document.querySelector('.selected-file-info');
  const filePlaceholder = document.querySelector('.file-input-placeholder');
  
  if (fileInput) {
    fileInput.value = '';
  }
  if (fileInfo) {
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
  }
  if (filePlaceholder) {
    filePlaceholder.style.display = 'block';
  }
}

function closeUploadModal() {
  const modal = document.getElementById('upload-document-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}