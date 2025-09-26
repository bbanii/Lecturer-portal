// Assignment management state
let assignments = [];
let currentPage = 1;
let totalPages = 1;
let totalAssignments = 0;
const itemsPerPage = 6;
let filteredAssignments = [];
let sortConfig = { field: 'date', order: 'desc' };
let filterConfig = { status: 'all', search: '' };

let uploadedFileUrl = null;

// Initialize assignments section
async function initializeAssignments() {
    try {
        console.log('Initializing assignments...'); // Debug log
        await loadAssignments();
        console.log('Assignments loaded, setting up event listeners...'); // Debug log
        setupEventListeners();
        setupFileUploadHandler();
        console.log('Applying initial filters...'); // Debug log
        applyFiltersAndSort();
        renderPagination();
        console.log('Initialization complete'); // Debug log
    } catch (error) {
        console.error('Initialization error:', error); // Debug log
        showNotification('Failed to load assignments', 'error');
    }
}

// Load assignments from the API
async function loadAssignments() {
    try {
        const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load assignments');
        
        const data = await response.json();
        console.log('Fetched assignments:', data); // Debug log
        
        assignments = data.assignments || [];
        console.log('Number of assignments loaded:', assignments.length); // Debug log
        
        filteredAssignments = [...assignments];
        currentPage = 1;
        totalPages = Math.ceil(assignments.length / itemsPerPage);
        totalAssignments = assignments.length;
        
        // Debug log
        console.log('Filtered assignments:', filteredAssignments.length);
        console.log('Total pages:', totalPages);
    } catch (error) {
        console.error('Error loading assignments:', error);
        showNotification('Failed to load assignments', 'error');
    }
}

// Setup event listeners for filters and sorting
function setupEventListeners() {
    // Search input
    document.getElementById('assignment-search').addEventListener('input', debounce(() => {
        filterConfig.search = document.getElementById('assignment-search').value.toLowerCase();
        currentPage = 1;
        applyFiltersAndSort();
    }, 300));

    // Status filter
    document.getElementById('assignment-status').addEventListener('change', (e) => {
        filterConfig.status = e.target.value;
        currentPage = 1;
        applyFiltersAndSort();
    });

    // Sort selection
    document.getElementById('assignment-sort').addEventListener('change', (e) => {
        const [field, order] = e.target.value.split('-');
        sortConfig = { field, order };
        applyFiltersAndSort();
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            console.log('Moving to previous page:', currentPage); // Debug log
            renderAssignments();
            renderPagination();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const maxPages = Math.ceil(filteredAssignments.length / itemsPerPage);
        if (currentPage < maxPages) {
            currentPage++;
            console.log('Moving to next page:', currentPage); // Debug log
            renderAssignments();
            renderPagination();
        }
    });
}

// Apply filters and sorting
function applyFiltersAndSort() {
    console.log('Applying filters. Total assignments:', assignments.length); // Debug log
    
    // Apply filters
    filteredAssignments = assignments.filter(assignment => {
        const matchesSearch = filterConfig.search === '' || 
            assignment.title.toLowerCase().includes(filterConfig.search) ||
            assignment.description.toLowerCase().includes(filterConfig.search);
        
        const matchesStatus = filterConfig.status === 'all' ? true :
            filterConfig.status === getAssignmentStatus(assignment);

        return matchesSearch && matchesStatus;
    });
    
    console.log('After filtering:', filteredAssignments.length); // Debug log

    // Apply sorting
    filteredAssignments.sort((a, b) => {
        if (sortConfig.field === 'date') {
            return sortConfig.order === 'desc' 
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : new Date(a.createdAt) - new Date(b.createdAt);
        } else {
            return sortConfig.order === 'desc'
                ? b.title.localeCompare(a.title)
                : a.title.localeCompare(b.title);
        }
    });

    renderAssignments();
    renderPagination();
}

// Render assignments with current filters and pagination
function renderAssignments() {
    const assignmentsList = document.getElementById('assignments-list');
    console.log('Rendering assignments. Total filtered:', filteredAssignments.length); // Debug log
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageAssignments = filteredAssignments.slice(start, end);
    
    console.log('Current page assignments:', pageAssignments.length); // Debug log

    assignmentsList.innerHTML = pageAssignments.length ? pageAssignments.map(assignment => `
        <div class="assignment-card ${getAssignmentStatus(assignment)}">
            <div class="assignment-header">
                <h4>${assignment.title}</h4>
                <span class="status-badge ${getAssignmentStatus(assignment)}">
                    ${getAssignmentStatus(assignment)}
                </span>
            </div>
            <div class="assignment-content">
                <p>${assignment.description}</p>
                <div class="assignment-meta">
                    <span><i class="fas fa-calendar"></i> Due: ${formatDate(assignment.due_date)}</span>
                    <span><i class="fas fa-book"></i> ${assignment.course_id.code} - ${assignment.course_id.title}</span>
                    <span><i class="fas fa-user"></i> ${assignment.created_by.name}</span>
                </div>
            </div>
            <div class="assignment-actions">
                <button class="action-btn view-btn" onclick="viewAssignmentDetails('${assignment._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="action-btn submissions-btn" onclick="loadSubmissions('${assignment._id}')">
                    <i class="fas fa-inbox"></i> Submissions
                </button>
            </div>
            <div class="assignment-body"></div>
        </div>
    `).join('') : '<div class="empty-state">No assignments found</div>';
}

// Render pagination controls
function renderPagination() {
    document.getElementById('current-page').textContent = `Page ${currentPage}`;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    document.getElementById('total-assignments').textContent = `${totalAssignments} assignment${totalAssignments !== 1 ? 's' : ''}`;
}

// Helper functions
function getAssignmentStatus(assignment) {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (now > dueDate) return 'completed';
    if (now < dueDate) return 'active';
    return 'pending';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


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

function closeSubmissionsModal() {
    const modal = document.getElementById('submissions-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// This function has been consolidated into downloadDocument() in lecturer.js

async function gradeSubmission(submissionId) {
    const grade = prompt('Enter grade (0-100):');
    if (grade === null) return;

    const numGrade = parseInt(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
        showNotification('Please enter a valid grade between 0 and 100', 'error');
        return;
    }

    try {
        const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/submissions/${submissionId}/grade`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grade: numGrade })
        });

        if (!response.ok) throw new Error('Failed to grade submission');

        showNotification('Submission graded successfully', 'success');
        // Refresh the submissions view
        const assignmentId = document.querySelector('.submissions-list').dataset.assignmentId;
        viewSubmissions(assignmentId);
    } catch (error) {
        console.error('Error grading submission:', error);
        showNotification('Failed to grade submission', 'error');
    }
}

async function loadSubmissionsPage(assignmentId, page) {
    try {
        const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/lecturer/submissions/?assignment_id=${assignmentId}&page=${page}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch submissions');

        const data = await response.json();
        showSubmissionsModal(data, assignmentId);
    } catch (error) {
        console.error('Error loading submissions page:', error);
        showNotification('Failed to load submissions page', 'error');
    }
}

function getFileExtension(contentType) {
    const types = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-powerpoint': '.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
    };
    return types[contentType] || '';
}

function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 3000);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeAssignments);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('submissions-modal');
    if (event.target === modal) {
        closeSubmissionsModal();
    }
});