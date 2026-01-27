// FILE UPLOAD FUNCTIONALITY FOR DASHBOARD
// Add this script before the closing </script> tag in dashboard.html

// ===== FILE UPLOAD FUNCTIONALITY =====
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

if (uploadBtn && fileInput) {
    // Trigger file input when button clicked
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file extension
        if (!file.name.endsWith('.pb')) {
            showToast('❌ Please select a .pb recording file', 'error');
            return;
        }
        
        showToast(`⏳ Uploading ${file.name}...`, 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload_recording', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast(`✓ ${data.message}`, 'success');
            } else {
                showToast(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('❌ Upload failed', 'error');
        }
        
        // Reset file input
        fileInput.value = '';
    });
}

function showToast(message, type = 'info') {
    // Create toast if it doesn't exist
    let toast = document.getElementById('upload-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'upload-toast';
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 2000;
            transition: opacity 0.3s ease;
            font-weight: 500;
        `;
        document.body.appendChild(toast);
    }
    
    // Set color based on type
    const colors = {
        success: '#2e6c46',
        error: '#ba1a1a',
        info: '#00668b'
    };
    toast.style.background = colors[type] || colors.info;
    toast.style.color = 'white';
    
    // Show message
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 4000);
}

// ===== INJECT UPLOAD BUTTON INTO HEADER =====
// Add this as a separate script tag after the main script
const headerActions = document.querySelector('.header-content > div:last-child');
if (headerActions) {
    const uploadBtnHTML = `
        <button id="upload-btn" class="theme-toggle" style="margin-right: 1rem;" title="Upload Recording File">
            <span class="icon">📁</span>
            <span>Upload Recording</span>
        </button>
        <input type="file" id="file-input" accept=".pb" style="display: none;">
    `;
    headerActions.insertAdjacentHTML('afterbegin', uploadBtnHTML);
}
