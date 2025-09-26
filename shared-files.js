// Shared Files Management
class SharedFilesManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: 'all',
            date: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSharedFiles();
    }

    setupEventListeners() {
        // Search form
        document.getElementById('search-shared-files-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.filters.search = document.getElementById('shared-file-search').value;
            this.currentPage = 1;
            this.loadSharedFiles();
        });

        // Status filter
        document.getElementById('shared-file-status').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadSharedFiles();
        });

        // Date filter
        document.getElementById('shared-file-date').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.currentPage = 1;
            this.loadSharedFiles();
        });

        // Pagination
        document.getElementById('prev-page-shared').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadSharedFiles();
            }
        });

        document.getElementById('next-page-shared').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadSharedFiles();
            }
        });

        // Retry button
        document.getElementById('retry-shared-files').addEventListener('click', () => {
            this.loadSharedFiles();
        });
    }

    async loadSharedFiles() {
        const loadingState = document.getElementById('shared-files-loading');
        const errorState = document.getElementById('shared-files-error');
        const emptyState = document.getElementById('shared-files-empty');
        const grid = document.getElementById('shared-files-grid');

        try {
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            emptyState.classList.add('hidden');
            grid.innerHTML = '';

            // Build query parameters
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit
            });

            if (this.filters.search) queryParams.append('search', this.filters.search);
            if (this.filters.status !== 'all') queryParams.append('status', this.filters.status);
            if (this.filters.date) queryParams.append('date', this.filters.date);

            const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/files/shared?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load shared files');
            }

            const result = await response.json();
            console.log('API Response:', result); // Debug log

            // Check if response has the expected structure
            if (!result.success || !result.data || !result.data.shares) {
                throw new Error('Invalid response format from server');
            }

            // Transform the shares data to match the expected format
            const transformedData = {
                files: result.data.shares.map(share => ({
                    _id: share.file_id._id,
                    title: share.file_id.title,
                    filename: share.file_id.fileInfo.originalName,
                    size: share.file_id.fileInfo.size,
                    shared_by: share.shared_by,
                    shared_date: share.shared_at,
                    status: share.file_id.status,
                    file_url: share.file_id.file_url
                })),
                pagination: {
                    currentPage: result.data.pagination.current,
                    totalPages: result.data.pagination.total,
                    totalFiles: result.data.pagination.totalRecords,
                    hasNextPage: result.data.pagination.current < result.data.pagination.total,
                    hasPrevPage: result.data.pagination.current > 1
                }
            };

            this.renderSharedFiles(transformedData);
            if (transformedData.pagination) {
                this.updatePagination(transformedData.pagination);
            }
        } catch (error) {
            console.error('Error loading shared files:', error);
            errorState.classList.remove('hidden');
            pwaManager.showToast('Error', 'Failed to load shared files', 'error');
        } finally {
            loadingState.classList.add('hidden');
        }
    }

    renderSharedFiles(data) {
        const grid = document.getElementById('shared-files-grid');
        const emptyState = document.getElementById('shared-files-empty');
        const errorState = document.getElementById('shared-files-error');

        // Reset states
        grid.innerHTML = '';
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');

        // Ensure we have valid data
        if (!data || !data.files) {
            console.error('Invalid data structure:', data);
            errorState.classList.remove('hidden');
            return;
        }

        // Handle empty files array
        if (!Array.isArray(data.files) || data.files.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Render files
        grid.innerHTML = data.files.map(file => this.createFileCard(file)).join('');

        // Setup event listeners for file actions
        data.files.forEach(file => {
            const card = document.getElementById(`file-${file._id}`);
            if (card) {
                card.querySelector('.download-btn')?.addEventListener('click', () => this.downloadFile(file));
                card.querySelector('.view-btn')?.addEventListener('click', () => this.viewFile(file));
            }
        });
    }

    createFileCard(file) {
        const fileInfo = file.fileInfo || {};
        const fileIcon = this.getFileIcon(fileInfo.mimeType || 'application/octet-stream');
        const formattedSize = this.formatFileSize(file.size || 0);
        const formattedDate = new Date(file.shared_date || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="shared-file-card" id="file-${file._id}">
                <div class="shared-file-header">
                    <div class="shared-file-icon ${this.getFileTypeClass(fileInfo.mimeType || 'application/octet-stream')}">
                        ${fileIcon}
                    </div>
                    <div class="shared-file-info">
                        <h3 class="shared-file-title">${file.title}</h3>
                        <p class="shared-file-filename">${file.filename}</p>
                    </div>
                </div>

                <div class="shared-file-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>Shared by: ${file.shared_by.name}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-envelope"></i>
                        <span>${file.shared_by.email}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${formattedSize}</span>
                    </div>
                </div>

                <div class="shared-file-status ${(file.status || 'pending').toLowerCase()}">
                    <i class="fas ${file.status === 'Completed' ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${file.status || 'Pending'}
                </div>

                <div class="shared-file-actions">
                    <button class="shared-file-btn primary download-btn">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="shared-file-btn secondary view-btn">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
            </div>
        `;
    }

    updatePagination(pagination) {
        this.totalPages = pagination.totalPages;
        document.getElementById('current-page-shared').textContent = pagination.currentPage;
        document.getElementById('total-pages-shared').textContent = pagination.totalPages;
        document.getElementById('prev-page-shared').disabled = !pagination.hasPrevPage;
        document.getElementById('next-page-shared').disabled = !pagination.hasNextPage;
    }

    getFileIcon(mimeType) {
        const iconMap = {
            'application/pdf': '<i class="fas fa-file-pdf"></i>',
            'application/msword': '<i class="fas fa-file-word"></i>',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '<i class="fas fa-file-word"></i>',
            'application/vnd.ms-excel': '<i class="fas fa-file-excel"></i>',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '<i class="fas fa-file-excel"></i>',
            'application/vnd.ms-powerpoint': '<i class="fas fa-file-powerpoint"></i>',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '<i class="fas fa-file-powerpoint"></i>'
        };
        return iconMap[mimeType] || '<i class="fas fa-file"></i>';
    }

    getFileTypeClass(mimeType) {
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('word')) return 'doc';
        if (mimeType.includes('excel')) return 'xls';
        if (mimeType.includes('powerpoint')) return 'ppt';
        return '';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    async downloadFile(file) {
        try {
            pwaManager.showToast('Downloading', 'Starting download...', 'info');
            
            if (!file.file_url) {
                throw new Error('File URL not found');
            }

            const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/files/${file.file_url}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename || file.title;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            pwaManager.showToast('Success', 'File downloaded successfully', 'success');
        } catch (error) {
            console.error('Download error:', error);
            pwaManager.showToast('Error', 'Failed to download file', 'error');
        }
    }

    async viewFile(file) {
        try {
            if (!file.file_url) {
                throw new Error('File URL not found');
            }

            const response = await fetch(`https://department-mangement-system-97wj.onrender.com/api/files/${file.file_url}/view`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) throw new Error('Failed to view file');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('View error:', error);
            pwaManager.showToast('Error', 'Failed to view file', 'error');
        }
    }
}

// Initialize shared files when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const sharedFilesManager = new SharedFilesManager();
});