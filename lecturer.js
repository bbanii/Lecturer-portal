// ...existing code...
// Authentication check function
function checkAuth() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    window.location.href = './login.html';
    return false;
  }

  return true;
}

// Function to make authenticated API requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Helper function to get default notification title based on type
function getDefaultTitle(type) {
  switch(type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    default:
      return 'Notification';
  }
}

// Helper function to get appropriate FontAwesome icon class based on notification type
function getIconClass(type) {
  switch(type) {
    case 'success':
      return 'fa-check-circle';
    case 'error':
      return 'fa-exclamation-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    default:
      return 'fa-info-circle';
  }
}

// Global notification function
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  // Create icon based on type
  const icon = document.createElement('div');
  icon.className = 'notification-icon';
  let iconHtml = '';
  switch(type) {
    case 'success':
      iconHtml = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      iconHtml = '<i class="fas fa-exclamation-circle"></i>';
      break;
    default:
      iconHtml = '<i class="fas fa-info-circle"></i>';
  }
  icon.innerHTML = iconHtml;

  // Create content container
  const content = document.createElement('div');
  content.className = 'notification-content';

  // Add title based on type
  const title = document.createElement('div');
  title.className = 'notification-title';
  title.textContent = type.charAt(0).toUpperCase() + type.slice(1);

  // Add message
  const messageEl = document.createElement('div');
  messageEl.className = 'notification-message';
  messageEl.textContent = message;

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.onclick = () => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  };

  // Assemble notification
  content.appendChild(title);
  content.appendChild(messageEl);
  notification.appendChild(icon);
  notification.appendChild(content);
  notification.appendChild(closeBtn);
  
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Function to convert numeric grade to letter grade
function getLetterGrade(numericGrade) {
  const grade = parseFloat(numericGrade);
  
  if (grade >= 80) return 'A';
  if (grade >= 76) return 'B+';
  if (grade >= 71) return 'B';
  if (grade >= 66) return 'C+';
  if (grade >= 61) return 'C';
  if (grade >= 56) return 'D+';
  if (grade >= 50) return 'D';
  if (grade >= 40) return 'E';
  return 'F';
}

// Function to get CSS class for letter grade
function getGradeClass(letterGrade) {
  const grade = letterGrade.toLowerCase();
  if (grade === 'a') return 'grade-a';
  if (grade.startsWith('b')) return 'grade-b';
  if (grade.startsWith('c')) return 'grade-c';
  if (grade.startsWith('d')) return 'grade-d';
  if (grade === 'e') return 'grade-e';
  if (grade === 'f') return 'grade-f';
  return '';
}

