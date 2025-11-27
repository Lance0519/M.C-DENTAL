// Custom Prompt Modal - Modern Replacement for window.prompt()
// Supports single field or multiple fields with different types

const CustomPrompt = {
    show(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            // If fields array is provided, use multi-field form
            if (options.fields && Array.isArray(options.fields)) {
                return this.showForm(options.title || 'Form', options.fields, options);
            }

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-prompt-overlay';
            const isMobile = window.innerWidth <= 768;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: ${isMobile ? 'flex-start' : 'center'};
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                padding: ${isMobile ? '0.5rem' : '1rem'};
                padding-top: ${isMobile ? '2rem' : '1rem'};
                overflow-y: auto;
                box-sizing: border-box;
            `;

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'custom-prompt-modal';
            modal.style.cssText = `
                background: #FFFFFF;
                border-radius: 1.25rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-width: min(500px, 95vw);
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid transparent;
                background-image: linear-gradient(#FFFFFF, #FFFFFF),
                                  linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #8A2BE2 100%);
                background-origin: border-box;
                background-clip: padding-box, border-box;
                box-sizing: border-box;
            `;

            // Create header
            const header = document.createElement('div');
            const isSmallMobile = window.innerWidth <= 480;
            const headerPadding = isSmallMobile ? '1rem 1.25rem' : isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem';
            const headerFontSize = isSmallMobile ? '1.125rem' : isMobile ? '1.25rem' : '1.5rem';
            header.style.cssText = `
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000000;
                padding: ${headerPadding};
                border-radius: 1.25rem 1.25rem 0 0;
                font-size: ${headerFontSize};
                font-weight: 700;
                position: relative;
                border-bottom: 3px solid rgba(138, 43, 226, 0.3);
                word-wrap: break-word;
                box-sizing: border-box;
            `;
            header.textContent = options.title || 'Input';

            // Create body
            const body = document.createElement('div');
            const bodyPadding = isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2rem';
            body.style.cssText = `
                padding: ${bodyPadding};
                background: #FFFFFF;
                box-sizing: border-box;
            `;

            // Create message
            if (message) {
                const messageEl = document.createElement('p');
                messageEl.style.cssText = `
                    margin: 0 0 1rem 0;
                    color: #1A1A1A;
                    font-size: 1rem;
                    font-weight: 500;
                `;
                messageEl.textContent = message;
                body.appendChild(messageEl);
            }

            // Create input
            const input = document.createElement('input');
            input.type = options.type || 'text';
            input.value = defaultValue;
            input.style.cssText = `
                width: 100%;
                padding: 0.875rem 1.25rem;
                border: 2px solid #E5E5E5;
                border-radius: 0.75rem;
                font-size: 0.95rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: #FFFFFF;
                color: #1A1A1A;
                font-family: inherit;
                box-sizing: border-box;
            `;
            
            input.addEventListener('focus', () => {
                input.style.borderColor = '#FFD700';
                input.style.boxShadow = '0 0 0 4px rgba(255, 215, 0, 0.1), 0 4px 12px rgba(255, 215, 0, 0.2)';
                input.select();
            });
            
            input.addEventListener('blur', () => {
                input.style.borderColor = '#E5E5E5';
                input.style.boxShadow = 'none';
            });

            // Create footer
            const footer = document.createElement('div');
            const footerPadding = isSmallMobile ? '1rem 1.25rem' : isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem';
            footer.style.cssText = `
                padding: ${footerPadding};
                background: linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%);
                border-top: 2px solid #E5E5E5;
                border-radius: 0 0 1.25rem 1.25rem;
                display: flex;
                flex-direction: ${isMobile ? 'column' : 'row'};
                gap: ${isSmallMobile ? '0.75rem' : '1rem'};
                justify-content: flex-end;
                flex-wrap: wrap;
                box-sizing: border-box;
            `;

            // Create buttons
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = options.cancelText || 'Cancel';
            const cancelPadding = isSmallMobile ? '0.625rem 1.25rem' : isMobile ? '0.75rem 1.5rem' : '0.875rem 1.75rem';
            cancelBtn.style.cssText = `
                background: #FFFFFF;
                color: #1A1A1A;
                border: 2px solid #E5E5E5;
                padding: ${cancelPadding};
                border-radius: 0.75rem;
                font-weight: 600;
                font-size: ${isSmallMobile ? '0.8125rem' : isMobile ? '0.875rem' : '0.95rem'};
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                width: ${isMobile ? '100%' : 'auto'};
                min-width: 0;
                word-wrap: break-word;
                white-space: normal;
                box-sizing: border-box;
            `;
            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = '#FAFBFC';
                cancelBtn.style.borderColor = '#FFD700';
                cancelBtn.style.color = '#000000';
            });
            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = '#FFFFFF';
                cancelBtn.style.borderColor = '#E5E5E5';
                cancelBtn.style.color = '#1A1A1A';
            });

            const okBtn = document.createElement('button');
            okBtn.textContent = options.okText || 'OK';
            const okPadding = isSmallMobile ? '0.625rem 1.25rem' : isMobile ? '0.75rem 1.5rem' : '0.875rem 1.75rem';
            okBtn.style.cssText = `
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000000;
                border: 2px solid #FFD700;
                padding: ${okPadding};
                border-radius: 0.75rem;
                font-weight: 700;
                font-size: ${isSmallMobile ? '0.8125rem' : isMobile ? '0.875rem' : '0.95rem'};
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                width: ${isMobile ? '100%' : 'auto'};
                min-width: 0;
                word-wrap: break-word;
                white-space: normal;
                box-sizing: border-box;
            `;
            okBtn.addEventListener('mouseenter', () => {
                okBtn.style.background = 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)';
                okBtn.style.transform = 'translateY(-2px)';
                okBtn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            });
            okBtn.addEventListener('mouseleave', () => {
                okBtn.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
                okBtn.style.transform = 'translateY(0)';
                okBtn.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
            });

            // Assemble modal
            body.appendChild(input);
            modal.appendChild(header);
            modal.appendChild(body);
            footer.appendChild(cancelBtn);
            footer.appendChild(okBtn);
            modal.appendChild(footer);
            overlay.appendChild(modal);

            // Add to DOM
            document.body.appendChild(overlay);

            // Trigger animation
            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.transform = 'scale(1) translateY(0)';
            }, 10);

            // Focus input
            setTimeout(() => input.focus(), 100);

            // Handle Enter key
            const handleEnter = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    okBtn.click();
                }
            };
            input.addEventListener('keydown', handleEnter);

            // Handle Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Remove escape handler when modal closes
            const removeHandlers = () => {
                document.removeEventListener('keydown', handleEscape);
            };

            // OK button handler
            okBtn.addEventListener('click', () => {
                const value = input.value.trim();
                if (options.required && !value) {
                    input.style.borderColor = '#EF4444';
                    input.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                    setTimeout(() => {
                        input.style.borderColor = '#E5E5E5';
                        input.style.boxShadow = 'none';
                    }, 2000);
                    return;
                }
                removeHandlers();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9) translateY(20px)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
                resolve(value || null);
            });

            // Cancel button handler
            cancelBtn.addEventListener('click', () => {
                removeHandlers();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9) translateY(20px)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
                resolve(null);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    removeHandlers();
                    overlay.style.opacity = '0';
                    modal.style.transform = 'scale(0.9) translateY(20px)';
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                    }, 300);
                    resolve(null);
                }
            });
        });
    },

    // Multi-field form modal
    showForm(title, fields, options = {}) {
        return new Promise((resolve) => {
            // Detect screen size once at the top of the function
            const isMobile = window.innerWidth <= 768;
            const isSmallMobile = window.innerWidth <= 480;
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-prompt-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: ${isMobile ? 'flex-start' : 'center'};
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                padding: ${isMobile ? '0.5rem' : '1rem'};
                padding-top: ${isMobile ? '2rem' : '1rem'};
                overflow-y: auto;
                box-sizing: border-box;
            `;

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'custom-prompt-modal';
            modal.style.cssText = `
                background: #FFFFFF;
                border-radius: 1.25rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid transparent;
                background-image: linear-gradient(#FFFFFF, #FFFFFF),
                                  linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #8A2BE2 100%);
                background-origin: border-box;
                background-clip: padding-box, border-box;
            `;

            // Create header
            const header = document.createElement('div');
            const headerPadding = isSmallMobile ? '1rem 1.25rem' : isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem';
            const headerFontSize = isSmallMobile ? '1.125rem' : isMobile ? '1.25rem' : '1.5rem';
            header.style.cssText = `
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000000;
                padding: ${headerPadding};
                border-radius: 1.25rem 1.25rem 0 0;
                font-size: ${headerFontSize};
                font-weight: 700;
                position: relative;
                border-bottom: 3px solid rgba(138, 43, 226, 0.3);
                word-wrap: break-word;
                box-sizing: border-box;
            `;
            header.textContent = title;

            // Create body
            const body = document.createElement('div');
            const bodyPadding = isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2rem';
            body.style.cssText = `
                padding: ${bodyPadding};
                background: #FFFFFF;
                box-sizing: border-box;
                overflow-y: auto;
                max-height: ${isSmallMobile ? 'calc(95vh - 160px)' : isMobile ? 'calc(90vh - 180px)' : 'calc(90vh - 200px)'};
            `;

            // Store field elements
            const fieldElements = {};
            const fieldErrors = {};

            // Create form fields
            fields.forEach((field, index) => {
                const formGroup = document.createElement('div');
                formGroup.style.cssText = `
                    margin-bottom: 1.5rem;
                `;

                // Label
                const label = document.createElement('label');
                label.style.cssText = `
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #1A1A1A;
                    font-weight: 600;
                    font-size: 0.95rem;
                    letter-spacing: 0.3px;
                `;
                label.textContent = field.label;
                if (field.required) {
                    label.innerHTML += ' <span style="color: #EF4444;">*</span>';
                }
                formGroup.appendChild(label);

                let inputElement;

                // Create input based on type
                if (field.type === 'select' || field.type === 'dropdown') {
                    inputElement = document.createElement('select');
                    inputElement.style.cssText = `
                        width: 100%;
                        padding: 0.875rem 1.25rem;
                        border: 2px solid #E5E5E5;
                        border-radius: 0.75rem;
                        font-size: 0.95rem;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        background: #FFFFFF;
                        color: #1A1A1A;
                        font-family: inherit;
                        box-sizing: border-box;
                        cursor: pointer;
                    `;

                    // Add options
                    if (field.options && Array.isArray(field.options)) {
                        field.options.forEach(option => {
                            const optionEl = document.createElement('option');
                            if (typeof option === 'object') {
                                optionEl.value = option.value;
                                optionEl.textContent = option.label || option.value;
                                if (option.selected) optionEl.selected = true;
                            } else {
                                optionEl.value = option;
                                optionEl.textContent = option;
                            }
                            inputElement.appendChild(optionEl);
                        });
                    }

                    // Set default value (after options are added)
                    if (field.defaultValue !== undefined && field.defaultValue !== null) {
                        inputElement.value = String(field.defaultValue);
                    }
                } else if (field.type === 'file') {
                    // Show current image if available (for edit forms)
                    // Debug logging
                    console.log('File field - currentImage:', field.currentImage, 'Type:', typeof field.currentImage);
                    console.log('Field object:', field);
                    
                    // More robust check for currentImage
                    let hasCurrentImage = false;
                    if (field.currentImage !== null && field.currentImage !== undefined) {
                        if (typeof field.currentImage === 'string') {
                            hasCurrentImage = field.currentImage.trim() !== '';
                        } else {
                            hasCurrentImage = !!field.currentImage;
                        }
                    }
                    
                    console.log('hasCurrentImage:', hasCurrentImage);
                    console.log('Will show image preview:', hasCurrentImage);
                    if (hasCurrentImage) {
                        console.log('Creating image preview with image:', field.currentImage.substring(0, 50) + '...');
                        const imagePreview = document.createElement('div');
                        imagePreview.className = 'current-image-preview';
                        imagePreview.style.cssText = `
                            margin-bottom: 1rem;
                            text-align: center;
                            padding: 1rem;
                            background: #F9FAFB;
                            border-radius: 0.75rem;
                            border: 2px solid #E5E5E5;
                        `;
                        
                        const currentImage = document.createElement('img');
                        currentImage.src = field.currentImage;
                        currentImage.style.cssText = `
                            max-width: 200px;
                            max-height: 200px;
                            width: 200px;
                            height: 200px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 3px solid #FFD700;
                            margin-bottom: 0.75rem;
                            display: block;
                            margin-left: auto;
                            margin-right: auto;
                        `;
                        currentImage.onerror = function() {
                            // If image fails to load, hide the preview
                            imagePreview.style.display = 'none';
                        };
                        imagePreview.appendChild(currentImage);
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.textContent = 'Remove Image';
                        removeBtn.style.cssText = `
                            background: #EF4444;
                            color: #FFFFFF;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 0.5rem;
                            font-size: 0.875rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                        `;
                        removeBtn.addEventListener('mouseenter', () => {
                            removeBtn.style.background = '#DC2626';
                            removeBtn.style.transform = 'translateY(-2px)';
                        });
                        removeBtn.addEventListener('mouseleave', () => {
                            removeBtn.style.background = '#EF4444';
                            removeBtn.style.transform = 'translateY(0)';
                        });
                        
                        // Store reference to inputElement that will be created
                        const inputRef = { element: null };
                        
                        // Store remove flag in a data attribute
                        removeBtn.addEventListener('click', () => {
                            imagePreview.style.display = 'none';
                            if (inputRef.element) {
                                inputRef.element.dataset.removeImage = 'true';
                            }
                            removeBtn.textContent = 'Image will be removed';
                            removeBtn.style.background = '#999999';
                            removeBtn.disabled = true;
                        });
                        
                        imagePreview.appendChild(removeBtn);
                        formGroup.appendChild(imagePreview);
                        console.log('Image preview added to formGroup');
                        
                        // Create input element and store reference
                        inputElement = document.createElement('input');
                        inputElement.type = 'file';
                        inputElement.accept = field.accept || '*/*';
                        inputElement.style.cssText = `
                            width: 100%;
                            padding: 0.875rem 1.25rem;
                            border: 2px solid #E5E5E5;
                            border-radius: 0.75rem;
                            font-size: 0.95rem;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            background: #FFFFFF;
                            color: #1A1A1A;
                            font-family: inherit;
                            box-sizing: border-box;
                            cursor: pointer;
                        `;
                        inputRef.element = inputElement;
                    } else {
                        inputElement = document.createElement('input');
                        inputElement.type = 'file';
                        inputElement.accept = field.accept || '*/*';
                        inputElement.style.cssText = `
                            width: 100%;
                            padding: 0.875rem 1.25rem;
                            border: 2px solid #E5E5E5;
                            border-radius: 0.75rem;
                            font-size: 0.95rem;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            background: #FFFFFF;
                            color: #1A1A1A;
                            font-family: inherit;
                            box-sizing: border-box;
                            cursor: pointer;
                        `;
                    }
                    
                    const fileWrapper = document.createElement('div');
                    fileWrapper.style.cssText = `position: relative;`;
                    fileWrapper.appendChild(inputElement);
                    formGroup.appendChild(fileWrapper);

                    // Add helper text
                    if (field.helperText) {
                        const helper = document.createElement('small');
                        helper.style.cssText = `
                            display: block;
                            color: #999999;
                            font-size: 0.85rem;
                            margin-top: 0.5rem;
                        `;
                        helper.textContent = field.helperText;
                        formGroup.appendChild(helper);
                    }
                } else if (field.type === 'textarea') {
                    inputElement = document.createElement('textarea');
                    inputElement.rows = field.rows || 3;
                    inputElement.style.cssText = `
                        width: 100%;
                        padding: 0.875rem 1.25rem;
                        border: 2px solid #E5E5E5;
                        border-radius: 0.75rem;
                        font-size: 0.95rem;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        background: #FFFFFF;
                        color: #1A1A1A;
                        font-family: inherit;
                        box-sizing: border-box;
                        resize: vertical;
                    `;
                    if (field.defaultValue) {
                        inputElement.value = field.defaultValue;
                    }
                } else {
                    // Default to text input
                    inputElement = document.createElement('input');
                    inputElement.type = field.type || 'text';
                    inputElement.style.cssText = `
                        width: 100%;
                        padding: 0.875rem 1.25rem;
                        border: 2px solid #E5E5E5;
                        border-radius: 0.75rem;
                        font-size: 0.95rem;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        background: #FFFFFF;
                        color: #1A1A1A;
                        font-family: inherit;
                        box-sizing: border-box;
                    `;
                    if (field.placeholder) {
                        inputElement.placeholder = field.placeholder;
                    }
                    if (field.defaultValue) {
                        inputElement.value = field.defaultValue;
                    }
                    
                    // Handle readonly fields
                    if (field.readonly || field.readOnly) {
                        inputElement.readOnly = true;
                        inputElement.style.backgroundColor = '#F5F5F5';
                        inputElement.style.color = '#666666';
                        inputElement.style.cursor = 'not-allowed';
                        inputElement.style.borderColor = '#D0D0D0';
                    }
                }

                // Add focus/blur handlers (skip for readonly fields)
                if (!field.readonly && !field.readOnly) {
                    inputElement.addEventListener('focus', () => {
                        inputElement.style.borderColor = '#FFD700';
                        inputElement.style.boxShadow = '0 0 0 4px rgba(255, 215, 0, 0.1), 0 4px 12px rgba(255, 215, 0, 0.2)';
                        if (inputElement.type === 'text' || inputElement.tagName === 'TEXTAREA') {
                            inputElement.select();
                        }
                    });
                } else {
                    // For readonly fields, prevent focus styling
                    inputElement.addEventListener('focus', (e) => {
                        e.preventDefault();
                        inputElement.blur();
                    });
                }

                inputElement.addEventListener('blur', () => {
                    // Don't reset readonly field styling
                    if (!field.readonly && !field.readOnly) {
                        inputElement.style.borderColor = '#E5E5E5';
                        inputElement.style.boxShadow = 'none';
                    }
                });

                // Add Enter key handler (only for last field)
                if (index === fields.length - 1) {
                    inputElement.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                            e.preventDefault();
                            document.querySelector('.custom-prompt-ok-btn')?.click();
                        }
                    });
                }

                if (field.type !== 'file') {
                    formGroup.appendChild(inputElement);
                }

                // Error message placeholder
                const errorMsg = document.createElement('small');
                errorMsg.style.cssText = `
                    display: none;
                    color: #EF4444;
                    font-size: 0.85rem;
                    margin-top: 0.25rem;
                `;
                formGroup.appendChild(errorMsg);
                fieldErrors[field.name] = errorMsg;

                body.appendChild(formGroup);
                fieldElements[field.name] = inputElement;
            });

            // Create footer
            const footer = document.createElement('div');
            footer.style.cssText = `
                padding: ${isSmallMobile ? '1rem 1.25rem' : isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem'};
                background: linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%);
                border-top: 2px solid #E5E5E5;
                border-radius: 0 0 1.25rem 1.25rem;
                display: flex;
                flex-direction: ${isMobile ? 'column' : 'row'};
                gap: ${isSmallMobile ? '0.75rem' : '1rem'};
                justify-content: flex-end;
                flex-wrap: wrap;
                box-sizing: border-box;
            `;

            // Create buttons
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = options.cancelText || 'Cancel';
            cancelBtn.className = 'custom-prompt-cancel-btn';
            const cancelPadding = isSmallMobile ? '0.625rem 1.25rem' : isMobile ? '0.75rem 1.5rem' : '0.875rem 1.75rem';
            cancelBtn.style.cssText = `
                background: #FFFFFF;
                color: #1A1A1A;
                border: 2px solid #E5E5E5;
                padding: ${cancelPadding};
                border-radius: 0.75rem;
                font-weight: 600;
                font-size: ${isSmallMobile ? '0.8125rem' : isMobile ? '0.875rem' : '0.95rem'};
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                width: ${isMobile ? '100%' : 'auto'};
                min-width: 0;
                word-wrap: break-word;
                white-space: normal;
                box-sizing: border-box;
            `;
            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = '#FAFBFC';
                cancelBtn.style.borderColor = '#FFD700';
                cancelBtn.style.color = '#000000';
            });
            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = '#FFFFFF';
                cancelBtn.style.borderColor = '#E5E5E5';
                cancelBtn.style.color = '#1A1A1A';
            });

            const okBtn = document.createElement('button');
            okBtn.textContent = options.okText || 'OK';
            okBtn.className = 'custom-prompt-ok-btn';
            const okPadding = isSmallMobile ? '0.625rem 1.25rem' : isMobile ? '0.75rem 1.5rem' : '0.875rem 1.75rem';
            okBtn.style.cssText = `
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000000;
                border: 2px solid #FFD700;
                padding: ${okPadding};
                border-radius: 0.75rem;
                font-weight: 700;
                font-size: ${isSmallMobile ? '0.8125rem' : isMobile ? '0.875rem' : '0.95rem'};
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                width: ${isMobile ? '100%' : 'auto'};
                min-width: 0;
                word-wrap: break-word;
                white-space: normal;
                box-sizing: border-box;
            `;
            okBtn.addEventListener('mouseenter', () => {
                okBtn.style.background = 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)';
                okBtn.style.transform = 'translateY(-2px)';
                okBtn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            });
            okBtn.addEventListener('mouseleave', () => {
                okBtn.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
                okBtn.style.transform = 'translateY(0)';
                okBtn.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
            });

            // Assemble modal
            modal.appendChild(header);
            modal.appendChild(body);
            footer.appendChild(cancelBtn);
            footer.appendChild(okBtn);
            modal.appendChild(footer);
            overlay.appendChild(modal);

            // Add to DOM
            document.body.appendChild(overlay);

            // Trigger animation
            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.transform = 'scale(1) translateY(0)';
            }, 10);

            // Focus first field
            setTimeout(() => {
                const firstField = fields[0];
                if (firstField && fieldElements[firstField.name]) {
                    fieldElements[firstField.name].focus();
                }
            }, 100);

            // Handle Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Remove escape handler when modal closes
            const removeHandlers = () => {
                document.removeEventListener('keydown', handleEscape);
            };

            // Validation function
            const validate = () => {
                let isValid = true;
                fields.forEach(field => {
                    const element = fieldElements[field.name];
                    const errorEl = fieldErrors[field.name];
                    let value;

                    if (field.type === 'file') {
                        value = element.files.length > 0 ? element.files[0] : null;
                    } else {
                        value = element.value.trim();
                    }

                    // Skip validation for readonly fields
                    if (field.readonly || field.readOnly) {
                        element.style.borderColor = '#D0D0D0';
                        errorEl.style.display = 'none';
                    } else if (field.required && !value && field.type !== 'file') {
                        isValid = false;
                        element.style.borderColor = '#EF4444';
                        element.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                        errorEl.textContent = `${field.label} is required`;
                        errorEl.style.display = 'block';
                        setTimeout(() => {
                            element.style.borderColor = '#E5E5E5';
                            element.style.boxShadow = 'none';
                            errorEl.style.display = 'none';
                        }, 3000);
                    } else {
                        element.style.borderColor = '#E5E5E5';
                        errorEl.style.display = 'none';
                    }
                });
                return isValid;
            };

            // OK button handler
            okBtn.addEventListener('click', () => {
                if (!validate()) {
                    return;
                }

                const result = {};
                fields.forEach(field => {
                    const element = fieldElements[field.name];
                    if (field.type === 'file') {
                        // Check if remove image was clicked
                        if (element.dataset.removeImage === 'true') {
                            result[field.name] = 'REMOVE'; // Special flag to indicate removal
                        } else {
                            result[field.name] = element.files.length > 0 ? element.files[0] : null;
                        }
                    } else {
                        result[field.name] = element.value;
                    }
                });

                removeHandlers();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9) translateY(20px)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
                resolve(result);
            });

            // Cancel button handler
            cancelBtn.addEventListener('click', () => {
                removeHandlers();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9) translateY(20px)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 300);
                resolve(null);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    removeHandlers();
                    overlay.style.opacity = '0';
                    modal.style.transform = 'scale(0.9) translateY(20px)';
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                    }, 300);
                    resolve(null);
                }
            });

            // Scrollbar styling
            const style = document.createElement('style');
            style.textContent = `
                .custom-prompt-modal::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-prompt-modal::-webkit-scrollbar-track {
                    background: #F5F5F5;
                    border-radius: 4px;
                }
                .custom-prompt-modal::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    border-radius: 4px;
                }
                .custom-prompt-modal::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%);
                }
            `;
            document.head.appendChild(style);
        });
    }
};

// Replace window.prompt globally
window.prompt = function(message, defaultValue = '') {
    return CustomPrompt.show(message, defaultValue, {
        title: 'Input',
        required: false
    });
};

