// PWA Installation and Update Handler
let deferredPrompt;

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });

        // Handle PWA installation prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;
            showInstallButton();
        });
    });
}

// Function to show the install button
function showInstallButton() {
    if (document.getElementById('pwa-install-button')) return;

    // Create install button
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.className = 'pwa-install-button';
    installButton.innerHTML = '<i class="fas fa-download"></i> Install App';

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .pwa-install-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: slideIn 0.3s ease;
        }
        
        .pwa-install-button:hover {
            background-color: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .pwa-install-button i {
            font-size: 18px;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .pwa-install-button {
                bottom: 15px;
                right: 15px;
                padding: 10px 20px;
                font-size: 14px;
            }
            
            .pwa-install-button i {
                font-size: 16px;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(installButton);
    
    // Add click handler
    installButton.addEventListener('click', installPWA);
}

// Function to install the PWA
async function installPWA() {
    if (!deferredPrompt) return;

    try {
        // Show the installation prompt
        deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Installation ${outcome}`);
        
        // Clear the deferredPrompt
        deferredPrompt = null;
        
        // Hide install button if installed
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => installButton.remove(), 300);
        }

        if (outcome === 'accepted') {
            showToast('Installation Successful', 'The app has been installed successfully!', 'success');
        }
    } catch (error) {
        console.error('Error installing PWA:', error);
        showToast('Installation Failed', 'Could not install the application. Please try again.', 'error');
    }
}

// Function to show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    
    notification.innerHTML = `
        <div class="update-content">
            <i class="fas fa-sync-alt"></i>
            <span>A new version is available!</span>
            <button onclick="updateApp()" class="update-button">
                <i class="fas fa-arrow-circle-up"></i> Update Now
            </button>
        </div>
    `;

    // Add styles for update notification
    const style = document.createElement('style');
    style.textContent = `
        .pwa-update-notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideUp 0.3s ease;
        }

        .update-content {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #333;
        }

        .update-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.3s ease;
        }

        .update-button:hover {
            background: #218838;
        }

        @keyframes slideUp {
            from {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        @media (max-width: 768px) {
            .pwa-update-notification {
                width: 90%;
                padding: 12px 16px;
            }

            .update-content {
                flex-wrap: wrap;
                justify-content: center;
                text-align: center;
            }

            .update-button {
                width: 100%;
                justify-content: center;
                margin-top: 8px;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
}

// Function to update the app
function updateApp() {
    // Remove update notification with animation
    const notification = document.querySelector('.pwa-update-notification');
    if (notification) {
        notification.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }

    // Reload to get the new version
    window.location.reload();
}

// Function to show toast messages
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `pwa-toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <div class="toast-text">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add toast styles if not already added
    if (!document.getElementById('pwa-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'pwa-toast-styles';
        style.textContent = `
            .pwa-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1002;
                animation: slideIn 0.3s ease;
            }

            .toast-content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }

            .toast-text {
                flex: 1;
            }

            .toast-text strong {
                display: block;
                margin-bottom: 4px;
            }

            .toast-text p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }

            .toast-close {
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s;
            }

            .toast-close:hover {
                color: #333;
            }

            .pwa-toast.success { border-left: 4px solid #28a745; }
            .pwa-toast.error { border-left: 4px solid #dc3545; }
            .pwa-toast.warning { border-left: 4px solid #ffc107; }
            .pwa-toast.info { border-left: 4px solid #17a2b8; }

            @media (max-width: 768px) {
                .pwa-toast {
                    width: 90%;
                    right: 5%;
                    min-width: unset;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Helper function to get toast icon
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Handle online/offline events
window.addEventListener('online', () => {
    showToast('Back Online', 'Your connection has been restored.', 'success');
});

window.addEventListener('offline', () => {
    showToast('Offline', 'You are currently offline. Some features may be limited.', 'warning');
});