// Password reset page functionality

// Password toggle function
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
        button.title = 'Hide password';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
        button.title = 'Show password';
    }
}

// Get token from URL
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// Verify token on page load
async function verifyToken(token) {
    if (!token) {
        showTokenError('No reset token provided. Please use the link from your email.');
        return false;
    }
    
    try {
        if (typeof API !== 'undefined') {
            try {
                const response = await API.request('/auth.php?action=verify-reset-token', {
                    method: 'POST',
                    body: JSON.stringify({ token: token })
                });
                
                if (response.valid) {
                    showTokenSuccess(`Token verified for: ${response.email || response.username || 'your account'}`);
                    return true;
                }
            } catch (error) {
                console.warn('Backend verification failed, token will be validated on submit:', error);
                // Continue anyway - token will be validated on submit
                return true;
            }
        }
        
        // If no API, assume token is valid (will be validated on submit)
        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        // Continue anyway - token will be validated on submit
        return true;
    }
}

function showTokenSuccess(message) {
    const statusDiv = document.getElementById('tokenStatus');
    const messageDiv = document.getElementById('tokenStatusMessage');
    if (statusDiv && messageDiv) {
        messageDiv.className = 'alert';
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
        messageDiv.textContent = '✓ ' + message;
        statusDiv.style.display = 'block';
    }
}

function showTokenError(message) {
    const statusDiv = document.getElementById('tokenStatus');
    const messageDiv = document.getElementById('tokenStatusMessage');
    if (statusDiv && messageDiv) {
        messageDiv.className = 'alert';
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
        messageDiv.textContent = '✗ ' + message;
        statusDiv.style.display = 'block';
    }
}

// Reset password form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = getTokenFromURL();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!token) {
        CustomAlert.error('Invalid reset link. Please use the link from your email.');
        return;
    }
    
    if (newPassword.length < 6) {
        CustomAlert.error('Password must be at least 6 characters long');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        CustomAlert.error('Passwords do not match');
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('#resetPasswordForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Resetting...';
    
    try {
        // Try backend API first
        if (typeof API !== 'undefined') {
            try {
                const response = await API.request('/auth.php?action=reset-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        token: token,
                        new_password: newPassword
                    })
                });
                
                CustomAlert.success('Password reset successfully! Redirecting to login...');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
                return;
            } catch (error) {
                // Check if it's a validation error
                if (error.message && error.message.includes('Invalid or expired')) {
                    CustomAlert.error('Invalid or expired reset token. Please request a new password reset.');
                    return;
                }
                
                console.error('Password reset error:', error);
                CustomAlert.error(error.message || 'Failed to reset password. Please try again.');
                return;
            }
        }
        
        // Fallback: If no API, show error
        CustomAlert.error('Password reset service is not available. Please contact support.');
        
    } catch (error) {
        console.error('Password reset error:', error);
        CustomAlert.error('An error occurred. Please try again later.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const token = getTokenFromURL();
    
    if (!token) {
        showTokenError('No reset token found. Please use the link from your email.');
        document.getElementById('resetPasswordForm').style.display = 'none';
        return;
    }
    
    // Verify token
    await verifyToken(token);
});

