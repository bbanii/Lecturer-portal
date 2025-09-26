// Function to handle file upload before form submission
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'assignment'); // Indicate this is an assignment file

    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const uploadProgress = document.getElementById('upload-progress');
    
    // Show progress bar
    uploadProgress.style.display = 'block';
    
    try {
        console.log('Starting file upload...', file.name); // Debug log
        const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                // Note: Don't set Content-Type header when sending FormData, 
                // browser will set it automatically with the correct boundary
            },
            body: formData
        });

        console.log('Upload response status:', response.status); // Debug log
        const responseText = await response.text();
        console.log('Upload response:', responseText); // Debug log

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.status} ${responseText}`);
        }

        // Try to parse the response if it's JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid response format from server');
        }

        if (!data.success) {
            throw new Error(data.message || 'Upload failed');
        }

        if (!data.file || !data.file.url) {
            throw new Error('No file URL received from server');
        }

        console.log('Upload successful, file URL:', data.file.url); // Debug log
        return data.file.url; // Return the URL of the uploaded file
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    } finally {
        // Hide progress bar after upload (success or failure)
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }, 1000);
    }
}

// Set up file upload handler
function setupFileUploadHandler() {
    const fileInput = document.getElementById('assignment-file');
    const createButton = document.getElementById('create-assignment-btn');
    const form = document.getElementById('create-assignment-form');

    let uploadedFileUrl = null;
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                console.log('Invalid file type selected');
                fileInput.value = '';
                return;
            }

            try {
                // Start upload immediately after file selection
                createButton.disabled = true;
                createButton.textContent = 'Uploading...';
                console.log('Starting file upload for:', file.name); // Debug log
                uploadedFileUrl = await uploadFile(file);
                console.log('Upload completed successfully'); // Debug log
                createButton.textContent = 'Create Assignment';
                createButton.disabled = false;
            } catch (error) {
                console.error('Error uploading file:', error.message);
                fileInput.value = '';
                createButton.textContent = 'Create Assignment';
                createButton.disabled = false;
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!uploadedFileUrl) {
            console.log('No file uploaded yet');
            return;
        }

        try {
            // Disable submit button while creating assignment
            createButton.disabled = true;
            createButton.textContent = 'Creating...';

            // Create the assignment with the previously uploaded file URL
            const formData = {
                course_id: document.getElementById('assignment-course').value,
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                due_date: document.getElementById('due_date').value,
                file_url: uploadedFileUrl  // Using the previously uploaded file URL
            };

            const response = await fetch('https://department-mangement-system-97wj.onrender.com/api/lecturer/assignments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create assignment');
            }

            // Clear form
            form.reset();
            
            // Reload assignments list
            await loadAssignments();
            applyFiltersAndSort();

        } catch (error) {
            console.error('Error:', error);
        } finally {
            // Re-enable submit button
            createButton.disabled = false;
            createButton.textContent = 'Create Assignment';
        }
    });
}
