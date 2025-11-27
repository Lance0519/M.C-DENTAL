// Login page functionality

// Password toggle function - Must be in global scope for onclick to work
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        button.title = 'Hide password';
    } else {
        input.type = 'password';
        button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        button.title = 'Show password';
    }
}

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// Form switching
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    forgotPasswordForm.style.display = 'none';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
});

document.getElementById('showForgotPassword').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'block';
});

document.getElementById('backToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameOrEmail = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading state
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
        // Try backend API first (if available)
        if (typeof API !== 'undefined') {
            try {
                // Check if backend is available
                const isBackendAvailable = await API.checkBackendAvailability();
                
                if (isBackendAvailable) {
                    try {
                        const response = await API.login(usernameOrEmail, password);
                        
                        if (response.user && response.token) {
                            // Store user data
                            Storage.setCurrentUser(response.user);
                            API.setToken(response.token);
                            
                            CustomAlert.success('Login successful!');
                            submitButton.disabled = false;
                            submitButton.textContent = originalText;
                            
                            setTimeout(() => {
                                Auth.redirectToDashboard(response.user.role);
                            }, 1500);
                            return;
                        }
                    } catch (apiError) {
                        // API login failed, fall through to local storage
                        console.warn('Backend login failed, trying local storage:', apiError);
                        
                        // Check if it's an authentication error (wrong credentials)
                        if (apiError.message && apiError.message.includes('Invalid username')) {
                            CustomAlert.error('Invalid username/email or password');
                            submitButton.disabled = false;
                            submitButton.textContent = originalText;
                            return;
                        }
                    }
                } else {
                    console.info('Backend not available, using local storage for login');
                }
            } catch (error) {
                console.warn('Backend check failed, using local storage:', error);
            }
        }
        
        // Fallback to local storage
        const result = await Auth.login(usernameOrEmail, password);
        
        if (result.success) {
            CustomAlert.success('Login successful!');
            setTimeout(() => {
                Auth.redirectToDashboard(result.user.role);
            }, 1500);
        } else {
            CustomAlert.error(result.message || 'Invalid username/email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        CustomAlert.error('An error occurred during login. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Registration form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const fullName = `${firstName} ${lastName}`.trim();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const dateOfBirth = document.getElementById('regDOB').value;
    const gender = document.getElementById('regGender').value;
    const address = document.getElementById('regAddress').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validation
    if (!firstName || !lastName) {
        CustomAlert.error('Please enter both first name and last name');
        return;
    }
    
    if (password !== confirmPassword) {
        CustomAlert.error('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        CustomAlert.error('Password must be at least 6 characters');
        return;
    }
    
    // Use real-time validation functions for final check (await async)
    const emailValidation = await validateEmailRealTime(email);
    if (!emailValidation.valid) {
        CustomAlert.error(emailValidation.message || 'Please enter a valid email address');
        return;
    }
    
    const usernameValidation = validateUsernameRealTime(username);
    if (!usernameValidation.valid) {
        CustomAlert.error(usernameValidation.message || 'Please enter a valid username');
        return;
    }
    
    if (!Utils.validatePhone(phone)) {
        CustomAlert.error('Please enter a valid phone number');
        return;
    }
    
    const userData = {
        firstName,
        lastName,
        fullName,
        username,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        password
    };
    
    // Show loading state
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Registering...';
    
    try {
        const result = await Auth.register(userData);
        
        if (result.success) {
            // Log patient registration activity
            if (typeof logActivity === 'function') {
                logActivity('patient', 'Patient Account Created', `New patient account created for ${userData.fullName} (${userData.email})`);
            }
            
            // Show success alert with redirect callback
            const overlay = document.createElement('div');
            overlay.className = 'custom-alert-overlay';
            overlay.innerHTML = `
                <div class="custom-alert-modal">
                    <div class="custom-alert-icon">✅</div>
                    <h2 class="custom-alert-title">Success!</h2>
                <p class="custom-alert-message">Account created successfully!\n\nWelcome, ${userData.fullName}!\n\nYou can now log in with your username: ${userData.username}</p>
                <button class="custom-alert-button">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // Handle button click to redirect to login form
        overlay.querySelector('.custom-alert-button').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                registerForm.reset();
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                forgotPasswordForm.style.display = 'none';
            }, 300);
        });
        } else {
            CustomAlert.error(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        CustomAlert.error('An error occurred during registration. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Forgot Password form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        CustomAlert.error('Please enter your email address');
        return;
    }
    
    if (!Utils.validateEmail(email)) {
        CustomAlert.error('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        // Try backend API first (with timeout and error handling)
        if (typeof API !== 'undefined') {
            try {
                // Check if backend is available first
                const isBackendAvailable = await API.checkBackendAvailability();
                
                if (isBackendAvailable) {
                    try {
                        const response = await API.recoverPassword(email);
                        
                        if (response.email_sent) {
                            CustomAlert.success('Password recovery email sent! Please check your email inbox.');
                        } else {
                            // Email service not configured - show password directly
                            if (response.password) {
                                CustomAlert.info(`Your password is: ${response.password}`);
                            } else {
                                CustomAlert.success(response.message || 'Password recovery email sent!');
                            }
                        }
                        forgotPasswordForm.reset();
                        submitButton.disabled = false;
                        submitButton.textContent = originalText;
                        return;
                    } catch (apiError) {
                        // API call failed, fall through to local storage
                        console.warn('Backend API call failed, using local storage:', apiError);
                    }
                } else {
                    // Backend not available, use local storage immediately
                    console.info('Backend not available, using local storage for password recovery');
                }
            } catch (error) {
                // Backend check failed, fall through to local storage
                console.warn('Backend check failed, using local storage:', error);
            }
        }
        
        // Fallback to local storage
        const result = await Auth.recoverPassword(email);
        
        if (result.success) {
            CustomAlert.success(result.message);
            forgotPasswordForm.reset();
        } else {
            CustomAlert.error(result.message || 'Email not found. Please check your email address.');
        }
    } catch (error) {
        console.error('Password recovery error:', error);
        CustomAlert.error('An error occurred. Please try again later.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Helper function to detect random emails
function isRandomEmail(localPart) {
    // Remove dots for analysis
    const cleanPart = localPart.replace(/\./g, '');
    
    // Check for high randomness (too many consonants, no vowels pattern)
    const vowels = 'aeiou';
    const consonantCount = cleanPart.split('').filter(c => !vowels.includes(c) && /[a-z]/.test(c)).length;
    const vowelCount = cleanPart.split('').filter(c => vowels.includes(c)).length;
    const totalLetters = cleanPart.split('').filter(c => /[a-z]/.test(c)).length;
    
    // If too many consonants vs vowels (random strings often lack vowels)
    if (totalLetters > 5 && vowelCount === 0 && consonantCount > 8) {
        return true; // No vowels, many consonants = likely random
    }
    
    // Check for repeating patterns (common in random strings)
    if (cleanPart.length >= 8) {
        // Check for sequences of 3+ repeating characters
        if (/(.)\1{2,}/.test(cleanPart)) {
            return true;
        }
        
        // Check for alternating patterns (ababab, 121212, etc.)
        if (/^(.)(.)(?:\1\2){2,}/.test(cleanPart)) {
            return true;
        }
    }
    
    // Check for too many numbers in a row (random strings often have many numbers)
    if (/\d{6,}/.test(localPart)) {
        return true; // 6+ consecutive digits is suspicious
    }
    
    // Check for high entropy (random-looking strings)
    // If string has many unique characters but no meaningful pattern
    if (cleanPart.length >= 10) {
        const uniqueChars = new Set(cleanPart.split('')).size;
        const entropyRatio = uniqueChars / cleanPart.length;
        
        // Very high entropy (many unique chars) with no vowels = likely random
        if (entropyRatio > 0.7 && vowelCount === 0 && totalLetters > 8) {
            return true;
        }
    }
    
    // Check for random-looking patterns: many consonants, few vowels
    if (totalLetters > 10 && vowelCount > 0) {
        const vowelRatio = vowelCount / totalLetters;
        // Real emails usually have reasonable vowel ratio (0.2-0.5)
        // Random strings often have very low vowel ratio
        if (vowelRatio < 0.15 && consonantCount > 10) {
            return true;
        }
    }
    
    // Check for suspicious patterns (all lowercase, no meaningful structure)
    if (cleanPart.length >= 12 && vowelCount === 0 && /^[a-z0-9]+$/.test(cleanPart)) {
        // Very long string with no vowels = likely random
        return true;
    }
    
    return false;
}

// Real-time email validation with SMTP/MX record verification
async function validateEmailRealTime(email) {
    if (!email) {
        return { valid: false, message: '' };
    }
    
    // Basic format validation
    if (!Utils.validateEmail(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    
    // Enhanced validation for ghost/fake emails
    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];
    const localPart = emailLower.split('@')[0];
    
    // Check for common fake/disposable email patterns
    const suspiciousPatterns = [
        /^[a-z0-9]+@(test|example|fake|temp|dummy|invalid|noreply|no-reply)/i,
        /^[a-z0-9]+@[a-z0-9]{1,2}\.[a-z0-9]{1,2}$/i, // Too short domain
        /@(mailinator|10minutemail|guerrillamail|tempmail|throwaway|trashmail)/i, // Disposable emails
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(emailLower)) {
            return { valid: false, message: 'This email appears to be invalid or temporary. Please use a real email address.' };
        }
    }
    
    // Enhanced fake email detection for popular domains (Gmail, Yahoo, etc.)
    const popularDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com'];
    const isPopularDomain = popularDomains.includes(domain);
    
    if (isPopularDomain) {
        // Check for suspicious patterns in local part (case-insensitive)
        const suspiciousKeywords = [
            'test', 'fake', 'dummy', 'temp', 'example', 'invalid', 'noreply', 'no-reply',
            'thisisnotreal', 'thisisfake', 'notreal', 'fakeemail', 'notvalid', 
            'notrealemail', 'fakeuser', 'dummyuser', 'testemail', 'fakeaccount'
        ];
        
        // Check if local part contains any suspicious keywords
        for (const keyword of suspiciousKeywords) {
            if (localPart.includes(keyword)) {
                return { valid: false, message: 'This email address appears to be fake or invalid. Please use a real email address.' };
            }
        }
        
        // Check for suspicious patterns
        const suspiciousLocalPatterns = [
            /^(test|fake|dummy|temp|example|invalid|noreply|no-reply)/i, // Starts with suspicious words
            /(test|fake|dummy|temp|example|invalid)$/i, // Ends with suspicious words
            /^(thisisnotreal|thisisfake|notreal|fakeemail|notvalid)/i, // Common fake patterns
            /^[0-9]{10,}$/, // All numbers (10+ digits - suspicious)
            /^[a-z]{1,2}$/, // Too short (1-2 characters)
            /^[a-z0-9]{1,3}\.[a-z0-9]{1,3}$/, // Too short with dot
        ];
        
        for (const pattern of suspiciousLocalPatterns) {
            if (pattern.test(localPart)) {
                return { valid: false, message: 'This email address appears to be fake or invalid. Please use a real email address.' };
            }
        }
    }
    
    // Enhanced random email detection for ALL domains (not just popular ones)
    if (isRandomEmail(localPart)) {
        return { valid: false, message: 'This email address appears to be random or fake. Please use a real email address.' };
    }
    
    // Check for random-looking patterns (too many random characters)
    if (localPart.length > 30) {
        return { valid: false, message: 'Email address appears to be invalid. Please use a real email address.' };
    }
    
    // Check for consecutive dots or special characters
    if (localPart.includes('..') || localPart.includes('---') || localPart.match(/[^a-z0-9._-]/)) {
        return { valid: false, message: 'Invalid email format. Please use a valid email address.' };
    }
    
    // Check for suspicious domain patterns
    if (!domain || domain.length < 4) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    
    // Check for valid TLD pattern (2-6 characters, alphanumeric)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2 || tld.length > 6 || !/^[a-zA-Z]{2,6}$/.test(tld)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    
    // Check if email already exists locally (fast check)
    const existingEmail = Storage.getUserByEmail(email);
    if (existingEmail) {
        return { valid: false, message: 'This email is already registered. Please use a different email or try logging in.' };
    }
    
    // Try to verify email using backend API (SMTP/MX verification)
    // Only attempt if API is available and configured
    if (typeof API !== 'undefined' && API.verifyEmail) {
        try {
            // Quick check - if backend was previously unavailable, skip API call
            const apiResult = await API.verifyEmail(email);
            
            // If backend is unavailable, allow format validation without warning
            if (apiResult.unavailable || (apiResult.error && apiResult.message && apiResult.message.includes('unavailable'))) {
                // Backend unavailable - can only do format validation (this is fine)
                return { 
                    valid: true, 
                    message: 'Email format is valid',
                    verified: false,
                    warning: false // Don't show warning - format validation is still useful
                };
            }
            
            // If API check failed due to service error, show warning
            if (apiResult.error && !apiResult.unavailable) {
                return { 
                    valid: true, 
                    message: 'Email format is valid (verification service error)',
                    verified: false,
                    warning: true
                };
            }
            
            // If email exists in database
            if (apiResult.exists) {
                return { valid: false, message: apiResult.message || 'This email is already registered.' };
            }
            
            // Return API verification result
            if (!apiResult.valid) {
                return { 
                    valid: false, 
                    message: apiResult.message || 'Email domain verification failed. Please use a valid email address.' 
                };
            }
            
            return { 
                valid: true, 
                message: apiResult.message || 'Email verified successfully',
                verified: true,
                mx_record: apiResult.mx_record
            };
        } catch (error) {
            // Backend error - only format validation available
            return { 
                valid: true, 
                message: 'Email format is valid (domain verification unavailable - backend not connected)',
                verified: false,
                warning: true
            };
        }
    }
    
    // Fallback to local validation if API is not available
    // Note: Without backend, we can only validate format, not verify if email is real
    // This is acceptable - format validation is still useful
    return { 
        valid: true, 
        message: 'Email format is valid',
        verified: false,
        warning: false // Don't show warning for normal fallback
    };
}

// Real-time username validation
function validateUsernameRealTime(username) {
    if (!username) {
        return { valid: false, message: '' };
    }
    
    // Check username length
    if (username.length < 3) {
        return { valid: false, message: 'Username must be at least 3 characters' };
    }
    
    if (username.length > 20) {
        return { valid: false, message: 'Username must be less than 20 characters' };
    }
    
    // Check for valid characters (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    
    // Check if username already exists
    const existingUsername = Storage.getUserByUsername(username);
    if (existingUsername) {
        return { valid: false, message: 'This username is already taken. Please choose a different username.' };
    }
    
    return { valid: true, message: 'Username is available' };
}

// Track pending email validation to prevent duplicate requests
let pendingEmailValidation = null;
let currentEmailValue = '';

// Debounce function to limit validation frequency
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

// Setup real-time validation
function setupRealTimeValidation() {
    const emailInput = document.getElementById('regEmail');
    const emailIcon = document.getElementById('regEmailIcon');
    const emailMessage = document.getElementById('regEmailMessage');
    
    const usernameInput = document.getElementById('regUsername');
    const usernameIcon = document.getElementById('regUsernameIcon');
    const usernameMessage = document.getElementById('regUsernameMessage');
    
    // Debounced email validation (check 800ms after user stops typing)
    const validateEmailDebounced = debounce(async () => {
        const email = emailInput.value.trim();
        
        // Cancel previous validation if email changed
        if (pendingEmailValidation && email !== currentEmailValue) {
            // Email changed, let new validation proceed
        }
        
        if (!email) {
            emailIcon.textContent = '';
            emailIcon.style.color = '';
            emailMessage.style.display = 'none';
            emailInput.style.borderColor = '';
            pendingEmailValidation = null;
            currentEmailValue = '';
            return;
        }
        
        // Prevent duplicate requests for same email
        if (pendingEmailValidation && pendingEmailValidation.email === email) {
            return; // Already validating this email
        }
        
        // Store current validation
        currentEmailValue = email;
        pendingEmailValidation = { email: email, timestamp: Date.now() };
        
        // Show loading state
        emailIcon.textContent = '⏳';
        emailIcon.style.color = '#6b7280';
        emailMessage.textContent = 'Verifying email...';
        emailMessage.style.display = 'block';
        emailMessage.style.color = '#6b7280';
        emailInput.style.borderColor = '#6b7280';
        
        try {
            // Validate email (now async)
            const result = await validateEmailRealTime(email);
            
            // Only update if email hasn't changed
            if (emailInput.value.trim() === email) {
                if (result.valid) {
                    // Show different icon/color if verification unavailable
                    if (result.warning && !result.verified) {
                        emailIcon.textContent = '⚠';
                        emailIcon.style.color = '#f59e0b'; // Amber/yellow warning
                        emailMessage.textContent = result.message;
                        emailMessage.style.display = 'block';
                        emailMessage.style.color = '#f59e0b';
                        emailInput.style.borderColor = '#f59e0b';
                    } else {
                        emailIcon.textContent = '✓';
                        emailIcon.style.color = '#10b981';
                        emailMessage.textContent = result.message;
                        emailMessage.style.display = 'block';
                        emailMessage.style.color = '#10b981';
                        emailInput.style.borderColor = '#10b981';
                    }
                } else {
                    emailIcon.textContent = '✕';
                    emailIcon.style.color = '#ef4444';
                    emailMessage.textContent = result.message;
                    emailMessage.style.display = 'block';
                    emailMessage.style.color = '#ef4444';
                    emailInput.style.borderColor = '#ef4444';
                }
            }
        } catch (error) {
            console.warn('Email validation error:', error);
            // Only update if email hasn't changed
            if (emailInput.value.trim() === email) {
                emailIcon.textContent = '⚠';
                emailIcon.style.color = '#f59e0b';
                emailMessage.textContent = 'Email format is valid (verification unavailable)';
                emailMessage.style.display = 'block';
                emailMessage.style.color = '#f59e0b';
                emailInput.style.borderColor = '#f59e0b';
            }
        } finally {
            // Clear pending validation
            if (pendingEmailValidation && pendingEmailValidation.email === email) {
                pendingEmailValidation = null;
            }
        }
    }, 800); // Increased debounce time to 800ms
    
    // Debounced username validation
    const validateUsernameDebounced = debounce(() => {
        const username = usernameInput.value.trim();
        const result = validateUsernameRealTime(username);
        
        if (!username) {
            usernameIcon.textContent = '';
            usernameIcon.style.color = '';
            usernameMessage.style.display = 'none';
            usernameInput.style.borderColor = '';
            return;
        }
        
        if (result.valid) {
            usernameIcon.textContent = '✓';
            usernameIcon.style.color = '#10b981';
            usernameMessage.textContent = result.message;
            usernameMessage.style.display = 'block';
            usernameMessage.style.color = '#10b981';
            usernameInput.style.borderColor = '#10b981';
        } else {
            usernameIcon.textContent = '✕';
            usernameIcon.style.color = '#ef4444';
            usernameMessage.textContent = result.message;
            usernameMessage.style.display = 'block';
            usernameMessage.style.color = '#ef4444';
            usernameInput.style.borderColor = '#ef4444';
        }
    }, 500);
    
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailDebounced);
        emailInput.addEventListener('blur', validateEmailDebounced);
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsernameDebounced);
        usernameInput.addEventListener('blur', validateUsernameDebounced);
    }
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
        Auth.redirectToDashboard(currentUser.role);
    }
    
    // Setup real-time validation when form is shown
    setupRealTimeValidation();
    
    // Re-setup validation when switching to registration form
    document.getElementById('showRegister')?.addEventListener('click', () => {
        setTimeout(setupRealTimeValidation, 100);
    });
});