// Function to show assignment details in overlay
async function loadSubmissions(assignmentId, page = 1) {
  // Validate assignmentId
  if (!assignmentId) {
    showNotification('Error: Assignment ID is missing', 'error');
    return;
  }
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('submissions-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'submissions-overlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <button class="close-overlay"><i class="fas fa-times"></i></button>
        <div class="submissions-header">
          <h3><i class="fas fa-tasks"></i> Submissions</h3>
        </div>
        <div id="submissions-list" class="submissions-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Add close functionality
    overlay.querySelector('.close-overlay').addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  }

  // Show the overlay
  overlay.classList.add('active');

  const submissionsList = document.getElementById('submissions-list');

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/submissions?assignment_id=${assignmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch submissions');
    }

    const data = await response.json();
    console.log('Submissions data:', data); // Debug log
    
    if (!data.submissions || data.submissions.length === 0) {
      submissionsList.innerHTML = `
        <div class="no-submissions">
          <i class="fas fa-inbox"></i>
          <div class="empty-state">
            <h4>No Submissions Yet</h4>
            <p>When students submit their assignments, they will appear here.</p>
          </div>
        </div>
      `;
      return;
    }

    // Calculate submission statistics
    const totalSubmissions = data.total;
    const submissionsHtml = `
      <div class="submissions-stats">
        <div class="stat-item">
          <i class="fas fa-file-alt"></i>
          <div class="stat-info">
            <span class="stat-value">${totalSubmissions}</span>
            <span class="stat-label">Total Submissions</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="fas fa-clock"></i>
          <div class="stat-info">
            <span class="stat-value">${data.currentPage} / ${data.totalPages}</span>
            <span class="stat-label">Current Page</span>
          </div>
        </div>
      </div>
      <div class="submissions-grid">
        ${data.submissions.map(submission => `
          <div class="submission-card">
            <div class="submission-header">
              <div class="student-info">
                <i class="fas fa-user-graduate"></i>
                <div>
                  <h4>${submission.student_id?.name || 'Unknown Student'}</h4>
                  <span>${submission.student_id?.studentId || 'No ID'}</span>
                </div>
              </div>
              <div class="submission-date">
                <i class="fas fa-calendar-alt"></i>
                <span>${new Date(submission.submitted_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
            <div class="submission-body">
              ${submission.document_id ? `
                <div class="file-info">
                  <i class="fas fa-file-alt"></i>
                  <span class="file-name">${submission.document_id.originalName || 'Unnamed File'}</span>
                  <span class="file-size">${formatFileSize(submission.document_id.size || 0)}</span>
                </div>
              ` : '<div class="no-file">No file submitted</div>'}
            </div>
            <div class="submission-actions">
              ${submission.document_id ? `
                <button class="action-btn" onclick="downloadDocument('${submission.document_id._id}', '${submission.document_id.originalName}')">
                  <i class="fas fa-download"></i> Download
                </button>
              ` : ''}
              <button class="action-btn" onclick="viewSubmission('${submission._id}')">
                <i class="fas fa-eye"></i> View
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      ${data.totalPages > 1 ? `
        <div class="pagination-controls">
          <button class="pagination-btn" ${data.currentPage <= 1 ? 'disabled' : ''} 
                  onclick="loadSubmissionPage('${assignmentId}', ${data.currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          <span class="page-info">Page ${data.currentPage} of ${data.totalPages}</span>
          <button class="pagination-btn" ${data.currentPage >= data.totalPages ? 'disabled' : ''} 
                  onclick="loadSubmissionPage('${assignmentId}', ${data.currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      ` : ''}
    `;

    submissionsList.innerHTML = submissionsHtml;

  } catch (error) {
    console.error('Error fetching submissions:', error);
    submissionsList.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <div class="error-message">
          <h4>Error Loading Submissions</h4>
          <p>${error.message}</p>
          <button onclick="loadSubmissions('${assignmentId}')" class="retry-btn">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    `;
  }
}

// Helper function to load a specific page of submissions
async function loadSubmissionPage(assignmentId, page) {
  if (!assignmentId) {
    console.error('Assignment ID is missing');
    showNotification('Error: Assignment ID is missing', 'error');
    return;
  }
  await loadSubmissions(assignmentId, page);
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to view submission details
function viewSubmission(submissionId) {
  console.log('Viewing submission:', submissionId);
  // Open grading modal which allows both viewing and grading
  showGradingModal(submissionId);
}

// Global function to download any document (submissions, assignments, files)
// This is used by other modules in the application
window.downloadDocument = async function(fileId, fileName, type = 'submission') {
  try {
    // Validate file ID
    if (!fileId || fileId === 'undefined' || fileId.trim() === '') {
      throw new Error('File ID is missing or invalid');
    }

    // Validate file name
    if (!fileName || fileName.trim() === '') {
      fileName = 'download'; // Default filename
    }

    // Get the auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log('Downloading file:', { fileId, fileName, type }); // Debug log
    
    // Construct the download URL with the file ID
    const downloadUrl = `https://department-mangement-system-97wj.onrender.com/api/files/download/${fileId}`;
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Download response status:', response.status); // Debug log
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Download error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    showNotification('File download started', 'success');
  } catch (error) {
    console.error('Error downloading file:', error);
    showNotification('Failed to download file: ' + error.message, 'error');
  }
}

// Function to grade submission
async function gradeSubmission(submissionId) {
  console.log('Grading submission:', submissionId);
  
  try {
    // Get current assignment ID
    const currentAssignmentId = getCurrentAssignmentId();
    if (!currentAssignmentId) {
      showGradingModal(submissionId);
      return;
    }

    // Fetch submission details to get existing grade and feedback
    const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/submissions?assignment_id=${currentAssignmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const submission = data.submissions?.find(sub => sub._id === submissionId);
      console.log('Found submission for grading:', submission); // Debug log
      showGradingModal(submissionId, submission);
    } else {
      showGradingModal(submissionId);
    }
  } catch (error) {
    console.error('Error fetching submission details:', error);
    showGradingModal(submissionId);
  }
}

// Function to show grading modal
function showGradingModal(submissionId, existingSubmission = null) {
  // Create grading modal if it doesn't exist
  let gradingModal = document.getElementById('grading-modal');
  if (!gradingModal) {
    gradingModal = document.createElement('div');
    gradingModal.id = 'grading-modal';
    gradingModal.className = 'overlay';
    gradingModal.innerHTML = `
      <div class="overlay-content">
        <button class="close-overlay"><i class="fas fa-times"></i></button>
        <div class="grading-form-container">
          <h3><i class="fas fa-star"></i> Grade Submission</h3>
          <form id="grading-form">
            <input type="hidden" id="submission-id" name="submissionId">
            
            <div class="form-group">
              <label for="grade-input">Grade (0-100) <span class="required">*</span></label>
              <input 
                type="number" 
                id="grade-input" 
                name="grade" 
                min="0" 
                max="100" 
                step="0.1" 
                placeholder="Enter grade between 0 and 100" 
                required
              >
              <div class="grade-validation"></div>
            </div>
            
            <div class="form-group">
              <label for="feedback-input">Feedback (Optional)</label>
              <textarea 
                id="feedback-input" 
                name="feedback" 
                rows="4" 
                placeholder="Provide feedback for the student (optional)"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeGradingModal()">Cancel</button>
              <button type="submit" class="btn-primary">Submit Grade</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(gradingModal);

    // Add event listeners
    gradingModal.addEventListener('click', function(e) {
      if (e.target === gradingModal || e.target.closest('.close-overlay')) {
        closeGradingModal();
      }
    });

    // Add form validation
    const gradeInput = gradingModal.querySelector('#grade-input');
    const gradeValidation = gradingModal.querySelector('.grade-validation');
    
    gradeInput.addEventListener('input', function() {
      const value = parseFloat(this.value);
      gradeValidation.innerHTML = '';
      
      if (this.value === '') {
        gradeValidation.innerHTML = '<span class="validation-error">Grade is required</span>';
      } else if (isNaN(value) || value < 0 || value > 100) {
        gradeValidation.innerHTML = '<span class="validation-error">Grade must be between 0 and 100</span>';
      } else {
        gradeValidation.innerHTML = '<span class="validation-success">Grade is valid</span>';
      }
    });

    // Add form submit handler
    const gradingForm = gradingModal.querySelector('#grading-form');
    gradingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitGrade();
    });
  }

  // Set the submission ID and show modal
  document.getElementById('submission-id').value = submissionId;
  
  // Pre-populate form if editing existing grade
  if (existingSubmission && existingSubmission.grade !== null && existingSubmission.grade !== undefined && existingSubmission.grade !== '') {
    document.getElementById('grade-input').value = existingSubmission.grade;
    if (existingSubmission.feedback) {
      document.getElementById('feedback-input').value = existingSubmission.feedback;
    }
    
    // Update modal title to indicate editing
    const modalTitle = gradingModal.querySelector('h3');
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Grade';
    
    // Update submit button text
    const submitBtn = gradingModal.querySelector('.btn-primary');
    submitBtn.textContent = 'Update Grade';
  } else {
    // Reset to default state for new grading
    document.getElementById('grade-input').value = '';
    document.getElementById('feedback-input').value = '';
    
    const modalTitle = gradingModal.querySelector('h3');
    modalTitle.innerHTML = '<i class="fas fa-star"></i> Grade Submission';
    
    const submitBtn = gradingModal.querySelector('.btn-primary');
    submitBtn.textContent = 'Submit Grade';
  }
  
  gradingModal.classList.add('active');
  document.getElementById('grade-input').focus();
}

// Function to close grading modal
function closeGradingModal() {
  const gradingModal = document.getElementById('grading-modal');
  if (gradingModal) {
    gradingModal.classList.remove('active');
    // Reset form
    gradingModal.querySelector('#grading-form').reset();
    gradingModal.querySelector('.grade-validation').innerHTML = '';
  }
}

// Function to submit grade
async function submitGrade() {
  console.log('submitGrade function called'); // Debug log
  
  const submissionId = document.getElementById('submission-id').value;
  const gradeInput = document.getElementById('grade-input');
  const feedbackInput = document.getElementById('feedback-input');
  const submitBtn = document.querySelector('#grading-form button[type="submit"]');

  console.log('Form elements found:', {
    submissionId,
    gradeInput: !!gradeInput,
    feedbackInput: !!feedbackInput,
    submitBtn: !!submitBtn
  }); // Debug log

  if (!gradeInput || !feedbackInput || !submitBtn) {
    console.error('Form elements not found');
    showNotification('Form elements not found. Please try again.', 'error');
    return;
  }

  const grade = parseFloat(gradeInput.value);
  const feedback = feedbackInput.value.trim();

  console.log('Form values:', { submissionId, grade, feedback }); // Debug log

  // Validate grade
  if (isNaN(grade) || grade < 0 || grade > 100) {
    showNotification('Please enter a valid grade between 0 and 100', 'error');
    return;
  }

  // Show loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  submitBtn.disabled = true;

  try {
    const requestBody = { grade };
    
    // Add feedback only if provided
    if (feedback) {
      requestBody.feedback = feedback;
    }

    console.log('Submitting grade:', requestBody); // Debug log

    const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Grade submission response:', data); // Debug log

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit grade');
    }

    showNotification('Grade submitted successfully!', 'success');
    closeGradingModal();
    
    // Refresh submissions list to show updated grade
    const currentAssignmentId = getCurrentAssignmentId();
    if (currentAssignmentId) {
      // Add a small delay to ensure server has processed the update
      setTimeout(() => {
        loadSubmissions(currentAssignmentId);
      }, 500);
    }

  } catch (error) {
    console.error('Error submitting grade:', error);
    showNotification('Failed to submit grade: ' + error.message, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Helper function to get current assignment ID (you may need to adjust this based on your implementation)
function getCurrentAssignmentId() {
  // This assumes you store the current assignment ID somewhere accessible
  // You might need to modify this based on how you track the current assignment
  const assignmentDetailsOverlay = document.getElementById('assignment-details-overlay');
  return assignmentDetailsOverlay?.dataset?.assignmentId || null;
}

function showAssignmentDetails(assignment) {
  // First, let's create the overlay if it doesn't exist
  let overlay = document.getElementById('assignment-details-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'assignment-details-overlay';
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }

  const dueDate = new Date(assignment.due_date);
  const createdDate = new Date(assignment.createdAt);
  const updatedDate = new Date(assignment.updatedAt);
  const timeRemaining = getTimeRemaining(dueDate);

  overlay.innerHTML = `
    <div class="overlay-content assignment-details">
      <button class="close-overlay">
        <i class="fas fa-times"></i>
      </button>
      
      <div class="assignment-detail-header">
        <div class="header-main">
          <h2>${assignment.title}</h2>
          <div class="course-badge">
            ${assignment.course_id.code} - ${assignment.course_id.title}
          </div>
        </div>
        
        <div class="due-date-section ${timeRemaining.isPast ? 'past-due' : ''}">
          <div class="due-date-info">
            <i class="fas fa-clock"></i>
            <span>Due: ${dueDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="time-remaining">
            ${timeRemaining.text}
          </div>
        </div>
      </div>

      <div class="assignment-body">
        <div class="description-section">
          <h3><i class="fas fa-align-left"></i> Description</h3>
          <div class="description-content">
            ${assignment.description}
          </div>
        </div>

        <div class="meta-info">
          <div class="meta-section">
            <h4><i class="fas fa-user"></i> Created By</h4>
            <div class="instructor-info">
              <span class="instructor-name">${assignment.created_by.name}</span>
              <span class="instructor-email">${assignment.created_by.email}</span>
            </div>
          </div>

          <div class="meta-section">
            <h4><i class="fas fa-history"></i> Timeline</h4>
            <div class="timeline-info">
              <div class="timeline-item">
                <i class="fas fa-plus-circle"></i>
                <span>Created: ${formatDate(createdDate)}</span>
              </div>
              <div class="timeline-item">
                <i class="fas fa-edit"></i>
                <span>Last Updated: ${formatDate(updatedDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add overlay close functionality
  overlay.querySelector('.close-overlay').addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  // Close on click outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  // Show the overlay
  overlay.classList.add('active');
}

// Helper function to format dates
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to calculate time remaining
function getTimeRemaining(dueDate) {
  const now = new Date();
  const timeLeft = dueDate - now;
  const isPast = timeLeft < 0;
  
  if (isPast) {
    return {
      isPast: true,
      text: '<span class="past-due">Past Due</span>'
    };
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return {
      isPast: false,
      text: `<span class="time-left">Due in ${days} day${days > 1 ? 's' : ''}</span>`
    };
  } else if (hours > 0) {
    return {
      isPast: false,
      text: `<span class="time-left urgent">Due in ${hours} hour${hours > 1 ? 's' : ''}</span>`
    };
  } else {
    return {
      isPast: false,
      text: `<span class="time-left very-urgent">Due in ${minutes} minute${minutes > 1 ? 's' : ''}</span>`
    };
  }
}

// Online/offline status notifications
window.addEventListener('online', () => {
  showNotification('Back online', 'success');
});

window.addEventListener('offline', () => {
  showNotification('You are offline. Some features may be limited.', 'warning');
});

// Mobile navigation
const hamburgerMenu = document.getElementById('hamburger-menu');
const nav = document.querySelector('nav');

hamburgerMenu.addEventListener('click', () => {
  hamburgerMenu.classList.toggle('active');
  nav.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!nav.contains(e.target) && !hamburgerMenu.contains(e.target)) {
    nav.classList.remove('active');
    hamburgerMenu.classList.remove('active');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication first
  if (!checkAuth()) return;

  // Project Year Form Handling
  const projectYearForm = document.getElementById('create-project-year-form');
  const academicYearInput = document.getElementById('academic-year');
  const departmentInfo = document.getElementById('department-info');

  if (projectYearForm && academicYearInput && departmentInfo) {
    // Load department info on page load
    loadDepartmentInfo();

    // Validate academic year format as user types
    academicYearInput.addEventListener('input', function() {
      validateAcademicYear(this.value);
    });

    // Handle form submission
    projectYearForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('button[type="submit"]');
      const formStatus = this.querySelector('.form-status');
      const yearValue = academicYearInput.value;

      // Validate before submission
      if (!validateAcademicYear(yearValue)) {
        showNotification('Please enter a valid academic year format (YYYY/YYYY)', 'error');
        return;
      }

      // Show loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const response = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/projects/years', {
          method: 'POST',
          body: JSON.stringify({
            academic_year: yearValue,
            department_id: departmentInfo.dataset.departmentId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create project year');
        }

        // Show success message
        showNotification('Project year created successfully', 'success');
        
        // Clear form
        projectYearForm.reset();

        // Update project years list if it exists
        await loadProjectYears();

      } catch (error) {
        console.error('Error creating project year:', error);
        showNotification(error.message, 'error');
      } finally {
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }

  // Function to load department info
  async function loadDepartmentInfo() {
    if (!departmentInfo) return;

    try {
      const response = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/departments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load department information');
      }

      if (!data.department) {
        throw new Error('No department found');
      }

      // Store department ID in the element's dataset
      departmentInfo.dataset.departmentId = data.department._id;
      
      // Update department info display
      departmentInfo.innerHTML = `
        <i class="fas fa-university"></i>
        <span>${data.department.name}</span>
      `;

    } catch (error) {
      console.error('Error loading department info:', error);
      departmentInfo.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span class="error">Error loading department information</span>
      `;
    }
  }

  // Function to validate academic year format
  function validateAcademicYear(value) {
    const yearPattern = /^\d{4}\/\d{4}$/;
    const group = academicYearInput.closest('.form-group');
    const validationMessage = group.querySelector('.validation-message');

    if (!yearPattern.test(value)) {
      group.classList.add('error');
      group.classList.remove('success');
      if (validationMessage) {
        validationMessage.innerHTML = 'Please enter in format: YYYY/YYYY (e.g., 2024/2025)';
      }
      return false;
    }

    const [startYear, endYear] = value.split('/').map(Number);
    if (endYear !== startYear + 1) {
      group.classList.add('error');
      group.classList.remove('success');
      if (validationMessage) {
        validationMessage.innerHTML = 'End year must be one year after start year';
      }
      return false;
    }

    group.classList.remove('error');
    group.classList.add('success');
    if (validationMessage) {
      validationMessage.innerHTML = 'Valid academic year format';
    }
    return true;
  }

  // Function to load project years (optional - implement if needed)
  async function loadProjectYears() {
    const projectYearsList = document.getElementById('project-years-list');
    if (!projectYearsList) return;

    try {
      const response = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/projects/years');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load project years');
      }

      if (!data.projectYears || data.projectYears.length === 0) {
        projectYearsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar"></i>
            <p>No project years found</p>
          </div>
        `;
        return;
      }

      projectYearsList.innerHTML = `
        <div class="project-years-grid">
          ${data.projectYears.map(year => `
            <div class="project-year-card">
              <div class="year-info">
                <h4>${year.academic_year}</h4>
                <span class="department">${year.department_id.name}</span>
              </div>
              <div class="year-stats">
                <div class="stat">
                  <i class="fas fa-users"></i>
                  <span>${year.total_groups || 0} Groups</span>
                </div>
                <div class="stat">
                  <i class="fas fa-user-graduate"></i>
                  <span>${year.total_students || 0} Students</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    } catch (error) {
      console.error('Error loading project years:', error);
      projectYearsList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load project years</p>
          <button onclick="loadProjectYears()" class="retry-btn">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }

  // Create assignment details overlay
  const overlay = document.createElement('div');
  overlay.id = 'assignment-details-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <button class="close-overlay"><i class="fas fa-times"></i></button>
      <div id="assignment-details"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close overlay on click outside or close button
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.closest('.close-overlay')) {
      overlay.classList.remove('active');
    }
  });

  // ====================
  // Assignment Management
  // ====================
  
  // Function to fetch and display assignments
  async function fetchAndDisplayAssignments() {
    try {
      // Create filter container if it doesn't exist
      let filterContainer = document.querySelector('.assignments-filters');
      if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.className = 'assignments-filters';
        filterContainer.innerHTML = `
          <form id="search-assignments-form" class="search-filter-container">
            <div class="form-group">
              <select id="course-filter">
                <option value="">All Courses</option>
              </select>
            </div>
            <div class="form-group">
              <select id="assignment-sort">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </form>
        `;
        const assignmentsList = document.getElementById('assignments-list');
        assignmentsList.parentNode.insertBefore(filterContainer, assignmentsList);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assignments');
      }

      const data = await response.json();
      console.log('Assignments data:', data); // Debug log
      
      // Store pagination info
      const totalAssignments = data.total || 0;
      const currentPage = data.currentPage || 1;
      const totalPages = data.totalPages || 1;
      const perPage = data.perPage || 10;
      
      allAssignments = data.assignments || [];
      filteredAssignments = [...allAssignments];

      // Populate course filter
      const courseFilter = document.getElementById('course-filter');
      const courses = [...new Set(allAssignments.map(a => a.course_id.code))];
      courseFilter.innerHTML = '<option value="">All Courses</option>' + 
        courses.map(code => `<option value="${code}">${code}</option>`).join('');

      // Set up filter event listeners
      document.getElementById('course-filter').addEventListener('change', () => filterAssignments(1));
      document.getElementById('assignment-sort').addEventListener('change', () => sortAssignments(1));

      const assignmentsList = document.getElementById('assignments-list');
      if (assignmentsList) {
        if (!filteredAssignments.length) {
          assignmentsList.innerHTML = '<div class="no-assignments">No assignments found</div>';
          return;
        }

        renderAssignments(filteredAssignments, 1);

        // Make viewAssignmentDetails function globally available
        window.viewAssignmentDetails = async function(assignmentId) {
          try {
            // Validate assignment ID
            if (!assignmentId) {
              throw new Error('Assignment ID is missing');
            }

            const token = localStorage.getItem('authToken');
            if (!token) {
              throw new Error('No authentication token found');
            }

            console.log('Fetching assignment details for ID:', assignmentId); // Debug log

            const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments/${assignmentId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            // First try to get the error response as JSON
            let errorData;
            try {
              const data = await response.json();
              if (!response.ok) {
                errorData = data;
                throw new Error(data.message || 'Failed to fetch assignment details');
              }
              
              if (!data.assignment) {
                throw new Error('Assignment not found');
              }

              showAssignmentDetails(data.assignment);
            } catch (jsonError) {
              // If JSON parsing fails or there's no error message, throw a more specific error
              throw new Error(errorData?.message || 'Server error: Unable to fetch assignment details');
            }
          } catch (error) {
            console.error('Error fetching assignment details:', error);
            showNotification(error.message, 'error');
          }
        };

        // Add click event listeners to assignment cards
        document.querySelectorAll('.assignment-card').forEach(card => {
          card.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.dataset.assignmentId;
            if (assignmentId) {
              viewAssignmentDetails(assignmentId);
            } else {
              console.error('No assignment ID found on card');
              showNotification('Error: Unable to view assignment details', 'error');
            }
          });
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showNotification(error.message || 'Failed to fetch assignments', 'error');
    }
  }

  // Add event listener for assignments tab
  const assignmentsLink = document.querySelector('a[href="#upload-assignments"]');
  if (assignmentsLink) {
    assignmentsLink.addEventListener('click', fetchAndDisplayAssignments);
  }

  // Initial load of assignments if we're on the assignments page
  if (window.location.hash === '#upload-assignments') {
    fetchAndDisplayAssignments();
  }
  
  // Add real-time validation for assignment title
  const titleInput = document.getElementById('title');
  if (titleInput) {
    titleInput.addEventListener('input', function(e) {
      const title = e.target.value;
      const submitBtn = document.querySelector('#create-assignment-form button[type="submit"]');
      
      // Reset validation styling
      e.target.classList.remove('is-invalid', 'is-valid');
      const feedbackDiv = e.target.nextElementSibling;
      if (feedbackDiv && feedbackDiv.classList.contains('validation-feedback')) {
        feedbackDiv.remove();
      }

      // Validate
      if (title.trim().length === 0) {
        e.target.classList.add('is-invalid');
        addValidationFeedback(e.target, 'Assignment title is required', 'error');
        if (submitBtn) submitBtn.disabled = true;
      } else if (title.length > 100) {
        e.target.classList.add('is-invalid');
        addValidationFeedback(e.target, 'Title is too long (maximum 100 characters)', 'error');
        if (submitBtn) submitBtn.disabled = true;
      } else {
        e.target.classList.add('is-valid');
        addValidationFeedback(e.target, 'Title looks good!', 'success');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function addValidationFeedback(inputElement, message, type) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `validation-feedback ${type}`;
    feedbackDiv.textContent = message;
    inputElement.parentNode.insertBefore(feedbackDiv, inputElement.nextSibling);
  }
  
  // Create Assignment Form Submit Handler
  const createAssignmentForm = document.getElementById('create-assignment-form');
  if (createAssignmentForm) {
    createAssignmentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = createAssignmentForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

      try {
        const formData = new FormData(e.target);
        const courseId = formData.get('course');
        const title = formData.get('title');
        const description = formData.get('description');
        const dueDateInput = formData.get('due_date'); // Format: "2025-08-15T23:59"

        // Validate course selection
        if (!courseId) {
          throw new Error('Please select a course');
        }

        // Validate title
        if (!title || title.trim().length === 0) {
          throw new Error('Please enter an assignment title');
        }
        if (title.length > 100) {
          throw new Error('Assignment title is too long (maximum 100 characters)');
        }

        // Validate description
        if (!description || description.trim().length === 0) {
          throw new Error('Please enter an assignment description');
        }

        // Validate due date
        if (!dueDateInput) {
          throw new Error('Please select a due date');
        }

        // Convert the date to the required format (ISO string with milliseconds)
        const dueDateObj = new Date(dueDateInput);
        if (isNaN(dueDateObj.getTime())) {
          throw new Error('Invalid date format');
        }
        const dueDate = dueDateObj.toISOString(); // Format: "2025-08-15T23:59:00.000Z"

        // Prepare and validate the request data
        const assignmentData = {
          course_id: courseId,
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate
        };

        // Log exact data being sent for debugging
        console.log('Sending data:', JSON.stringify(assignmentData, null, 2));

        // Create the assignment
        const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assignmentData)
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Server response:', responseData);
          
          // Check if we have validation errors
          if (responseData.errors && responseData.errors.length > 0) {
            const errorMessages = responseData.errors.map(err => err.msg || err.message).join('\n');
            throw new Error(errorMessages);
          }
          
          throw new Error(responseData.message || 'Failed to create assignment');
        }

        // Show success message
        showNotification(responseData.message || 'Assignment created successfully', 'success');
        
        // Reset form
        createAssignmentForm.reset();
        
        // Refresh the assignments list if it exists
        if (window.fetchAssignments) {
          fetchAssignments();
        }      } catch (error) {
        console.error('Error creating assignment:', error);
        showNotification(error.message || 'Failed to create assignment', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
    
    // Assignment display state
    let allAssignments = [];
    let currentPage = 1;
    const itemsPerPage = 6;
    let filteredAssignments = [];

    // Function to filter assignments
    function filterAssignments() {
      const courseFilter = document.getElementById('course-filter').value;
      
      filteredAssignments = allAssignments.filter(assignment => {
        const matchesCourse = !courseFilter || assignment.course_id.code === courseFilter;
        return matchesCourse;
      });
      
      currentPage = 1;
      sortAssignments();
    }

    // Function to sort assignments
    function sortAssignments() {
      const sortValue = document.getElementById('assignment-sort').value;
      const [field, order] = sortValue.split('-');
      
      filteredAssignments.sort((a, b) => {
        if (field === 'date') {
          return order === 'desc' 
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt);
        } else {
          return order === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title);
        }
      });
      
      renderAssignments(filteredAssignments, currentPage);
    }
    
    // Function to render assignments with pagination
    async function renderAssignments(page = 1, filters = {}) {
      const assignmentsList = document.getElementById('assignments-list');
      if (!assignmentsList) return;
      
      try {

        // Build query parameters
        const queryParams = new URLSearchParams({
          page: page,
          ...filters
        });

        const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }

        const data = await response.json();
        const assignments = data.assignments || [];
        
        assignmentsList.innerHTML = assignments.length ? assignments.map(assignment => `
          <div class="assignment-card ${getAssignmentStatus(assignment)}" data-assignment-id="${assignment._id}">
            <div class="assignment-header">
              <div class="header-content">
                <h4>${assignment.title}</h4>
                <div class="course-code">${assignment.course_id.code}</div>
              </div>
              <span class="status-badge ${getAssignmentStatus(assignment)}">
                ${getAssignmentStatus(assignment)}
              </span>
            </div>
            <div class="assignment-content">
              <p class="description">${assignment.description}</p>
              <div class="assignment-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>Due: ${formatDate(new Date(assignment.due_date))}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>Created: ${new Date(assignment.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-user"></i>
                  <span>${assignment.created_by.name}</span>
                </div>
              </div>
            </div>
            <div class="assignment-actions">
              <button class="action-btn view-btn" onclick="viewAssignmentDetails('${assignment._id}'); event.stopPropagation();">
                <i class="fas fa-eye"></i> View Details
              </button>
              <button class="action-btn submissions-btn" onclick="loadSubmissions('${assignment._id}'); event.stopPropagation();">
                <i class="fas fa-inbox"></i> View Submissions
              </button>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><i class="fas fa-tasks"></i><p>No assignments found</p></div>';
        
        // Render pagination controls
        renderPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.total
        });

      } catch (error) {
        console.error('Error fetching assignments:', error);
        assignmentsList.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load assignments</p>
            <button onclick="renderAssignments(1)" class="retry-btn">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        `;
      }
    }
    
    // Function to render pagination controls
    function renderPagination(data) {
      let paginationContainer = document.querySelector('.pagination-container');
      
      if (!paginationContainer) {
        // Create pagination container if it doesn't exist
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        const assignmentsList = document.getElementById('assignments-list');
        if (assignmentsList) {
          assignmentsList.parentNode.insertBefore(paginationContainer, assignmentsList.nextSibling);
        }
      }
      
      const { currentPage, totalPages, total } = data;
      
      // Only show pagination if there are assignments
      if (total === 0) {
        paginationContainer.style.display = 'none';
        return;
      }
      
      paginationContainer.style.display = 'flex';
      paginationContainer.innerHTML = `
        <div class="pagination-stats">
          <div class="total-assignments">
            <i class="fas fa-tasks"></i>
            <span>Total Assignments: ${total}</span>
          </div>
        </div>
        ${totalPages > 1 ? `
          <div class="pagination-controls">
            ${currentPage > 1 ? `
              <button class="pagination-btn" onclick="renderAssignments(1)" title="First Page">
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button class="pagination-btn" onclick="renderAssignments(${currentPage - 1})" title="Previous Page">
                <i class="fas fa-angle-left"></i>
              </button>
            ` : ''}
            <span class="current-page">Page ${currentPage} of ${totalPages}</span>
            ${currentPage < totalPages ? `
              <button class="pagination-btn" onclick="renderAssignments(${currentPage + 1})" title="Next Page">
                <i class="fas fa-angle-right"></i>
              </button>
              <button class="pagination-btn" onclick="renderAssignments(${totalPages})" title="Last Page">
                <i class="fas fa-angle-double-right"></i>
              </button>
            ` : ''}
          </div>
        ` : ''}
      `;
    }
    
    // Function to get assignment status
    function getAssignmentStatus(assignment) {
      const now = new Date();
      const dueDate = new Date(assignment.due_date);
      
      if (now > dueDate) return 'overdue';
      if (now.getTime() - dueDate.getTime() <= 24 * 60 * 60 * 1000) return 'due-soon';
      return 'active';
    }
    
    // Function to format date
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Main fetch assignments function
    window.fetchAssignments = async function() {
      try {
        const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        const data = await response.json();
        
        allAssignments = data.assignments || [];
        filteredAssignments = [...allAssignments];
        renderAssignments(filteredAssignments, currentPage);
        
        // Setup search and filter if not already set up
        setupSearchAndFilter();
        
      } catch (error) {
        console.error('Error fetching assignments:', error);
        showNotification(error.message || 'Failed to fetch assignments', 'error');
      }
    };
    
    // Setup search and filter functionality
    function setupSearchAndFilter() {
      const searchForm = document.getElementById('search-assignments-form');
      if (!searchForm) {
        // Create search and filter controls if they don't exist
        const container = document.createElement('div');
        container.className = 'assignments-filters';
        container.innerHTML = `
          <form id="search-assignments-form" class="search-filter-container">
            <div class="form-group">
              <input type="text" id="assignment-search" placeholder="Search assignments...">
            </div>
            <div class="form-group">
              <select id="assignment-status">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div class="form-group">
              <select id="assignment-sort">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </form>
        `;
        
        const assignmentsList = document.getElementById('assignments-list');
        assignmentsList.parentNode.insertBefore(container, assignmentsList);
        
        // Add event listeners
        container.querySelector('#assignment-search').addEventListener('input', filterAssignments);
        container.querySelector('#assignment-status').addEventListener('change', filterAssignments);
        container.querySelector('#assignment-sort').addEventListener('change', sortAssignments);
      }
    }
    
    // Filter assignments
    function filterAssignments(page = 1) {
      const courseFilter = document.getElementById('course-filter')?.value || '';
      const searchTerm = document.getElementById('assignment-search')?.value || '';
      const statusFilter = document.getElementById('assignment-status')?.value || 'all';
      
      const filters = {
        course: courseFilter,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        sort: document.getElementById('assignment-sort')?.value || 'date-desc'
      };

      // Reset to first page when filters change
      renderAssignments(page, filters);
    }
    
    // Sort assignments
    function sortAssignments(page = 1) {
      const sortValue = document.getElementById('assignment-sort').value;
      const filters = {
        course: document.getElementById('course-filter')?.value || '',
        search: document.getElementById('assignment-search')?.value || '',
        status: document.getElementById('assignment-status')?.value || 'all',
        sort: sortValue
      };
      
      renderAssignments(page, filters);
    }
  }

  // ====================
  // Navigation Logic
  // ====================
  const sidebarLinks = document.querySelectorAll('nav ul li a');
  const sections = document.querySelectorAll('main section');
  const hamburger = document.querySelector('#hamburger-menu') || document.createElement('div');
  
  if (!document.querySelector('#hamburger-menu')) {
    hamburger.className = 'hamburger-menu';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    document.querySelector('nav').prepend(hamburger);
  }

  hamburger.addEventListener('click', () => {
    document.querySelector('nav ul').classList.toggle('active');
  });

  function showSection(sectionId) {
    sections.forEach(section => {
      section.style.display = section.id === sectionId ? 'block' : 'none';
    });
    document.querySelector('nav ul').classList.remove('active');
  }

  showSection('documents');

  // Function to fetch assigned courses
  async function fetchAssignedCourses() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assigned courses');
      }

      const data = await response.json();
      return data.data.courses;
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      showNotification(error.message, 'error');
      return [];
    }
  }

  // Function to populate course select options
  function populateCourseOptions(courses) {
    const courseSelect = document.getElementById('assignment-course');
    if (!courseSelect) return;

    courseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
      courseSelect.innerHTML += `
        <option value="${course._id}">${course.title} (${course.code})</option>
      `;
    });
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', async function(e) {
      if (!this.id.includes('logout-btn')) {
        e.preventDefault();
        sidebarLinks.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        const sectionId = this.getAttribute('href').substring(1);
        showSection(sectionId);

        // Refresh courses when switching to sections that need them
        if (['upload-assignments', 'notifications'].includes(sectionId)) {
          populateAllCourseSelects();
        }
      }
    });
  });

  // ====================
  // Logout Functionality
  // ====================
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        // Call logout endpoint if available
        await makeAuthenticatedRequest('YOUR_API_ENDPOINT/logout', {
          method: 'POST'
        });
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        // Clear all authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedEmail');
        window.location.href = './login.html';
      }
    });
  }

  // ====================
  // Document Management
  // ====================
  let folders = [];
  let currentFolderIndex = null;

  // Download file function
  async function downloadFile(fileId, fileName) {
    try {
      // Validate file ID
      if (!fileId || fileId === 'undefined' || fileId.trim() === '') {
        throw new Error('File ID is missing or invalid');
      }

      // Get the auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Construct the download URL with the file ID
      const downloadUrl = `https://department-mangement-system-97wj.onrender.com/api/files/download/${fileId}`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName; // Set the file name
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      showNotification('File download started', 'info');
    } catch (error) {
      console.error('Error downloading file:', error);
      showNotification(error.message, 'error');
    }
  }

  // DOM Elements
  const createFolderBtn = document.getElementById('create-folder-btn');
  const createFolderModal = document.getElementById('create-folder-modal');
  const createFolderForm = document.getElementById('create-folder-form');
  const folderContentModal = document.getElementById('folder-content-modal');
  const folderContentTitle = document.getElementById('folder-content-title');
  const folderFilesList = document.getElementById('files-list');
  const createFileForm = document.getElementById('create-file-form');
  const fileInput = document.getElementById('file-upload');

  

  // Function to populate all course selects in the application
  async function populateAllCourseSelects() {
    try {
      const courses = await fetchAssignedCourses();
      const courseSelects = document.querySelectorAll('select[id$="-course"]'); // Gets all selects ending with "-course"
      
      courseSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => {
          select.innerHTML += `
            <option value="${course._id}">${course.title} (${course.code})</option>
          `;
        });
      });
    } catch (error) {
      console.error('Error populating course selects:', error);
      showNotification('Failed to load courses. Please refresh the page.', 'error');
    }
  }

  // Initialize
  populateAllCourseSelects();

  // Event Listeners
  createFolderBtn?.addEventListener('click', () => {
    createFolderModal.classList.add('show');
    document.getElementById('folder-name').focus();
  });

  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').classList.remove('show');
    });
  });

  // Create New Folder
  createFolderForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const folderName = document.getElementById('folder-name').value.trim();
    if (!folderName) return;

    try {
      const submitBtn = createFolderForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

      const response = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/folders', {
        method: 'POST',
        body: JSON.stringify({ name: folderName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create folder');
      }

      // Show success message
      const statusDiv = document.createElement('div');
      statusDiv.className = 'status-message status-success';
      statusDiv.textContent = data.message;
      createFolderForm.appendChild(statusDiv);

          // Add new folder to the list
      const newFolder = {
        id: data.folder._id,
        name: data.folder.name,
        owner: data.folder.owner_id,
        files: []
      };
      folders.push(newFolder);
      
      // Update UI
      updateFoldersList();
      createFolderModal.classList.remove('show');
      createFolderForm.reset();

      // Remove success message after 3 seconds
      setTimeout(() => {
        statusDiv.remove();
      }, 3000);

    } catch (error) {
      console.error('Error creating folder:', error);
      const statusDiv = document.createElement('div');
      statusDiv.className = 'status-message status-error';
      statusDiv.textContent = error.message;
      createFolderForm.appendChild(statusDiv);

      setTimeout(() => {
        statusDiv.remove();
      }, 3000);
    } finally {
      const submitBtn = createFolderForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Folder';
    }
  });

  // Update Folders List
  function updateFoldersList() {
    if (foldersList) {
      foldersList.innerHTML = '';
      
      if (folders.length === 0) {
        foldersList.innerHTML = '<div class="empty-state">No folders found. Create a new folder to get started.</div>';
        return;
      }

      folders.forEach((folder, index) => {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.dataset.id = folder.id;

        folderItem.innerHTML = `
          <div class="folder-content">
            <i class="fas fa-folder fa-2x"></i>
            <div class="folder-info">
              <span class="item-name">${folder.name}</span>
            </div>
            <div class="document-actions">
              <button class="action-btn open-btn" data-id="${folder.id}" title="Open Folder">
                <i class="fas fa-folder-open"></i> Open
              </button>
            </div>
          </div>
        `;
        // Only open on open-btn click
        folderItem.querySelector('.open-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openFolder(folder.id);
        });
        foldersList.appendChild(folderItem);
      });
      localStorage.setItem('lecturerFolders', JSON.stringify(folders));
    }
  }

  // Open Folder
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

      folderContentArea.innerHTML = '';

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
      console.log('Folder contents:', data); // Debug log

      // Update folder content area with documents
      folderContentArea.innerHTML = `
        <div class="folder-view">
          <div class="folder-header">
            <div class="folder-info">
              <h3><i class="fas fa-folder-open"></i> ${data.folder.name}</h3>
              <span class="folder-meta">
                ${data.total} file${data.total !== 1 ? 's' : ''} • 
                <span class="folder-status ${data.folder.status.toLowerCase()}">${data.folder.status}</span>
              </span>
            </div>
            <div class="folder-actions">
              <!-- Upload functionality removed -->
            </div>
          </div>

          ${data.documents.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-folder-open"></i>
              <p>No documents in this folder</p>
              <!-- Upload functionality removed -->
            </div>
          ` : `
            <div class="documents-grid">
              ${data.documents.map(doc => `
                <div class="document-card" data-id="${doc._id}">
                  <div class="document-info">
                    <div class="document-icon">
                      <i class="fas ${getFileIconByExtension(doc.document_id.fileInfo.originalName)}"></i>
                    </div>
                    <div class="document-details">
                      <h4 class="document-title" title="${doc.document_id.title}">
                        ${doc.document_id.title}
                      </h4>
                      <div class="document-meta">
                        <span class="file-name" title="${doc.document_id.fileInfo.originalName}">
                          ${doc.document_id.fileInfo.originalName}
                        </span>
                        <span class="file-size">
                          ${formatFileSize(doc.document_id.fileInfo.size)}
                        </span>
                      </div>
                      <div class="upload-info">
                        <span class="upload-date">
                          Uploaded ${new Date(doc.document_id.fileInfo.uploadDate).toLocaleDateString()}
                        </span>
                        <span class="visibility-badge ${doc.document_id.visibility}">
                          <i class="fas ${doc.document_id.visibility === 'private' ? 'fa-lock' : 'fa-globe'}"></i>
                          ${doc.document_id.visibility}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="document-actions">
                    <button class="action-btn" onclick="downloadDocument('${doc.document_id.file_url}', '${doc.document_id.fileInfo.originalName}')" title="Download">
                      <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn share-btn" onclick="shareDocument('${doc._id}')" title="Share">
                      <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteDocument('${doc._id}')" title="Delete">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
            ${data.totalPages > 1 ? `
              <div class="pagination">
                <button ${data.currentPage <= 1 ? 'disabled' : ''} 
                        onclick="loadFolderPage('${folderId}', ${data.currentPage - 1})">
                  <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span>Page ${data.currentPage} of ${data.totalPages}</span>
                <button ${data.currentPage >= data.totalPages ? 'disabled' : ''} 
                        onclick="loadFolderPage('${folderId}', ${data.currentPage + 1})">
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

function displayFolderContents(data) {
  const folderContentArea = document.getElementById('folder-contents') || createFolderContentArea();
  
  // Create the folder content structure
  folderContentArea.innerHTML = `
    <div class="folder-view">
      <div class="folder-header">
        <div class="folder-info">
          <h2><i class="fas fa-folder-open"></i> ${data.folder.name}</h2>
          <span class="folder-meta">
            <span class="file-count">${data.total} file${data.total !== 1 ? 's' : ''}</span>
            <span class="separator">•</span>
            <span class="folder-status ${data.folder.status.toLowerCase()}">${data.folder.status}</span>
            <span class="separator">•</span>
            <span class="created-date">Created ${new Date(data.folder.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </span>
        </div>
        <div class="folder-actions">
          <!-- Upload functionality removed -->
        </div>
      </div>

      <!-- Upload functionality removed -->

      ${data.documents.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>This folder is empty</h3>
          <p>Documents can only be added by administrators</p>
        </div>
      ` : `
        <div class="documents-grid">
          ${data.documents.map(doc => `
            <div class="document-card" data-id="${doc._id}">
              <div class="document-icon">
                <i class="fas ${getFileIcon(doc.document_id.fileInfo.originalName)}"></i>
              </div>
              <div class="document-info">
                <h4 class="document-title" title="${doc.document_id.title}">${doc.document_id.title}</h4>
                <div class="document-meta">
                  <span class="original-name" title="${doc.document_id.fileInfo.originalName}">
                    ${doc.document_id.fileInfo.originalName}
                  </span>
                  <div class="meta-details">
                    <span class="file-size">${formatFileSize(doc.document_id.fileInfo.size)}</span>
                    <span class="separator">•</span>
                    <span class="upload-date">${new Date(doc.document_id.fileInfo.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="visibility-badge ${doc.document_id.visibility}">
                  <i class="fas ${doc.document_id.visibility === 'private' ? 'fa-lock' : 'fa-globe'}"></i>
                  ${doc.document_id.visibility}
                </div>
              </div>
              <div class="document-actions">
                <button class="action-btn" onclick="downloadDocument('${doc.document_id.file_url}', '${doc.document_id.fileInfo.originalName}')" title="Download">
                  <i class="fas fa-download"></i>
                </button>
                <button class="action-btn share-btn" onclick="shareDocument('${doc._id}')" title="Share">
                  <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteDocument('${doc._id}')" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        ${data.totalPages > 1 ? `
          <div class="pagination">
            <button ${data.currentPage <= 1 ? 'disabled' : ''} onclick="changePage(${data.currentPage - 1})">
              <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span>Page ${data.currentPage} of ${data.totalPages}</span>
            <button ${data.currentPage >= data.totalPages ? 'disabled' : ''} onclick="changePage(${data.currentPage + 1})">
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        ` : ''}
      `}
    </div>
  `;

  // Upload functionality removed - event listeners disabled

  // Make folder content area visible
  folderContentArea.style.display = 'block';
}

// Upload functionality removed

// Helper function to get appropriate file icon
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: 'fa-file-pdf',
    doc: 'fa-file-word',
    docx: 'fa-file-word',
    xls: 'fa-file-excel',
    xlsx: 'fa-file-excel',
    ppt: 'fa-file-powerpoint',
    pptx: 'fa-file-powerpoint',
    jpg: 'fa-file-image',
    jpeg: 'fa-file-image',
    png: 'fa-file-image',
    gif: 'fa-file-image',
    txt: 'fa-file-alt',
    zip: 'fa-file-archive',
    rar: 'fa-file-archive'
  };
  return icons[ext] || 'fa-file';
}

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

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIconByName(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'ppt': 'fa-file-powerpoint',
      'pptx': 'fa-file-powerpoint',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'zip': 'fa-file-archive',
      'rar': 'fa-file-archive',
      '7z': 'fa-file-archive',
      'txt': 'fa-file-alt',
      'rtf': 'fa-file-alt',
      'mp4': 'fa-file-video',
      'avi': 'fa-file-video',
      'mp3': 'fa-file-audio',
      'wav': 'fa-file-audio'
    };
    return iconMap[extension] || 'fa-file';
  }

  // Update Files List
  async function updateFilesList() {
    if (filesList) {
      filesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading documents...</div>';
      const folder = folders[currentFolderIndex];
      
      try {
        // Fetch the latest files from the server for this folder
        const response = await makeAuthenticatedRequest(
          `https://department-mangement-system-97wj.onrender.com/api/lecturer/documents/folders/${folder.id}/documents`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        const documents = data.documents || [];

        filesList.innerHTML = '';

        if (documents.length === 0) {
          filesList.innerHTML = '<p class="empty-message">No files in this folder yet.</p>';
          return;
        }

        documents.forEach(doc => {
          const fileItem = document.createElement('div');
          fileItem.className = 'file-item';
          fileItem.dataset.id = doc._id;
          fileItem.innerHTML = `
            <div class="file-info">
              ${getFileIcon(doc.title)}
              <span class="item-name">${doc.title}</span>
              <span class="file-date">Added: ${new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="document-actions">
              <button class="action-btn delete-btn" data-id="${doc._id}" data-type="file" title="Delete Document">
                <i class="fas fa-trash"></i>
              </button>
              <button class="action-btn share-btn" data-id="${doc._id}" data-type="file" title="Share Document">
                <i class="fas fa-share"></i>
              </button>
              <button class="action-btn download-btn" data-id="${doc._id}" data-name="${doc.title}" title="Download Document">
                <i class="fas fa-download"></i>
              </button>
            </div>
          `;
          filesList.appendChild(fileItem);
        });
      } catch (error) {
        console.error('Error fetching documents:', error);
        filesList.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            Failed to load documents. Please try again.
          </div>
        `;
      }
    }
  }

  // Get File Icon
  function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: 'fa-file-pdf',
      doc: 'fa-file-word',
      docx: 'fa-file-word',
      ppt: 'fa-file-powerpoint',
      pptx: 'fa-file-powerpoint',
      jpg: 'fa-file-image',
      jpeg: 'fa-file-image',
      png: 'fa-file-image',
      txt: 'fa-file-alt',
      zip: 'fa-file-archive'
    };
    const iconClass = iconMap[extension] || 'fa-file';
    return `<i class="fas ${iconClass}"></i>`;
  }

  // Create New File functionality removed

  // Document Actions functionality moved to main DOMContentLoaded block

  // Event listeners moved to main DOMContentLoaded block

  // ====================
  // Notification System
  // ====================

  // Elements
  const notificationForm = document.getElementById('send-notification-form');
  const notificationTypeSelect = document.getElementById('notification-type');
  const notificationCourseSelect = document.getElementById('notification-course');
  const studentsSelection = document.getElementById('students-selection');
  const notificationStudentsSelect = document.getElementById('notification-students');
  const notificationTitleInput = document.getElementById('notification-title');
  const notificationMessageInput = document.getElementById('notification-message');
  const notificationStatus = document.getElementById('notification-status');

  // Fetch courses for notification dropdown
  async function fetchCoursesForNotifications() {
    try {
      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      
      console.log('Courses API response:', data); // Debug log to see structure
      
      if (notificationCourseSelect) {
        notificationCourseSelect.innerHTML = '<option value="" disabled selected>Select course</option>';
        
        // Handle the correct response structure: data.data.courses
        let courses = data.data?.courses || data.courses || data.data || data;
        
        if (Array.isArray(courses) && courses.length > 0) {
          courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = `${course.title} (${course.code})`;
            notificationCourseSelect.appendChild(option);
          });
          notificationCourseSelect.disabled = false;
        } else {
          notificationCourseSelect.innerHTML = '<option value="" disabled selected>No courses found</option>';
          notificationCourseSelect.disabled = true;
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      if (notificationCourseSelect) {
        notificationCourseSelect.innerHTML = '<option value="" disabled selected>Could not load courses</option>';
        notificationCourseSelect.disabled = true;
      }
    }
  }

  // Fetch students for selected course
  async function fetchStudentsForCourse(courseId) {
    try {
      const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/courses/${courseId}/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      
      if (notificationStudentsSelect) {
        notificationStudentsSelect.innerHTML = '<option value="" disabled>Select students</option>';
        
        let students = data.data?.students || data.students || data.data || data;
        
        if (Array.isArray(students) && students.length > 0) {
          students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = `${student.name} (${student.email})`;
            notificationStudentsSelect.appendChild(option);
          });
          notificationStudentsSelect.disabled = false;
        } else {
          notificationStudentsSelect.innerHTML = '<option value="" disabled>No students found</option>';
          notificationStudentsSelect.disabled = true;
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      if (notificationStudentsSelect) {
        notificationStudentsSelect.innerHTML = '<option value="" disabled>Could not load students</option>';
        notificationStudentsSelect.disabled = true;
      }
    }
  }

  // Handle notification type change
  if (notificationTypeSelect) {
    notificationTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      if (studentsSelection) {
        if (selectedType === 'individual') {
          studentsSelection.classList.remove('students-selection-hidden');
          notificationStudentsSelect.required = true;
        } else {
          studentsSelection.classList.add('students-selection-hidden');
          notificationStudentsSelect.required = false;
        }
      }
    });
  }

  // Handle course selection change
  if (notificationCourseSelect) {
    notificationCourseSelect.addEventListener('change', function() {
      const selectedCourse = this.value;
      const notificationType = notificationTypeSelect?.value;
      
      if (selectedCourse && notificationType === 'individual') {
        fetchStudentsForCourse(selectedCourse);
      }
    });
  }

  // Initialize course loading
  fetchCoursesForNotifications();

  // Handle notification form submit
  if (notificationForm) {
    notificationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (notificationStatus) {
        notificationStatus.className = '';
        notificationStatus.textContent = '';
      }

      const notificationType = notificationTypeSelect?.value;
      const title = notificationTitleInput?.value.trim();
      const message = notificationMessageInput?.value.trim();
      const course_id = notificationCourseSelect?.value;

      if (!notificationType || !title || !message || !course_id) {
        if (notificationStatus) {
          notificationStatus.textContent = 'Please fill in all required fields.';
          notificationStatus.className = 'error';
        }
        return;
      }

      // Additional validation for individual notifications
      if (notificationType === 'individual') {
        const selectedStudents = Array.from(notificationStudentsSelect.selectedOptions).map(option => option.value);
        if (selectedStudents.length === 0) {
          if (notificationStatus) {
            notificationStatus.textContent = 'Please select at least one student.';
            notificationStatus.className = 'error';
          }
          return;
        }
      }

      try {
        // Show loading state
        if (notificationStatus) {
          notificationStatus.textContent = 'Sending notification...';
          notificationStatus.className = '';
        }

        let endpoint, requestBody;

        if (notificationType === 'course') {
          // Send to all students in course
          endpoint = 'https://department-mangement-system-97wj.onrender.com/api/lecturer/notifications/course';
          requestBody = { title, message, course_id };
        } else {
          // Send to individual students
          endpoint = 'https://department-mangement-system-97wj.onrender.com/api/lecturer/notifications';
          const selectedStudents = Array.from(notificationStudentsSelect.selectedOptions).map(option => option.value);
          
          requestBody = { 
            title, 
            message, 
            course_id,
            receiver_ids: selectedStudents
          };
          
          // Also include receiver_id for single student selection (backend compatibility)
          if (selectedStudents.length === 1) {
            requestBody.receiver_id = selectedStudents[0];
          }
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send notification');
        }

        // Success
        if (notificationStatus) {
          notificationStatus.textContent = 'Notification sent successfully!';
          notificationStatus.className = 'success';
        }
        
        showNotification('Notification sent successfully!', 'success');
        notificationForm.reset();
        
        // Reset the form state
        if (studentsSelection) {
          studentsSelection.classList.add('students-selection-hidden');
        }
        if (notificationStudentsSelect) {
          notificationStudentsSelect.required = false;
        }
        
      } catch (error) {
        console.error('Error sending notification:', error);
        if (notificationStatus) {
          notificationStatus.textContent = 'Error: ' + error.message;
          notificationStatus.className = 'error';
        }
        showNotification('Failed to send notification: ' + error.message, 'error');
      }
    });
  }

  // Received Notifications Functionality
  const notificationsLoading = document.getElementById('notifications-loading');
  const notificationsContainer = document.getElementById('notifications-container');
  const receivedNotificationsList = document.getElementById('received-notifications-list');
  const noNotifications = document.getElementById('no-notifications');
  const unreadCountBadge = document.getElementById('unread-count');
  const filterNotifications = document.getElementById('filter-notifications');
  const markAllReadBtn = document.getElementById('mark-all-read-btn');
  const refreshNotificationsBtn = document.getElementById('refresh-notifications-btn');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const pageInfo = document.getElementById('page-info');

  let currentPage = 1;
  let totalPages = 1;
  let currentFilter = 'all';

  // Function to fetch received notifications
  async function fetchReceivedNotifications(page = 1, filter = 'all') {
    try {
      // Show loading state
      notificationsLoading.style.display = 'block';
      notificationsContainer.style.display = 'none';
      noNotifications.classList.add('profile-hidden');

      // Build query parameters
      let queryParams = `page=${page}&limit=10`;
      if (filter === 'unread') {
        queryParams += '&read=false';
      } else if (filter === 'read') {
        queryParams += '&read=true';
      }

      const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/notifications?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      console.log('Notifications data:', data);

      // Hide loading
      notificationsLoading.style.display = 'none';

      // Update pagination info
      currentPage = data.currentPage || page;
      totalPages = data.totalPages || 1;
      
      // Update unread count
      if (unreadCountBadge) {
        unreadCountBadge.textContent = data.unreadCount || 0;
        unreadCountBadge.style.display = data.unreadCount > 0 ? 'inline' : 'none';
      }

      // Display notifications
      if (data.notifications && data.notifications.length > 0) {
        displayNotifications(data.notifications);
        notificationsContainer.style.display = 'block';
        updatePaginationControls();
      } else {
        noNotifications.classList.remove('profile-hidden');
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
      notificationsLoading.style.display = 'none';
      
      // Show error message
      if (receivedNotificationsList) {
        receivedNotificationsList.innerHTML = `
          <li class="notification-item error">
            <div class="notification-content">
              <p class="error-message">Failed to load notifications: ${error.message}</p>
              <button onclick="fetchReceivedNotifications()" class="btn-secondary">
                <i class="fas fa-retry"></i> Retry
              </button>
            </div>
          </li>
        `;
        notificationsContainer.style.display
      }
    }
  }

  // Function to display notifications
  function displayNotifications(notifications) {
    if (!receivedNotificationsList) return;

    receivedNotificationsList.innerHTML = '';

    notifications.forEach(notification => {
      const li = document.createElement('li');
      li.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
      
      const senderInfo = notification.sender_id 
        ? `${notification.sender_id.name} (${notification.sender_id.role})`
        : 'System';

      const timeAgo = formatTimeAgo(new Date(notification.sent_at));

      li.innerHTML = `
        <div class="notification-content">
          <div class="notification-header">
            <h4 class="notification-title">${notification.title}</h4>
            <span class="notification-time">${timeAgo}</span>
          </div>
          <p class="notification-message">${notification.message}</p>
          <div class="notification-sender">
            <i class="fas fa-user"></i>
            <span>From: ${senderInfo}</span>
          </div>
        </div>
        <div class="notification-actions">
          ${!notification.read ? `
            <button class="mark-read-btn" onclick="markNotificationAsRead('${notification._id}')">
              <i class="fas fa-check"></i> Mark Read
            </button>
          ` : ''}
        </div>
      `;

      // Add click handler to mark as read when clicked
      if (!notification.read) {
        li.addEventListener('click', (e) => {
          if (!e.target.closest('.mark-read-btn')) {
            markNotificationAsRead(notification._id);
          }
        });
      }

      receivedNotificationsList.appendChild(li);
    });
  }

  // Function to format time ago
  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  // Function to mark notification as read
  async function markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mark as read response:', data);
        
        // Refresh notifications to update read status
        fetchReceivedNotifications(currentPage, currentFilter);
        showNotification(data.message || 'Notification marked as read', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showNotification('Failed to mark notification as read: ' + error.message, 'error');
    }
  }

  // Function to mark all notifications as read
  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mark all as read response:', data);
        
        fetchReceivedNotifications(currentPage, currentFilter);
        showNotification(data.message || 'All notifications marked as read', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showNotification('Failed to mark all notifications as read: ' + error.message, 'error');
    }
  }

  // Function to update pagination controls
  function updatePaginationControls() {
    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    if (prevPageBtn) {
      prevPageBtn.disabled = currentPage <= 1;
    }
    
    if (nextPageBtn) {
      nextPageBtn.disabled = currentPage >= totalPages;
    }
  }

  // Event listeners for received notifications
  if (filterNotifications) {
    filterNotifications.addEventListener('change', function() {
      currentFilter = this.value;
      currentPage = 1;
      fetchReceivedNotifications(1, currentFilter);
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }

  if (refreshNotificationsBtn) {
    refreshNotificationsBtn.addEventListener('click', () => {
      fetchReceivedNotifications(currentPage, currentFilter);
    });
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        fetchReceivedNotifications(currentPage - 1, currentFilter);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        fetchReceivedNotifications(currentPage + 1, currentFilter);
      }
    });
  }

  // Make markNotificationAsRead global for onclick handlers
  window.markNotificationAsRead = markNotificationAsRead;

  // Load notifications when on notifications page
  if (window.location.hash === '#notifications' || document.getElementById('notifications')) {
    fetchReceivedNotifications();
  }

  // Also load notifications when notifications tab is clicked
  const notificationsNavLink = document.querySelector('a[href="#notifications"]');
  if (notificationsNavLink) {
    notificationsNavLink.addEventListener('click', function() {
      setTimeout(() => fetchReceivedNotifications(), 100);
    });
  }

  // Profile Management Functionality
  const profileLoading = document.getElementById('profile-loading');
  const profileContent = document.getElementById('profile-content');
  const profileError = document.getElementById('profile-error');
  const refreshProfileBtn = document.getElementById('refresh-profile-btn');
  const retryProfileBtn = document.getElementById('retry-profile-btn');
  const changePasswordForm = document.getElementById('change-password-form');
  const passwordStatus = document.getElementById('password-status');

  // Function to fetch and display profile data
  async function fetchProfile() {
    try {
      // Show loading state
      profileLoading.style.display = 'block';
      profileContent.classList.add('profile-hidden');
      profileError.classList.add('profile-hidden');

      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      console.log('Profile data:', data);
      console.log('Full response structure:', JSON.stringify(data, null, 2));

      // Hide loading, show content
      profileLoading.style.display = 'none';
      profileContent.classList.remove('profile-hidden');

      // Populate profile fields
      const profile = data.data || data.user || data;
      console.log('Extracted profile object:', profile);
      
      // Handle name - try multiple variations
      let displayName = '-';
      if (profile.name) {
        displayName = profile.name;
      } else if (profile.firstName) {
        displayName = profile.firstName + (profile.lastName ? ' ' + profile.lastName : '');
      } else if (profile.fullName) {
        displayName = profile.fullName;
      }
      
      // Handle department - try multiple variations
      let department = '-';
      if (profile.department_id) {
        if (typeof profile.department_id === 'string') {
          department = profile.department_id;
        } else if (profile.department_id.name) {
          // Show both name and code if available
          department = profile.department_id.name;
          if (profile.department_id.code) {
            department += ` (${profile.department_id.code})`;
          }
        } else if (profile.department_id.title) {
          department = profile.department_id.title;
        }
      } else if (profile.department) {
        if (typeof profile.department === 'string') {
          department = profile.department;
        } else if (profile.department.name) {
          department = profile.department.name;
        } else if (profile.department.title) {
          department = profile.department.title;
        }
      } else if (profile.departmentName) {
        department = profile.departmentName;
      } else if (profile.dept) {
        department = profile.dept;
      }
      
      console.log('Department value found:', department);
      
      document.getElementById('profile-name').textContent = displayName;
      document.getElementById('profile-email').textContent = profile.email || '-';
      document.getElementById('profile-department').textContent = department;
      document.getElementById('profile-role').textContent = profile.role || profile.userType || 'Lecturer';

    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Hide loading, show error
      profileLoading.style.display = 'none';
      profileError.classList.remove('profile-hidden');
      profileError.innerHTML = `
        <p class="error-message">Failed to load profile information: ${error.message}</p>
        <button id="retry-profile-btn" class="btn-secondary">
          <i class="fas fa-retry"></i> Retry
        </button>
      `;

      // Re-attach retry event listener
      const newRetryBtn = document.getElementById('retry-profile-btn');
      if (newRetryBtn) {
        newRetryBtn.addEventListener('click', fetchProfile);
      }
    }
  }

  // Function to handle password change
  async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    // Reset status
    passwordStatus.className = '';
    passwordStatus.textContent = '';

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordStatus.textContent = 'All fields are required.';
      passwordStatus.className = 'error';
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordStatus.textContent = 'New passwords do not match.';
      passwordStatus.className = 'error';
      return;
    }

    if (newPassword.length < 6) {
      passwordStatus.textContent = 'New password must be at least 6 characters long.';
      passwordStatus.className = 'error';
      return;
    }

    if (newPassword === currentPassword) {
      passwordStatus.textContent = 'New password must be different from current password.';
      passwordStatus.className = 'error';
      return;
    }

    try {
      // Show loading state
      passwordStatus.textContent = 'Changing password...';
      passwordStatus.className = '';

      const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      // Success
      passwordStatus.textContent = 'Password changed successfully!';
      passwordStatus.className = 'success';
      
      showNotification('Password changed successfully!', 'success');
      changePasswordForm.reset();

    } catch (error) {
      console.error('Error changing password:', error);
      passwordStatus.textContent = 'Error: ' + error.message;
      passwordStatus.className = 'error';
      showNotification('Failed to change password: ' + error.message, 'error');
    }
  }

  // Event listeners for profile functionality
  if (refreshProfileBtn) {
    refreshProfileBtn.addEventListener('click', fetchProfile);
  }

  if (retryProfileBtn) {
    retryProfileBtn.addEventListener('click', fetchProfile);
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handlePasswordChange);
  }

  // Load profile data when on profile page
  if (window.location.hash === '#profile' || document.getElementById('profile')) {
    fetchProfile();
  }

  // Also load profile when profile tab is clicked
  const profileNavLink = document.querySelector('a[href="#profile"]');
  if (profileNavLink) {
    profileNavLink.addEventListener('click', function() {
      setTimeout(fetchProfile, 100); // Small delay to ensure DOM is ready
    });
  }

  // ================= FINAL YEAR PROJECTS SECTION =================
  document.addEventListener('DOMContentLoaded', () => {
    // Project Year Management
    const projectYearsList = document.getElementById('project-years-list');
    const createProjectYearForm = document.getElementById('create-project-year-form');
    const academicYearInput = document.getElementById('academic-year');

    // Project Group Management
    const projectGroupsList = document.getElementById('project-groups-list');
    const createProjectGroupForm = document.getElementById('create-project-group-form');
    const projectYearSelect = document.getElementById('project-year-select');
    const groupTopicInput = document.getElementById('group-topic');
    const groupMembersContainer = document.getElementById('group-members-container');
    const addMemberBtn = document.getElementById('add-member-btn');

    // Grading
    const gradeProjectForm = document.getElementById('grade-project-form');
    const groupSelect = document.getElementById('group-select');
    const gradesList = document.getElementById('grades-list');

    // Final Grade
    const finalGradeForm = document.getElementById('final-grade-form');
    const finalGroupSelect = document.getElementById('final-group-select');
    const finalGradeResult = document.getElementById('final-grade-result');

    // 1. Fetch and render project years
    async function fetchProjectYears() {
      projectYearsList.innerHTML = '<div class="loading-state">Loading...</div>';
      try {
        const res = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/projects/years');
        if (!res.ok) throw new Error('Failed to fetch project years');
        const data = await res.json();
        renderProjectYears(data.data || []);
        // Populate selects
        renderProjectYearSelects(data.data || []);
      } catch (e) {
        projectYearsList.innerHTML = '<div class="error-state">Failed to load project years</div>';
      }
    }

    function renderProjectYears(years) {
      if (!years.length) {
        projectYearsList.innerHTML = '<div class="empty-state">No project years found.</div>';
        return;
      }
      projectYearsList.innerHTML = '<ul class="project-years-list">' + 
        years.map(y => `
          <li class="project-year-item">
            <div class="year-info">
              <strong>${y.academic_year}</strong>
              <span class="status-badge ${y.status.toLowerCase()}">${y.status}</span>
            </div>
            <div class="year-details">
              <span class="department">${y.department_id?.name || 'N/A'}</span>
              <span class="created-by">Created by: ${y.created_by?.name || 'N/A'}</span>
              <span class="created-date">Created: ${new Date(y.createdAt).toLocaleDateString()}</span>
            </div>
          </li>
        `).join('') + 
      '</ul>';
    }

    function renderProjectYearSelects(years) {
      [projectYearSelect].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Select year</option>' +
          years.map(y => `<option value="${y._id}">${y.academic_year}</option>`).join('');
      });
    }

    // 2. Create project year
    if (createProjectYearForm) {
      createProjectYearForm.addEventListener('submit', async e => {
        e.preventDefault();
        const academic_year = academicYearInput.value.trim();
        if (!academic_year) return showNotification('Enter academic year', 'error');

        // Show loading state
        const submitBtn = createProjectYearForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        try {
          // First get the user's department ID from their profile
          const profileRes = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/lecturer/profile');
          if (!profileRes.ok) throw new Error('Failed to get department information');
          const profileData = await profileRes.json();
          const department_id = profileData.data?.department_id;
          
          if (!department_id) {
            throw new Error('Department information not found');
          }

          const res = await makeAuthenticatedRequest('https://department-mangement-system-97wj.onrender.com/api/projects/years', {
            method: 'POST',
            body: JSON.stringify({ 
              academic_year,
              department_id 
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to create project year');
          }

          const data = await res.json();
          showNotification(data.message || 'Project year created successfully', 'success');
          createProjectYearForm.reset();
          fetchProjectYears();
        } catch (e) {
          showNotification('Error creating project year', 'error');
        }
      });
    }

    // 3. Add/remove group member fields
    if (addMemberBtn) {
      addMemberBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'member-id';
        input.className = 'member-id-input';
        input.placeholder = 'Student ID';
        input.required = true;
        groupMembersContainer.appendChild(input);
      });
    }

    // 4. Fetch and render project groups
    async function fetchProjectGroups() {
      projectGroupsList.innerHTML = '<div class="loading-state">Loading...</div>';
      try {
        const yearId = projectYearSelect.value;
        let url = '/api/projects/groups';
        if (yearId) url += `?project_year_id=${yearId}`;
        const res = await makeAuthenticatedRequest(url);
        if (!res.ok) throw new Error('Failed to fetch groups');
        const data = await res.json();
        renderProjectGroups(data.data || []);
        renderGroupSelects(data.data || []);
      } catch (e) {
        projectGroupsList.innerHTML = '<div class="error-state">Failed to load groups</div>';
      }
    }

    function renderProjectGroups(groups) {
      if (!groups.length) {
        projectGroupsList.innerHTML = '<div class="empty-state">No project groups found.</div>';
        return;
      }
      projectGroupsList.innerHTML = '<ul>' + groups.map(g => `<li><strong>Group #${g.group_number || ''}</strong>: ${g.topic} (${g.current_stage || ''})</li>`).join('') + '</ul>';
    }

    function renderGroupSelects(groups) {
      [groupSelect, finalGroupSelect].forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Select group</option>' +
          groups.map(g => `<option value="${g._id}">Group #${g.group_number || ''} - ${g.topic}</option>`).join('');
      });
    }

    // 5. Create project group
    if (createProjectGroupForm) {
      createProjectGroupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const project_year_id = projectYearSelect.value;
        const topic = groupTopicInput.value.trim();
        const memberInputs = groupMembersContainer.querySelectorAll('.member-id-input');
        const members = Array.from(memberInputs).map(input => ({ student_id: input.value.trim() })).filter(m => m.student_id);
        if (!project_year_id || !topic || !members.length) return showNotification('Fill all group fields', 'error');
        try {
          const res = await makeAuthenticatedRequest('/api/projects/groups', {
            method: 'POST',
            body: JSON.stringify({ project_year_id, topic, members })
          });
          if (!res.ok) throw new Error('Failed to create group');
          showNotification('Project group created', 'success');
          createProjectGroupForm.reset();
          fetchProjectGroups();
        } catch (e) {
          showNotification('Error creating group', 'error');
        }
      });
    }

    // 6. Fetch and render grades for a group
    async function fetchGradesForGroup(groupId) {
      gradesList.innerHTML = '<div class="loading-state">Loading grades...</div>';
      try {
        let url = `/api/projects/grades?project_group_id=${groupId}`;
        const res = await makeAuthenticatedRequest(url);
        if (!res.ok) throw new Error('Failed to fetch grades');
        const data = await res.json();
        renderGrades(data.data || []);
      } catch (e) {
        gradesList.innerHTML = '<div class="error-state">Failed to load grades</div>';
      }
    }

    function renderGrades(grades) {
      if (!grades.length) {
        gradesList.innerHTML = '<div class="empty-state">No grades found for this group.</div>';
        return;
      }
      gradesList.innerHTML = '<ul>' + grades.map(g => `<li><strong>${g.stage}</strong>: ${g.score} (${g.comments || ''})</li>`).join('') + '</ul>';
    }

    // 7. Grade project
    if (gradeProjectForm) {
      gradeProjectForm.addEventListener('submit', async e => {
        e.preventDefault();
        const project_group_id = groupSelect.value;
        const stage = document.getElementById('grading-stage').value;
        const score = parseInt(document.getElementById('score').value, 10);
        const comments = document.getElementById('comments').value;
        const is_final = document.getElementById('is-final').checked;
        if (!project_group_id || !stage || isNaN(score)) return showNotification('Fill all grading fields', 'error');
        try {
          const res = await makeAuthenticatedRequest('/api/projects/grades', {
            method: 'POST',
            body: JSON.stringify({ project_group_id, stage, score, comments, is_final })
          });
          if (!res.ok) throw new Error('Failed to submit grade');
          showNotification('Grade submitted', 'success');
          fetchGradesForGroup(project_group_id);
        } catch (e) {
          showNotification('Error submitting grade', 'error');
        }
      });
    }

    // 8. Fetch grades when group changes
    if (groupSelect) {
      groupSelect.addEventListener('change', e => {
        const groupId = groupSelect.value;
        if (groupId) fetchGradesForGroup(groupId);
      });
    }

    // 9. View final grade
    if (finalGradeForm) {
      finalGradeForm.addEventListener('submit', async e => {
        e.preventDefault();
        const groupId = finalGroupSelect.value;
        if (!groupId) return showNotification('Select a group', 'error');
        finalGradeResult.innerHTML = '<div class="loading-state">Loading...</div>';
        try {
          const res = await makeAuthenticatedRequest(`/api/projects/groups/${groupId}/final-grade`);
          if (!res.ok) throw new Error('Failed to fetch final grade');
          const data = await res.json();
          renderFinalGrade(data.data);
        } catch (e) {
          finalGradeResult.innerHTML = '<div class="error-state">Failed to load final grade</div>';
        }
      });
    }

    function renderFinalGrade(data) {
      if (!data || !data.final_grade) {
        finalGradeResult.innerHTML = '<div class="empty-state">No final grade found.</div>';
        return;
      }
      finalGradeResult.innerHTML = `
        <div><strong>Final Grade:</strong> ${data.final_grade} (${getLetterGrade(data.final_grade)})</div>
        <div><strong>Stages:</strong></div>
        <ul>
          ${data.stage_grades.map(sg => `<li>${sg.stage}: ${sg.score} (${sg.comments || ''})</li>`).join('')}
        </ul>
      `;
    }

    // Initial load
    fetchProjectYears();
    fetchProjectGroups();
  });
  // ================= END FINAL YEAR PROJECTS SECTION =================
});
