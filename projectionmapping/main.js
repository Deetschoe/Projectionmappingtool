// Main application logic
class ProjectionMappingApp {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.shapes = [];
        this.selectedShape = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.tool = 'select'; // select, scale, hand, zoom, pen
        this.scaleStart = { x: 0, y: 0, width: 0, height: 0, radius: 0, centerX: 0, centerY: 0 };
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        
        // Pen tool state
        this.isDrawing = false;
        this.currentPath = [];
        this.dragHandle = null; // For corner handles
        this.penWidth = 5;
        
        // Undo/Redo system
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // Layer dragging
        this.isDraggingLayer = false;
        this.draggedLayerElement = null;
        this.dragLayerTarget = null;
        
        this.projectorWindow = null;
        this.wallImage = null;
        this.youtubeVideo = null;
        
        this.keybinds = new Map(); // key -> shape mapping
        this.audioMode = false;
        this.audioReactTo = 'color'; // color, opacity, size, rotation, flow
        this.audioColorMode = 'rainbow'; // rainbow, custom, preset1, preset2, preset3
        this.audioCustomColor = '#ff0000';
        this.darkMode = true; // Default to dark mode
        this.copiedShape = null; // Store copied shape for paste
        
        this.init();
    }
    
    init() {
        // Set dark mode as default
        document.body.classList.add('dark-mode');
        this.darkMode = true;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.saveState(); // Save initial state
        this.updateUndoRedoButtons(); // Initialize button states
        this.animate();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const resizeCanvas = () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.draw();
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        // Projector window - attach immediately
        const projectorBtn = document.getElementById('openProjectorBtn');
        if (projectorBtn) {
            projectorBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Projector button clicked');
                this.openProjectorWindow();
            };
            console.log('Projector button attached');
        } else {
            console.error('Projector button not found!');
        }
        
        // Shape creation buttons - attach immediately
        const addRectBtn = document.getElementById('addRectBtn');
        if (addRectBtn) {
            addRectBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Add rectangle clicked');
                this.addShape('rectangle');
                this.tool = 'select';
                this.updateToolButtons();
            };
            console.log('Add rectangle button attached');
        }
        
        const addCircleBtn = document.getElementById('addCircleBtn');
        if (addCircleBtn) {
            addCircleBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Add circle clicked');
                this.addShape('circle');
                this.tool = 'select';
                this.updateToolButtons();
            };
            console.log('Add circle button attached');
        }
        
        const addPolygonBtn = document.getElementById('addPolygonBtn');
        if (addPolygonBtn) {
            addPolygonBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Add polygon clicked');
                this.addShape('polygon');
                this.tool = 'select';
                this.updateToolButtons();
            };
            console.log('Add polygon button attached');
        }
        
        const addImageBtn = document.getElementById('addImageBtn');
        if (addImageBtn) {
            addImageBtn.onclick = (e) => {
                e.preventDefault();
                const dialog = document.getElementById('imageDialog');
                if (dialog) {
                    dialog.style.display = 'block';
                }
            };
        }
        
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        const imageFileInput = document.getElementById('imageFileInput');
        if (uploadImageBtn && imageFileInput) {
            uploadImageBtn.onclick = (e) => {
                e.preventDefault();
                imageFileInput.click();
            };
            
            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    // If an image shape is selected, replace it; otherwise add new image
                    if (this.selectedShape && this.selectedShape.type === 'image') {
                        this.replaceImageInShape(file);
                    } else {
                        this.loadImageFile(file);
                    }
                    const dialog = document.getElementById('imageDialog');
                    if (dialog) {
                        dialog.style.display = 'none';
                    }
                }
                e.target.value = ''; // Reset input
            });
        }
        
        const searchImageBtn = document.getElementById('searchImageBtn');
        if (searchImageBtn) {
            searchImageBtn.onclick = (e) => {
                e.preventDefault();
                // Open Unsplash in new tab for stock images
                window.open('https://unsplash.com/s/photos/free', '_blank');
            };
        }
        
        const cancelImageBtn = document.getElementById('cancelImageBtn');
        if (cancelImageBtn) {
            cancelImageBtn.onclick = (e) => {
                e.preventDefault();
                const dialog = document.getElementById('imageDialog');
                if (dialog) {
                    dialog.style.display = 'none';
                }
            };
        }
        
        // Handle paste events for images - use window for better capture
        const handlePaste = (e) => {
            // Don't interfere if user is typing in an input field
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            
            // Check if clipboard has image data
            const clipboardData = e.clipboardData || (window.clipboardData && window.clipboardData);
            if (!clipboardData) {
                return;
            }
            
            // Try items first (standard way)
            if (clipboardData.items && clipboardData.items.length > 0) {
                for (let i = 0; i < clipboardData.items.length; i++) {
                    const item = clipboardData.items[i];
                    if (item.type && item.type.indexOf('image') !== -1) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const file = item.getAsFile();
                        if (file && (file.type && file.type.startsWith('image/')) || file.name?.toLowerCase().endsWith('.gif')) {
                            console.log('Pasting image (items):', file.type, file.size);
                            // If an image shape is selected, replace it; otherwise add new image
                            if (this.selectedShape && this.selectedShape.type === 'image') {
                                this.replaceImageInShape(file);
                            } else {
                                this.loadImageFile(file);
                            }
                            const dialog = document.getElementById('imageDialog');
                            if (dialog) {
                                dialog.style.display = 'none';
                            }
                            return;
                        }
                    }
                }
            }
            
            // Try files as fallback
            if (clipboardData.files && clipboardData.files.length > 0) {
                for (let i = 0; i < clipboardData.files.length; i++) {
                    const file = clipboardData.files[i];
                    if ((file.type && file.type.indexOf('image') !== -1) || file.name?.toLowerCase().endsWith('.gif')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Pasting image (files):', file.type, file.size);
                        // If an image shape is selected, replace it; otherwise add new image
                        if (this.selectedShape && this.selectedShape.type === 'image') {
                            this.replaceImageInShape(file);
                        } else {
                            this.loadImageFile(file);
                        }
                        const dialog = document.getElementById('imageDialog');
                        if (dialog) {
                            dialog.style.display = 'none';
                        }
                        return;
                    }
                }
            }
        };
        
        // Add paste listener to window for better capture
        window.addEventListener('paste', handlePaste.bind(this));
        
        // Also listen on document and canvas
        document.addEventListener('paste', handlePaste.bind(this));
        
        if (this.canvas) {
            this.canvas.addEventListener('paste', handlePaste.bind(this));
        }
        
        const penToolBtn = document.getElementById('penToolBtn');
        if (penToolBtn) {
            penToolBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Pen tool clicked');
                this.tool = 'pen';
                this.canvas.style.cursor = 'crosshair';
                this.updateToolButtons();
            };
            console.log('Pen tool button attached');
        }
        
        // Update tool button active states
        this.updateToolButtons = () => {
            document.querySelectorAll('.btn-tool').forEach(btn => btn.classList.remove('active'));
            const selectToolBtn = document.getElementById('selectToolBtn');
            const scaleToolBtn = document.getElementById('scaleToolBtn');
            if (this.tool === 'select') {
                selectToolBtn?.classList.add('active');
            } else if (this.tool === 'scale') {
                scaleToolBtn?.classList.add('active');
            } else if (this.tool === 'pen') {
                penToolBtn?.classList.add('active');
            }
        };
        
        // YouTube functionality removed - no longer needed
        
        // Dark mode toggle removed - dark mode is now default
        
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.onclick = (e) => {
                e.preventDefault();
                this.undo();
            };
        }
        
        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) {
            redoBtn.onclick = (e) => {
                e.preventDefault();
                this.redo();
            };
        }
        
        const saveProjectBtn = document.getElementById('saveProjectBtn');
        if (saveProjectBtn) {
            saveProjectBtn.onclick = (e) => {
                e.preventDefault();
                this.saveProject();
            };
        }
        
        const loadProjectBtn = document.getElementById('loadProjectBtn');
        const loadProjectInput = document.getElementById('loadProjectInput');
        if (loadProjectBtn && loadProjectInput) {
            loadProjectBtn.onclick = (e) => {
                e.preventDefault();
                loadProjectInput.click();
            };
            
            loadProjectInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const projectData = JSON.parse(event.target.result);
                            this.loadProject(projectData);
                        } catch (error) {
                            alert('Error loading project file: ' + error.message);
                            console.error('Error loading project:', error);
                        }
                    };
                    reader.readAsText(file);
                    // Reset input so the same file can be loaded again
                    e.target.value = '';
                }
            });
        }
        
        // Canvas interactions
        if (this.canvas) {
            // Make canvas focusable for paste events
            this.canvas.setAttribute('tabindex', '0');
            this.canvas.style.outline = 'none';
            
            // Focus canvas on click to enable paste
            this.canvas.addEventListener('click', () => {
                this.canvas.focus();
            });
            
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        }
        
        // Shape properties
        const keybindInput = document.getElementById('keybindInput');
        if (keybindInput) {
            keybindInput.addEventListener('keydown', (e) => this.setKeybind(e));
        }
        const effectSelect = document.getElementById('effectSelect');
        if (effectSelect) {
            effectSelect.addEventListener('change', (e) => this.updateShapeEffect(e.target.value));
        }
        const colorInput = document.getElementById('colorInput');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => this.updateShapeColor(e.target.value));
        }
        const opacityInput = document.getElementById('opacityInput');
        if (opacityInput) {
            opacityInput.addEventListener('input', (e) => {
                const opacityValue = document.getElementById('opacityValue');
                if (opacityValue) {
                    opacityValue.textContent = e.target.value + '%';
                }
                this.updateShapeOpacity(e.target.value / 100);
            });
            opacityInput.addEventListener('mouseup', () => {
                this.saveState();
            });
        }
        
        const strokeColorInput = document.getElementById('strokeColorInput');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', (e) => {
                this.updateShapeStrokeColor(e.target.value);
            });
        }
        
        const strokeWidthInput = document.getElementById('strokeWidthInput');
        if (strokeWidthInput) {
            strokeWidthInput.addEventListener('input', (e) => {
                const strokeWidthValue = document.getElementById('strokeWidthValue');
                if (strokeWidthValue) {
                    strokeWidthValue.textContent = e.target.value;
                }
                this.updateShapeStrokeWidth(parseInt(e.target.value));
            });
            strokeWidthInput.addEventListener('mouseup', () => {
                this.saveState();
            });
        }
        
        const blendModeSelect = document.getElementById('blendModeSelect');
        if (blendModeSelect) {
            blendModeSelect.addEventListener('change', (e) => {
                this.updateShapeBlendMode(e.target.value);
            });
        }
        
        const penWidthInput = document.getElementById('penWidthInput');
        if (penWidthInput) {
            penWidthInput.addEventListener('input', (e) => {
                this.penWidth = parseInt(e.target.value);
                const penWidthValue = document.getElementById('penWidthValue');
                if (penWidthValue) {
                    penWidthValue.textContent = e.target.value;
                }
            });
        }
        
        // Audio mode
        const audioToggle = document.getElementById('audioModeToggle');
        const audioControls = document.getElementById('audioControls');
        if (audioToggle && audioControls) {
            audioToggle.addEventListener('change', (e) => {
                this.audioMode = e.target.checked;
                audioControls.style.display = this.audioMode ? 'block' : 'none';
                if (this.audioMode) {
                    window.audioAnalyzer?.start();
                } else {
                    window.audioAnalyzer?.stop();
                }
            });
        }
        
        const audioReactTo = document.getElementById('audioReactTo');
        const audioColorOptions = document.getElementById('audioColorOptions');
        if (audioReactTo) {
            audioReactTo.addEventListener('change', (e) => {
                this.audioReactTo = e.target.value;
                // Show/hide color options based on selection
                if (audioColorOptions) {
                    audioColorOptions.style.display = e.target.value === 'color' ? 'block' : 'none';
                }
            });
        }
        
        const audioColorMode = document.getElementById('audioColorMode');
        const audioCustomColorLabel = document.getElementById('audioCustomColorLabel');
        const audioCustomColor = document.getElementById('audioCustomColor');
        if (audioColorMode) {
            audioColorMode.addEventListener('change', (e) => {
                this.audioColorMode = e.target.value;
                if (audioCustomColorLabel) {
                    audioCustomColorLabel.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
        }
        
        if (audioCustomColor) {
            audioCustomColor.addEventListener('change', (e) => {
                this.audioCustomColor = e.target.value;
            });
        }
        
        // Initialize color options visibility
        if (audioColorOptions) {
            audioColorOptions.style.display = this.audioReactTo === 'color' ? 'block' : 'none';
        }
        
        // Audio reactive toggle for individual shapes
        const audioReactiveToggle = document.getElementById('audioReactiveToggle');
        if (audioReactiveToggle) {
            audioReactiveToggle.addEventListener('change', (e) => {
                if (this.selectedShape) {
                    this.selectedShape.audioReactive = e.target.checked;
                    // Reset audio original dimensions if disabling
                    if (!e.target.checked) {
                        delete this.selectedShape.audioOriginalWidth;
                        delete this.selectedShape.audioOriginalHeight;
                        delete this.selectedShape.audioOriginalRadius;
                        delete this.selectedShape.audioOriginalX;
                        delete this.selectedShape.audioOriginalY;
                    }
                    this.saveState();
                }
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with input fields
            if (e.target.matches('input, textarea, select')) {
                return;
            }
            
            // Tool selection (After Effects style)
            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                this.tool = 'select';
                this.canvas.style.cursor = 'default';
                this.updateToolButtons();
                console.log('Tool: Select');
            } else if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                this.tool = 'hand';
                this.canvas.style.cursor = 'grab';
                this.updateToolButtons();
                console.log('Tool: Hand (Pan)');
            } else if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                this.tool = 'zoom';
                this.canvas.style.cursor = 'zoom-in';
                this.updateToolButtons();
                console.log('Tool: Zoom');
            } else if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.tool = 'pen';
                this.canvas.style.cursor = 'crosshair';
                this.updateToolButtons();
                console.log('Tool: Pen');
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                this.tool = 'scale';
                this.canvas.style.cursor = 'nwse-resize';
                this.updateToolButtons();
                console.log('Tool: Scale');
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                // Space for pan (hold space + drag)
                e.preventDefault();
                this.tool = 'hand';
                this.updateToolButtons();
            }
            
            // Undo/Redo
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
                return;
            }
            
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
                return;
            }
            
            // Copy (Ctrl+C or Cmd+C)
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                if (this.selectedShape) {
                    e.preventDefault();
                    this.copyShape(this.selectedShape);
                }
                return;
            }
            
            // Paste (Ctrl+V or Cmd+V)
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                if (this.copiedShape) {
                    e.preventDefault();
                    this.pasteShape();
                }
                return;
            }
            
            // Delete key
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedShape && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.deleteShape(this.selectedShape);
                }
                return;
            }
            
            // Check for shape keybinds
            if (this.keybinds.has(e.key.toLowerCase())) {
                const shape = this.keybinds.get(e.key.toLowerCase());
                this.triggerShapeEffect(shape);
            }
        });
        
        // Release space to return to previous tool
        document.addEventListener('keyup', (e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
                if (this.tool === 'hand') {
                    this.tool = 'select';
                }
            }
        });
    }
    
    openProjectorWindow() {
        console.log('Opening projector window...');
        
        if (this.projectorWindow && !this.projectorWindow.closed) {
            console.log('Projector window already open, focusing...');
            this.projectorWindow.focus();
            this.updateProjector(); // Update immediately
            return;
        }
        
        // Open window - must be called directly from user action
        this.projectorWindow = window.open(
            'projector.html',
            'projector',
            'width=1920,height=1080,resizable=yes,scrollbars=no'
        );
        
        if (!this.projectorWindow) {
            alert('Pop-up blocked! Please allow pop-ups for this site to open the projector window.\n\nIn Chrome: Click the pop-up blocked icon in the address bar and select "Always allow pop-ups"');
            console.error('Window.open() returned null - pop-up blocked');
            return;
        }
        
        console.log('Projector window opened, waiting for it to load...');
        
        // Wait for window to load, then start updating
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkReady = setInterval(() => {
            attempts++;
            
            if (attempts > maxAttempts) {
                console.error('Projector window did not become ready in time');
                clearInterval(checkReady);
                return;
            }
            
            if (this.projectorWindow && !this.projectorWindow.closed) {
                try {
                    // Check if window is ready by trying to access its document
                    if (this.projectorWindow.document && this.projectorWindow.document.readyState === 'complete') {
                        console.log('Projector window ready! Starting updates...');
                        clearInterval(checkReady);
                        
                        // Send initial update immediately
                        setTimeout(() => {
                            this.updateProjector();
                            console.log('Initial projector update sent');
                        }, 100);
                        
                        // The animate loop will handle continuous updates
                    }
                } catch (e) {
                    // Cross-origin or not ready yet - this is normal
                    if (attempts % 10 === 0) {
                        console.log('Waiting for projector window to be ready...', attempts);
                    }
                }
            } else {
                console.log('Projector window was closed');
                clearInterval(checkReady);
            }
        }, 100);
    }
    
    addShape(type) {
        console.log('Adding shape:', type);
        const centerX = (this.canvas.width || 800) / 2;
        const centerY = (this.canvas.height || 600) / 2;
        
        let shape;
        switch (type) {
            case 'rectangle':
                shape = {
                    id: Date.now(),
                    type: 'rectangle',
                    x: centerX - 100,
                    y: centerY - 75,
                    width: 200,
                    height: 150,
                    corners: [
                        { x: centerX - 100, y: centerY - 75 }, // top-left
                        { x: centerX + 100, y: centerY - 75 }, // top-right
                        { x: centerX + 100, y: centerY + 75 }, // bottom-right
                        { x: centerX - 100, y: centerY + 75 }  // bottom-left
                    ],
                    color: '#ffb6c1',
                    strokeColor: '#000000',
                    strokeWidth: 0,
                    opacity: 1,
                    effect: 'hide',
                    keybind: null,
                    visible: true,
                    pulsePhase: 0,
                    flowOffset: 0,
                    audioReactive: false // Enable audio reactivity per shape
                };
                break;
            case 'circle':
                shape = {
                    id: Date.now(),
                    type: 'circle',
                    x: centerX,
                    y: centerY,
                    radius: 75,
                    color: '#add8e6',
                    strokeColor: '#000000',
                    strokeWidth: 0,
                    opacity: 1,
                    effect: 'hide',
                    keybind: null,
                    visible: true,
                    pulsePhase: 0,
                    flowOffset: 0,
                    audioReactive: false // Enable audio reactivity per shape
                };
                break;
            case 'polygon':
                shape = {
                    id: Date.now(),
                    type: 'polygon',
                    x: centerX,
                    y: centerY,
                    radius: 75,
                    sides: 6,
                    color: '#ffdab9',
                    strokeColor: '#000000',
                    strokeWidth: 0,
                    opacity: 1,
                    effect: 'hide',
                    keybind: null,
                    visible: true,
                    pulsePhase: 0,
                    flowOffset: 0,
                    audioReactive: false // Enable audio reactivity per shape
                };
                break;
            case 'path':
                shape = {
                    id: Date.now(),
                    type: 'path',
                    points: [],
                    color: '#ffb6c1',
                    strokeColor: '#000000',
                    strokeWidth: 5,
                    opacity: 1,
                    effect: 'hide',
                    keybind: null,
                    visible: true,
                    pulsePhase: 0,
                    flowOffset: 0,
                    audioReactive: false // Enable audio reactivity per shape
                };
                break;
            default:
                return null;
        }
        
        if (shape) {
            this.shapes.push(shape);
            this.selectedShape = shape;
            this.updateShapesList();
            this.updateShapeProperties();
            this.draw();
            this.updateProjector();
            this.saveState();
            console.log('Shape added, total shapes:', this.shapes.length);
        }
        
        return shape;
    }
    
    loadImageFile(file) {
        // Accept image files including GIFs
        const isValidImage = file && (
            file.type.startsWith('image/') || 
            (file.name && file.name.toLowerCase().match(/\.(gif|jpg|jpeg|png|webp|bmp|svg)$/i))
        );
        
        if (!isValidImage) {
            console.error('Invalid image file:', file);
            alert('Please paste or upload a valid image file (including GIFs).');
            return;
        }
        
        console.log('Loading image file:', file.name || 'pasted image', file.type, file.size);
        const reader = new FileReader();
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading image file. Please try again.');
        };
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                alert('Error loading image. Please try a different image.');
            };
            img.onload = () => {
                console.log('Image loaded successfully:', img.width, 'x', img.height, file.type);
                // Store file type to detect GIFs
                const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
                this.addImageShape(img, e.target.result, isGif);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    replaceImageInShape(file) {
        if (!this.selectedShape || this.selectedShape.type !== 'image') {
            console.error('No image shape selected');
            return;
        }
        
        // Accept image files including GIFs
        const isValidImage = file && (
            file.type.startsWith('image/') || 
            (file.name && file.name.toLowerCase().match(/\.(gif|jpg|jpeg|png|webp|bmp|svg)$/i))
        );
        
        if (!isValidImage) {
            console.error('Invalid image file:', file);
            alert('Please paste or upload a valid image file (including GIFs).');
            return;
        }
        
        console.log('Replacing image in shape:', file.name || 'pasted image', file.type, file.size);
        const reader = new FileReader();
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading image file. Please try again.');
        };
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                alert('Error loading image. Please try a different image.');
            };
            img.onload = () => {
                console.log('Image replaced successfully:', img.width, 'x', img.height, file.type);
                // Replace the image data and image object
                this.selectedShape.imageData = e.target.result;
                this.selectedShape.image = img;
                // Detect if it's a GIF
                const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
                this.selectedShape.isGif = isGif;
                
                // If it became a GIF or was a GIF, update overlay
                if (isGif) {
                    this.createGifOverlay(this.selectedShape);
                } else if (this.selectedShape.gifElement) {
                    // Remove overlay if it's no longer a GIF
                    this.selectedShape.gifElement.remove();
                    this.selectedShape.gifElement = null;
                }
                
                // Clear cached image in projector (if it exists)
                delete this.selectedShape._image;
                
                // Optionally adjust size to maintain aspect ratio or keep current size
                // For now, keep the current dimensions
                // If you want to resize to fit new image, uncomment below:
                /*
                const currentWidth = this.selectedShape.width;
                const currentHeight = this.selectedShape.height;
                const aspectRatio = img.width / img.height;
                if (currentWidth / currentHeight > aspectRatio) {
                    this.selectedShape.height = currentWidth / aspectRatio;
                } else {
                    this.selectedShape.width = currentHeight * aspectRatio;
                }
                */
                
                // Update corners if they exist
                if (this.selectedShape.corners && this.selectedShape.corners.length === 4) {
                    const cx = this.selectedShape.x + this.selectedShape.width / 2;
                    const cy = this.selectedShape.y + this.selectedShape.height / 2;
                    this.selectedShape.corners[0] = { x: this.selectedShape.x, y: this.selectedShape.y };
                    this.selectedShape.corners[1] = { x: this.selectedShape.x + this.selectedShape.width, y: this.selectedShape.y };
                    this.selectedShape.corners[2] = { x: this.selectedShape.x + this.selectedShape.width, y: this.selectedShape.y + this.selectedShape.height };
                    this.selectedShape.corners[3] = { x: this.selectedShape.x, y: this.selectedShape.y + this.selectedShape.height };
                }
                
                this.draw();
                this.updateProjector();
                this.saveState();
                console.log('Image shape replaced');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    addImageShape(img, imageData, isGif = false) {
        const centerX = (this.canvas.width || 800) / 2;
        const centerY = (this.canvas.height || 600) / 2;
        
        // Calculate dimensions maintaining aspect ratio, max 400px width
        let width = Math.min(img.width, 400);
        let height = (img.height / img.width) * width;
        
        const shape = {
            id: Date.now(),
            type: 'image',
            x: centerX - width / 2,
            y: centerY - height / 2,
            width: width,
            height: height,
            imageData: imageData, // Base64 data URL (GIFs will animate)
            image: img, // Image object (GIFs will animate automatically in canvas)
            isGif: isGif, // Flag to indicate if this is a GIF
            corners: [
                { x: centerX - width / 2, y: centerY - height / 2 }, // top-left
                { x: centerX + width / 2, y: centerY - height / 2 }, // top-right
                { x: centerX + width / 2, y: centerY + height / 2 }, // bottom-right
                { x: centerX - width / 2, y: centerY + height / 2 }  // bottom-left
            ],
            color: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 0,
            opacity: 1,
            effect: 'hide',
            keybind: null,
            visible: true,
            pulsePhase: 0,
            flowOffset: 0,
            audioReactive: false,
            blendMode: 'normal', // Blend mode for images/GIFs (normal, screen, multiply, etc.)
            gifElement: null // For GIF overlay element
        };
                
                this.shapes.push(shape);
        this.selectedShape = shape;
        this.updateShapesList();
        this.updateShapeProperties();
        this.draw();
        this.updateProjector();
        this.saveState();
        console.log('Image shape added', isGif ? '(GIF)' : '');
        
        // If it's a GIF, create overlay element for animation
        if (isGif) {
            this.createGifOverlay(shape);
        }
    }
    
    createGifOverlay(shape) {
        const container = document.getElementById('gifOverlayContainer');
        if (!container) return;
        
        // Remove old overlay if exists
        if (shape.gifElement) {
            shape.gifElement.remove();
        }
        
        const img = document.createElement('img');
        img.src = shape.imageData;
        img.style.position = 'absolute';
        img.style.pointerEvents = 'none';
        img.style.opacity = shape.opacity || 1;
        img.style.left = '0px';
        img.style.top = '0px';
        img.style.width = shape.width + 'px';
        img.style.height = shape.height + 'px';
        img.style.objectFit = 'fill';
        img.style.display = shape.visible ? 'block' : 'none';
        img.style.zIndex = '10';
        
        container.appendChild(img);
        shape.gifElement = img;
        
        // Update position when shape moves
        this.updateGifOverlay(shape);
    }
    
    updateGifOverlay(shape) {
        if (!shape.gifElement || !shape.isGif) return;
        
        const container = document.getElementById('gifOverlayContainer');
        if (!container) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position accounting for zoom and pan
        let x, y, width, height;
        
        if (shape.corners && shape.corners.length === 4) {
            // For warped GIFs, calculate bounding box
            const minX = Math.min(shape.corners[0].x, shape.corners[1].x, shape.corners[2].x, shape.corners[3].x);
            const minY = Math.min(shape.corners[0].y, shape.corners[1].y, shape.corners[2].y, shape.corners[3].y);
            const maxX = Math.max(shape.corners[0].x, shape.corners[1].x, shape.corners[2].x, shape.corners[3].x);
            const maxY = Math.max(shape.corners[0].y, shape.corners[1].y, shape.corners[2].y, shape.corners[3].y);
            
            x = (minX + this.pan.x) * this.zoom;
            y = (minY + this.pan.y) * this.zoom;
            width = (maxX - minX) * this.zoom;
            height = (maxY - minY) * this.zoom;
        } else {
            x = (shape.x + this.pan.x) * this.zoom;
            y = (shape.y + this.pan.y) * this.zoom;
            width = shape.width * this.zoom;
            height = shape.height * this.zoom;
        }
        
        shape.gifElement.style.left = x + 'px';
        shape.gifElement.style.top = y + 'px';
        shape.gifElement.style.width = width + 'px';
        shape.gifElement.style.height = height + 'px';
        shape.gifElement.style.opacity = shape.opacity || 1;
        shape.gifElement.style.display = shape.visible ? 'block' : 'none';
        // Apply blend mode for GIF overlay
        if (shape.blendMode && shape.blendMode !== 'normal') {
            shape.gifElement.style.mixBlendMode = shape.blendMode;
        } else {
            shape.gifElement.style.mixBlendMode = 'normal';
        }
    }
    
    updateAllGifOverlays() {
        this.shapes.forEach(shape => {
            if (shape.isGif && shape.gifElement) {
                this.updateGifOverlay(shape);
            }
        });
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom - this.pan.x;
        const y = (e.clientY - rect.top) / this.zoom - this.pan.y;
        
        if (this.tool === 'hand') {
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.panStart = { ...this.pan };
            return;
        }
        
        if (this.tool === 'scale' && this.selectedShape) {
            // Start scaling
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            // Store original dimensions
            const shape = this.selectedShape;
            this.scaleStart = {
                x: shape.x || 0,
                y: shape.y || 0,
                width: shape.width || (shape.radius ? shape.radius * 2 : 100),
                height: shape.height || (shape.radius ? shape.radius * 2 : 100),
                radius: shape.radius || null,
                centerX: shape.x + (shape.width || shape.radius || 0) / 2,
                centerY: shape.y + (shape.height || shape.radius || 0) / 2
            };
            // Calculate center for shapes with corners
            if (shape.corners && shape.corners.length > 0) {
                this.scaleStart.centerX = shape.corners.reduce((sum, c) => sum + c.x, 0) / shape.corners.length;
                this.scaleStart.centerY = shape.corners.reduce((sum, c) => sum + c.y, 0) / shape.corners.length;
            }
            return;
        }
        
        if (this.tool === 'pen') {
            // Start drawing a path
            this.isDrawing = true;
            const pathShape = {
                id: Date.now(),
                type: 'path',
                points: [{ x, y }],
                color: '#ffb6c1',
                strokeColor: '#000000',
                strokeWidth: this.penWidth,
                opacity: 1,
                effect: 'hide',
                keybind: null,
                visible: true,
                pulsePhase: 0,
                flowOffset: 0
            };
            this.shapes.push(pathShape);
            this.selectedShape = pathShape;
            this.currentPath = pathShape;
            this.updateShapesList();
            this.updateShapeProperties();
            return;
        }
        
        // Check for corner handle
        if (this.selectedShape && this.tool === 'select') {
            const cornerIndex = this.getCornerHandle(x, y);
            if (cornerIndex !== null) {
                this.dragHandle = cornerIndex;
                this.isDragging = true;
                return;
            }
        }
        
        // Check if clicking on a shape
        const clickedShape = this.getShapeAt(x, y);
        if (clickedShape) {
            this.selectedShape = clickedShape;
            this.updateShapeProperties();
            this.updateShapesList();
            
            if (this.tool === 'select') {
                this.isDragging = true;
                if (clickedShape.corners) {
                    // Calculate center of corners for offset
                    const centerX = clickedShape.corners.reduce((sum, c) => sum + c.x, 0) / clickedShape.corners.length;
                    const centerY = clickedShape.corners.reduce((sum, c) => sum + c.y, 0) / clickedShape.corners.length;
                    this.dragOffset = { x: x - centerX, y: y - centerY };
                } else {
                    this.dragOffset = {
                        x: x - (clickedShape.x || 0),
                        y: y - (clickedShape.y || 0)
                    };
                }
            }
        } else {
            this.selectedShape = null;
            this.updateShapeProperties();
            this.updateShapesList();
        }
        
        this.draw();
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom - this.pan.x;
        const y = (e.clientY - rect.top) / this.zoom - this.pan.y;
        
        if (this.isDrawing && this.tool === 'pen' && this.currentPath) {
            // Add point to current path
            this.currentPath.points.push({ x, y });
            this.draw();
            this.updateProjector();
            return;
        }
        
        if (this.isDragging) {
            if (this.tool === 'hand') {
                this.pan.x = this.panStart.x + (e.clientX - this.dragStart.x) / this.zoom;
                this.pan.y = this.panStart.y + (e.clientY - this.dragStart.y) / this.zoom;
            } else if (this.tool === 'scale' && this.selectedShape && this.scaleStart) {
                // Calculate scale factor based on mouse movement
                const currentDist = Math.sqrt(
                    Math.pow(x - this.scaleStart.centerX, 2) + 
                    Math.pow(y - this.scaleStart.centerY, 2)
                );
                const startRect = this.canvas.getBoundingClientRect();
                const startX = (this.dragStart.x - startRect.left) / this.zoom - this.pan.x;
                const startY = (this.dragStart.y - startRect.top) / this.zoom - this.pan.y;
                const startDist = Math.sqrt(
                    Math.pow(startX - this.scaleStart.centerX, 2) + 
                    Math.pow(startY - this.scaleStart.centerY, 2)
                );
                
                const scale = startDist > 0 ? currentDist / startDist : 1;
                
                const shape = this.selectedShape;
                if (shape.width !== undefined) {
                    // Rectangle, polygon, image
                    const newWidth = this.scaleStart.width * scale;
                    const newHeight = this.scaleStart.height * scale;
                    shape.width = Math.max(10, newWidth);
                    shape.height = Math.max(10, newHeight);
                    
                    // Keep center position
                    shape.x = this.scaleStart.centerX - shape.width / 2;
                    shape.y = this.scaleStart.centerY - shape.height / 2;
                    
                    // Update corners for rectangles/images
                    if (shape.corners && shape.corners.length === 4) {
                        const cx = this.scaleStart.centerX;
                        const cy = this.scaleStart.centerY;
                        shape.corners[0] = { x: cx - shape.width / 2, y: cy - shape.height / 2 };
                        shape.corners[1] = { x: cx + shape.width / 2, y: cy - shape.height / 2 };
                        shape.corners[2] = { x: cx + shape.width / 2, y: cy + shape.height / 2 };
                        shape.corners[3] = { x: cx - shape.width / 2, y: cy + shape.height / 2 };
                    }
                } else if (shape.radius !== undefined) {
                    // Circle, polygon (radius-based)
                    const newRadius = (this.scaleStart.radius || this.scaleStart.width / 2) * scale;
                    shape.radius = Math.max(5, newRadius);
                    
                    // Keep center position
                    shape.x = this.scaleStart.centerX;
                    shape.y = this.scaleStart.centerY;
                }
                this.updateShapeProperties();
            } else if (typeof this.dragHandle === 'number' && this.selectedShape && 
                       (this.selectedShape.type === 'rectangle' || this.selectedShape.type === 'youtube' || this.selectedShape.type === 'image') &&
                       this.selectedShape.corners) {
                // Drag corner for warping
                this.selectedShape.corners[this.dragHandle].x = x;
                this.selectedShape.corners[this.dragHandle].y = y;
                
                // Update x, y, width, height for image shapes (for compatibility)
                if (this.selectedShape.type === 'image') {
                    const minX = Math.min(...this.selectedShape.corners.map(c => c.x));
                    const maxX = Math.max(...this.selectedShape.corners.map(c => c.x));
                    const minY = Math.min(...this.selectedShape.corners.map(c => c.y));
                    const maxY = Math.max(...this.selectedShape.corners.map(c => c.y));
                    this.selectedShape.x = minX;
                    this.selectedShape.y = minY;
                    this.selectedShape.width = maxX - minX;
                    this.selectedShape.height = maxY - minY;
                }
                this.updateShapeProperties();
            } else if (this.selectedShape && this.tool === 'select') {
                if (this.selectedShape.type === 'path') {
                    // Paths don't have x/y, skip
                } else if (this.selectedShape.corners) {
                    // Move all corners together
                    const centerX = this.selectedShape.corners.reduce((sum, c) => sum + c.x, 0) / this.selectedShape.corners.length;
                    const centerY = this.selectedShape.corners.reduce((sum, c) => sum + c.y, 0) / this.selectedShape.corners.length;
                    const dx = x - centerX - this.dragOffset.x;
                    const dy = y - centerY - this.dragOffset.y;
                    this.selectedShape.corners.forEach(corner => {
                        corner.x += dx;
                        corner.y += dy;
                    });
                } else {
                    this.selectedShape.x = x - this.dragOffset.x;
                    this.selectedShape.y = y - this.dragOffset.y;
                }
            }
            this.draw();
            this.updateProjector();
        }
        
        // Update cursor based on tool (After Effects style)
        if (this.tool === 'hand') {
            this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
        } else if (this.tool === 'zoom') {
            this.canvas.style.cursor = 'zoom-in';
        } else if (this.tool === 'pen') {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.tool === 'scale') {
            this.canvas.style.cursor = 'nwse-resize';
        } else if (this.tool === 'select') {
            const cornerIndex = this.getCornerHandle(x, y);
            if (cornerIndex !== null) {
                this.canvas.style.cursor = 'crosshair';
            } else {
                const shape = this.getShapeAt(x, y);
                this.canvas.style.cursor = shape ? 'move' : 'default';
            }
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    onMouseUp(e) {
        if (this.isDrawing && this.tool === 'pen' && this.currentPath) {
            // Finish drawing path
            this.isDrawing = false;
            this.currentPath = null;
            this.saveState();
            this.updateProjector();
        }
        if (this.isDragging && this.selectedShape) {
            // Save state after dragging
            this.saveState();
        }
        this.isDragging = false;
        this.dragHandle = null;
        this.scaleStart = { x: 0, y: 0, width: 0, height: 0, radius: 0, centerX: 0, centerY: 0 };
        this.updateProjector();
    }
    
    onWheel(e) {
        e.preventDefault();
        
        // Zoom in/out with mouse wheel
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / this.zoom - this.pan.x;
        const mouseY = (e.clientY - rect.top) / this.zoom - this.pan.y;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, this.zoom * zoomFactor));
        
        // Adjust pan to zoom towards mouse position
        this.pan.x = mouseX - (e.clientX - rect.left) / newZoom;
        this.pan.y = mouseY - (e.clientY - rect.top) / newZoom;
        
        this.zoom = newZoom;
        this.draw();
    }

    
    getShapeAt(x, y) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (!shape.visible) continue;
            
            let hit = false;
            if (shape.type === 'rectangle' && shape.corners) {
                // Point in polygon test for warped rectangle
                hit = this.pointInPolygon(x, y, shape.corners);
            } else if (shape.type === 'rectangle') {
                hit = x >= shape.x && x <= shape.x + shape.width &&
                      y >= shape.y && y <= shape.y + shape.height;
            } else if (shape.type === 'youtube' && shape.corners) {
                hit = this.pointInPolygon(x, y, shape.corners);
            } else if (shape.type === 'youtube') {
                hit = x >= shape.x && x <= shape.x + shape.width &&
                      y >= shape.y && y <= shape.y + shape.height;
            } else if (shape.type === 'image' && shape.corners) {
                hit = this.pointInPolygon(x, y, shape.corners);
            } else if (shape.type === 'image') {
                hit = x >= shape.x && x <= shape.x + shape.width &&
                      y >= shape.y && y <= shape.y + shape.height;
            } else if (shape.type === 'circle') {
                const dx = x - shape.x;
                const dy = y - shape.y;
                hit = Math.sqrt(dx * dx + dy * dy) <= shape.radius;
            } else if (shape.type === 'polygon') {
                const dx = x - shape.x;
                const dy = y - shape.y;
                hit = Math.sqrt(dx * dx + dy * dy) <= shape.radius;
            } else if (shape.type === 'path' && shape.points && shape.points.length > 2) {
                hit = this.pointInPolygon(x, y, shape.points);
            }
            
            if (hit) return shape;
        }
        return null;
    }
    
    pointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    setKeybind(e) {
        e.preventDefault();
        e.stopPropagation();
        const key = e.key.toLowerCase();
        
        if (this.selectedShape) {
            // Remove old keybind
            if (this.selectedShape.keybind) {
                this.keybinds.delete(this.selectedShape.keybind);
            }
            
            // Set new keybind
            this.selectedShape.keybind = key;
            this.keybinds.set(key, this.selectedShape);
            document.getElementById('keybindInput').value = key.toUpperCase();
            this.updateShapesList();
            this.saveState();
        }
    }
    
    updateShapeEffect(effect) {
        if (this.selectedShape) {
            this.selectedShape.effect = effect;
            this.saveState();
        }
    }
    
    updateShapeColor(color) {
        if (this.selectedShape) {
            this.selectedShape.color = color;
            this.draw();
            this.updateProjector();
            this.saveState();
        }
    }
    
    updateShapeOpacity(opacity) {
        if (this.selectedShape) {
            this.selectedShape.opacity = opacity;
            this.draw();
            this.updateProjector();
        }
    }
    
    updateShapeRotation(rotation) {
        if (this.selectedShape) {
            this.selectedShape.rotation = rotation;
            this.draw();
            this.updateProjector();
        }
    }
    
    getCornerHandle(x, y) {
        if (!this.selectedShape) return null;
        
        const shape = this.selectedShape;
        
        // Check corners for rectangles, YouTube videos, and images
        if ((shape.type === 'rectangle' || shape.type === 'youtube' || shape.type === 'image') && shape.corners) {
            for (let i = 0; i < shape.corners.length; i++) {
                const corner = shape.corners[i];
                const dx = x - corner.x;
                const dy = y - corner.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 10) {
                    return i; // Return corner index
                }
            }
        }
        
        return null;
    }
    
    updateShapeStrokeColor(color) {
        if (this.selectedShape) {
            this.selectedShape.strokeColor = color;
            this.draw();
            this.updateProjector();
            this.saveState();
        }
    }
    
    updateShapeStrokeWidth(width) {
        if (this.selectedShape) {
            this.selectedShape.strokeWidth = width;
            this.draw();
            this.updateProjector();
        }
    }
    
    updateShapeBlendMode(blendMode) {
        if (this.selectedShape && this.selectedShape.type === 'image') {
            this.selectedShape.blendMode = blendMode;
            this.draw();
            this.updateProjector();
            this.updateAllGifOverlays(); // Update GIF overlay blend mode
            this.saveState();
        }
    }
    
    loadYouTubeVideo() {
        const input = document.getElementById('youtubeUrlInput');
        if (!input) return;
        
        const url = input.value.trim();
        if (!url) return;
        
        // Extract video ID from YouTube URL
        let videoId = null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                videoId = match[1];
                break;
            }
        }
        
        if (!videoId) {
            alert('Invalid YouTube URL. Please paste a valid YouTube link.');
            return;
        }
        
        console.log('Loading YouTube video:', videoId);
        
        // Create YouTube video shape
        const centerX = (this.canvas.width || 800) / 2;
        const centerY = (this.canvas.height || 600) / 2;
        
        const videoShape = {
            id: Date.now(),
            type: 'youtube',
            x: centerX - 160,
            y: centerY - 90,
            width: 320,
            height: 180,
            corners: [
                { x: centerX - 160, y: centerY - 90 }, // top-left
                { x: centerX + 160, y: centerY - 90 }, // top-right
                { x: centerX + 160, y: centerY + 90 }, // bottom-right
                { x: centerX - 160, y: centerY + 90 }  // bottom-left
            ],
            videoId: videoId,
            opacity: 1,
            effect: 'hide',
            keybind: null,
            visible: true,
            pulsePhase: 0,
            flowOffset: 0
        };
        
        this.shapes.push(videoShape);
        this.selectedShape = videoShape;
        this.updateShapesList();
        this.updateShapeProperties();
        this.draw();
        this.updateProjector();
        this.saveState(); // Save state for undo
        console.log('YouTube video shape added');
    }
    
    triggerShapeEffect(shape) {
        switch (shape.effect) {
            case 'hide':
                shape.visible = !shape.visible;
                break;
            case 'pulse':
                shape.pulsePhase = 0;
                break;
            case 'color':
                // Cycle through colors
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                const currentIndex = colors.indexOf(shape.color);
                shape.color = colors[(currentIndex + 1) % colors.length];
                break;
            case 'flow':
                // Flow is continuous, just toggle visibility or speed
                shape.flowOffset = (shape.flowOffset || 0);
                break;
            case 'glow':
                // Glow is continuous, reset phase for animation
                shape.pulsePhase = 0;
                break;
            case 'blur':
                // Blur is a visual state, toggle visibility
                shape.visible = !shape.visible;
                break;
        }
        this.draw();
        this.updateProjector();
    }
    
    updateShapesList() {
        const list = document.getElementById('shapesList');
        list.innerHTML = '';
        
        // Reverse order so top shape in array appears at top of list
        [...this.shapes].reverse().forEach((shape, index) => {
            const actualIndex = this.shapes.length - 1 - index;
            const item = document.createElement('div');
            item.className = `shape-item ${shape === this.selectedShape ? 'selected' : ''}`;
            item.draggable = true;
            item.dataset.shapeIndex = actualIndex;
            
            item.innerHTML = `
                <div class="shape-item-header">
                    <span class="shape-item-name">${shape.type}</span>
                    <div class="shape-item-actions">
                        ${shape.keybind ? `<span class="shape-item-keybind">${shape.keybind.toUpperCase()}</span>` : ''}
                        <button class="shape-duplicate-btn" title="Duplicate">⧉</button>
                        <button class="shape-delete-btn" title="Delete">×</button>
                    </div>
                </div>
            `;
            
            // Click to select
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('shape-delete-btn') && !e.target.classList.contains('shape-duplicate-btn')) {
                    this.selectedShape = shape;
                    this.updateShapeProperties();
                    this.updateShapesList();
                    this.draw();
                }
            });
            
            // Duplicate button
            const duplicateBtn = item.querySelector('.shape-duplicate-btn');
            if (duplicateBtn) {
                duplicateBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.duplicateShape(shape);
                };
            }
            
            // Delete button
            const deleteBtn = item.querySelector('.shape-delete-btn');
            if (deleteBtn) {
                deleteBtn.innerHTML = '×';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteShape(shape);
                };
            }
            
            // Drag and drop for layer reordering
            item.addEventListener('dragstart', (e) => {
                this.isDraggingLayer = true;
                this.draggedLayerElement = item;
                item.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
                this.isDraggingLayer = false;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (e.clientY < midY) {
                    item.style.borderTop = '2px solid var(--accent-blue)';
                    item.style.borderBottom = 'none';
                } else {
                    item.style.borderBottom = '2px solid var(--accent-blue)';
                    item.style.borderTop = 'none';
                }
            });
            
            item.addEventListener('dragleave', (e) => {
                item.style.borderTop = 'none';
                item.style.borderBottom = 'none';
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.style.borderTop = 'none';
                item.style.borderBottom = 'none';
                
                if (this.draggedLayerElement && this.draggedLayerElement !== item) {
                    const draggedIndex = parseInt(this.draggedLayerElement.dataset.shapeIndex);
                    const targetIndex = parseInt(item.dataset.shapeIndex);
                    
                    if (draggedIndex === targetIndex) return;
                    
                    // Since list is reversed (last in array appears first in list),
                    // convert to visual positions
                    const draggedVisualPos = this.shapes.length - 1 - draggedIndex;
                    const targetVisualPos = this.shapes.length - 1 - targetIndex;
                    
                    const rect = item.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const dropAbove = e.clientY < midY;
                    
                    // Calculate new visual position
                    let newVisualPos;
                    if (dropAbove) {
                        // Dropping above target = move to position before target
                        newVisualPos = targetVisualPos + 1;
                    } else {
                        // Dropping below target = move to position after target
                        newVisualPos = targetVisualPos;
                    }
                    
                    // Adjust if dragging from above the target position
                    if (draggedVisualPos < newVisualPos) {
                        newVisualPos--;
                    }
                    
                    // Clamp to valid range
                    newVisualPos = Math.max(0, Math.min(this.shapes.length - 1, newVisualPos));
                    
                    // Convert back to array index
                    const newArrayIndex = this.shapes.length - 1 - newVisualPos;
                    
                    if (draggedIndex !== newArrayIndex) {
                        this.reorderShape(draggedIndex, newArrayIndex);
                        this.saveState();
                        this.updateShapesList();
                        this.draw();
                        this.updateProjector();
                    }
                }
            });
            
            list.appendChild(item);
        });
    }
    
    
    reorderShape(fromIndex, toIndex) {
        // Clamp indices
        fromIndex = Math.max(0, Math.min(this.shapes.length - 1, fromIndex));
        toIndex = Math.max(0, Math.min(this.shapes.length, toIndex));
        
        if (fromIndex === toIndex) return;
        
        const shape = this.shapes.splice(fromIndex, 1)[0];
        
        // Adjust toIndex if we removed an element before it
        if (fromIndex < toIndex) {
            toIndex--;
        }
        
        this.shapes.splice(toIndex, 0, shape);
    }
    
    copyShape(shape) {
        // Deep clone the shape for copying
        this.copiedShape = JSON.parse(JSON.stringify(shape));
        console.log('Shape copied:', shape.type);
    }
    
    pasteShape() {
        if (!this.copiedShape) return;
        
        // Create a new shape from the copied data
        const newShape = this.duplicateShapeData(this.copiedShape);
        this.shapes.push(newShape);
        this.selectedShape = newShape;
        
        // If it's a GIF, create overlay element
        if (newShape.type === 'image' && newShape.isGif) {
            this.createGifOverlay(newShape);
        }
        
        this.saveState();
        this.updateShapesList();
        this.updateShapeProperties();
        this.draw();
        this.updateProjector();
        console.log('Shape pasted:', newShape.type);
    }
    
    duplicateShape(shape) {
        const newShape = this.duplicateShapeData(shape);
        this.shapes.push(newShape);
        this.selectedShape = newShape;
        
        // If it's a GIF, create overlay element
        if (newShape.type === 'image' && newShape.isGif) {
            this.createGifOverlay(newShape);
        }
        
        this.saveState();
        this.updateShapesList();
        this.updateShapeProperties();
        this.draw();
        this.updateProjector();
        console.log('Shape duplicated:', newShape.type);
    }
    
    duplicateShapeData(shape) {
        // Deep clone the shape
        const newShape = JSON.parse(JSON.stringify(shape));
        
        // Generate new ID
        newShape.id = Date.now() + Math.random();
        
        // Offset position slightly so duplicate is visible
        const offset = 30;
        if (newShape.x !== undefined) newShape.x += offset;
        if (newShape.y !== undefined) newShape.y += offset;
        
        // Offset corners if they exist
        if (newShape.corners && Array.isArray(newShape.corners)) {
            newShape.corners = newShape.corners.map(corner => ({
                x: corner.x + offset,
                y: corner.y + offset
            }));
        }
        
        // Offset points if they exist (for path shapes)
        if (newShape.points && Array.isArray(newShape.points)) {
            newShape.points = newShape.points.map(point => ({
                x: point.x + offset,
                y: point.y + offset
            }));
        }
        
        // Clear keybind (duplicates shouldn't share keybinds)
        newShape.keybind = null;
        
        // For images, reload the image object
        if (newShape.type === 'image' && newShape.imageData) {
            const img = new Image();
            img.src = newShape.imageData;
            newShape.image = img;
            
            // Clear GIF element - will be recreated if needed
            newShape.gifElement = null;
            // Clear any cached projector reference
            delete newShape._image;
        }
        
        return newShape;
    }
    
    deleteShape(shape) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            // Remove keybind if exists
            if (shape.keybind) {
                this.keybinds.delete(shape.keybind);
            }
            
            // Remove GIF overlay element if it exists
            if (shape.isGif && shape.gifElement) {
                shape.gifElement.remove();
            }
            
            this.shapes.splice(index, 1);
            
            if (this.selectedShape === shape) {
                this.selectedShape = null;
                this.updateShapeProperties();
            }
            
            this.saveState();
            this.updateShapesList();
            this.draw();
            this.updateProjector();
        }
    }
    
    saveState() {
        // Remove any history after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        const state = {
            shapes: this.shapes.map(shape => JSON.parse(JSON.stringify(shape))),
            keybinds: Array.from(this.keybinds.entries()).map(([key, shape]) => [key, shape.id])
        };
        
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
        
        // Update undo/redo button states
        this.updateUndoRedoButtons();
    }
    
    loadState(state) {
        // Restore shapes
        this.shapes = state.shapes.map(shape => {
            const restoredShape = JSON.parse(JSON.stringify(shape));
            // Ensure image shapes have blendMode default
            if (restoredShape.type === 'image' && !restoredShape.blendMode) {
                restoredShape.blendMode = 'normal';
            }
            // Reload image objects if needed
            if (restoredShape.type === 'image' && restoredShape.imageData) {
                const img = new Image();
                img.src = restoredShape.imageData;
                restoredShape.image = img;
                // GIF overlays will be recreated on draw
                if (restoredShape.isGif) {
                    restoredShape.gifElement = null;
                }
            }
            return restoredShape;
        });
        
        // Restore keybinds
        this.keybinds.clear();
        state.keybinds.forEach(([key, shapeId]) => {
            const shape = this.shapes.find(s => s.id === shapeId);
            if (shape) {
                this.keybinds.set(key, shape);
            }
        });
        
        // Clear selection if shape no longer exists
        if (this.selectedShape && !this.shapes.includes(this.selectedShape)) {
            this.selectedShape = null;
            this.updateShapeProperties();
        }
        
        this.updateShapesList();
        this.draw();
        this.updateProjector();
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.loadState(state);
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.loadState(state);
        }
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
            undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
            redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
        }
    }
    
    saveProject() {
        // Create project data object
        const projectData = {
            version: '1.0',
            savedAt: new Date().toISOString(),
            shapes: this.shapes.map(shape => {
                // Deep clone shape to ensure all properties are included
                const shapeData = JSON.parse(JSON.stringify(shape));
                return shapeData;
            }),
            keybinds: Array.from(this.keybinds.entries()).map(([key, shape]) => ({
                key: key,
                shapeId: shape.id
            }))
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(projectData, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `projection-mapping-${timestamp}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('Project saved:', projectData);
    }
    
    loadProject(projectData) {
        try {
            // Validate project data structure
            if (!projectData || !Array.isArray(projectData.shapes)) {
                throw new Error('Invalid project file format: missing shapes array');
            }
            
            // Clear current state
            this.shapes = [];
            this.keybinds.clear();
            this.selectedShape = null;
            
            // Load shapes
            projectData.shapes.forEach(shapeData => {
                // Deep clone to avoid reference issues
                const shape = JSON.parse(JSON.stringify(shapeData));
                // Ensure image shapes have blendMode default
                if (shape.type === 'image' && !shape.blendMode) {
                    shape.blendMode = 'normal';
                }
                this.shapes.push(shape);
            });
            
            // Load keybinds - handle both array format [key, shapeId] and object format {key, shapeId}
            if (projectData.keybinds && Array.isArray(projectData.keybinds)) {
                projectData.keybinds.forEach(keybindEntry => {
                    let key, shapeId;
                    
                    // Handle object format: {key: 'a', shapeId: 123}
                    if (typeof keybindEntry === 'object' && keybindEntry !== null && !Array.isArray(keybindEntry)) {
                        key = keybindEntry.key;
                        shapeId = keybindEntry.shapeId;
                    }
                    // Handle array format: ['a', 123]
                    else if (Array.isArray(keybindEntry) && keybindEntry.length === 2) {
                        key = keybindEntry[0];
                        shapeId = keybindEntry[1];
                    }
                    
                    if (key && shapeId) {
                        const shape = this.shapes.find(s => s.id === shapeId);
                        if (shape) {
                            shape.keybind = key;
                            this.keybinds.set(key, shape);
                        }
                    }
                });
            }
            
            // Update UI
            this.updateShapesList();
            this.updateShapeProperties();
            this.draw();
            this.updateProjector();
            
            // Reset history and save current state
            this.history = [];
            this.historyIndex = -1;
            this.saveState();
            
            console.log('Project loaded:', {
                shapesCount: this.shapes.length,
                keybindsCount: this.keybinds.size,
                version: projectData.version || 'unknown',
                savedAt: projectData.savedAt || 'unknown'
            });
        } catch (error) {
            alert('Error loading project: ' + error.message);
            console.error('Error loading project:', error);
            throw error;
        }
    }
    
    updateShapeProperties() {
        const props = document.getElementById('shapeProperties');
        const penProps = document.getElementById('penToolProperties');
        const imageProps = document.getElementById('imageProperties');
        
        if (this.selectedShape) {
            props.style.display = 'block';
            
            // Show pen tool properties if path is selected
            if (this.selectedShape.type === 'path' && penProps) {
                penProps.style.display = 'block';
                document.getElementById('penWidthInput').value = this.selectedShape.strokeWidth || this.penWidth;
                document.getElementById('penWidthValue').textContent = this.selectedShape.strokeWidth || this.penWidth;
            } else if (penProps) {
                penProps.style.display = 'none';
            }
            
            // Show image properties if image is selected
            if (this.selectedShape.type === 'image' && imageProps) {
                imageProps.style.display = 'block';
                const blendModeSelect = document.getElementById('blendModeSelect');
                if (blendModeSelect) {
                    blendModeSelect.value = this.selectedShape.blendMode || 'normal';
                }
            } else if (imageProps) {
                imageProps.style.display = 'none';
            }
            
            document.getElementById('keybindInput').value = this.selectedShape.keybind ? this.selectedShape.keybind.toUpperCase() : '';
            document.getElementById('effectSelect').value = this.selectedShape.effect;
            if (this.selectedShape.color) {
                document.getElementById('colorInput').value = this.selectedShape.color;
            }
            document.getElementById('strokeColorInput').value = this.selectedShape.strokeColor || '#000000';
            document.getElementById('strokeWidthInput').value = this.selectedShape.strokeWidth || 0;
            document.getElementById('strokeWidthValue').textContent = this.selectedShape.strokeWidth || 0;
            document.getElementById('opacityInput').value = (this.selectedShape.opacity || 1) * 100;
            document.getElementById('opacityValue').textContent = Math.round((this.selectedShape.opacity || 1) * 100) + '%';
            
            const audioReactiveToggle = document.getElementById('audioReactiveToggle');
            if (audioReactiveToggle) {
                audioReactiveToggle.checked = this.selectedShape.audioReactive || false;
            }
        } else {
            props.style.display = 'none';
        }
    }
    
    draw() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not initialized');
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.pan.x, this.pan.y);
        
        // Draw wall image if available
        if (this.wallImage) {
            const scale = Math.min(
                this.canvas.width / this.zoom / this.wallImage.width,
                this.canvas.height / this.zoom / this.wallImage.height
            );
            const x = (this.canvas.width / this.zoom - this.wallImage.width * scale) / 2;
            const y = (this.canvas.height / this.zoom - this.wallImage.height * scale) / 2;
            this.ctx.drawImage(this.wallImage, x, y, this.wallImage.width * scale, this.wallImage.height * scale);
        }
        
        // Draw shapes
        if (this.shapes.length === 0) {
            // Draw placeholder text if no shapes
            this.ctx.fillStyle = '#999';
            this.ctx.font = '20px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Add shapes to get started', this.canvas.width / this.zoom / 2, this.canvas.height / this.zoom / 2);
        }
        
        this.shapes.forEach(shape => {
            if (!shape.visible && shape.effect !== 'pulse') return;
            
            this.ctx.save();
            
            let alpha = shape.opacity || 1;
            if (shape.effect === 'pulse') {
                alpha *= (0.5 + 0.5 * Math.sin(shape.pulsePhase || 0));
            }
            this.ctx.globalAlpha = alpha;
            
            // Apply glow effect
            if (shape.effect === 'glow') {
                this.ctx.shadowBlur = 20 + Math.sin(shape.pulsePhase || 0) * 10;
                this.ctx.shadowColor = shape.color || '#ffb6c1';
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.shadowColor = 'transparent';
            }
            
            // Apply blur effect
            if (shape.effect === 'blur') {
                // Canvas doesn't support blur directly, we'll use a workaround with multiple draws
                // For now, we'll use a reduced opacity as a visual indicator
                this.ctx.globalAlpha = alpha * 0.7;
            }
            
            // No rotation - using corner pinning instead
            
            this.ctx.fillStyle = shape.color || '#ffb6c1';
            this.ctx.strokeStyle = shape.strokeColor || (shape === this.selectedShape ? '#316ac5' : '#666');
            this.ctx.lineWidth = shape.strokeWidth || (shape === this.selectedShape ? 2 : 1);
            
            if (shape.type === 'rectangle') {
                if (shape.corners && shape.corners.length === 4) {
                    // Draw warped rectangle using corners
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.corners[0].x, shape.corners[0].y);
                    this.ctx.lineTo(shape.corners[1].x, shape.corners[1].y);
                    this.ctx.lineTo(shape.corners[2].x, shape.corners[2].y);
                    this.ctx.lineTo(shape.corners[3].x, shape.corners[3].y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    if (shape.strokeWidth > 0) {
                        this.ctx.stroke();
                    }
                } else {
                    // Fallback to regular rectangle
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                    if (shape.strokeWidth > 0) {
                        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    }
                }
            } else if (shape.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            } else if (shape.type === 'path' && shape.points && shape.points.length > 0) {
                this.ctx.strokeStyle = shape.strokeColor || shape.color || '#000000';
                this.ctx.lineWidth = shape.strokeWidth || this.penWidth;
                this.ctx.beginPath();
                shape.points.forEach((point, i) => {
                    if (i === 0) {
                        this.ctx.moveTo(point.x, point.y);
                    } else {
                        this.ctx.lineTo(point.x, point.y);
                    }
                });
                if (shape.points.length > 2) {
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                this.ctx.stroke();
            } else if (shape.type === 'image' && shape.imageData) {
                // Draw image with corner pinning
                if (shape.corners && shape.corners.length === 4) {
                    // Load image if not already loaded
                    if (!shape.image) {
                        const img = new Image();
                        img.onload = () => {
                            this.draw(); // Redraw when image loads
                        };
                        img.src = shape.imageData;
                        shape.image = img;
                    }
                    
                    // Draw warped image using corners (Note: GIFs will only show first frame - Canvas limitation)
                    if (shape.image.complete && shape.image.width > 0) {
                        this.ctx.save();
                        // Apply blend mode if specified
                        if (shape.blendMode && shape.blendMode !== 'normal') {
                            this.ctx.globalCompositeOperation = shape.blendMode;
                        }
                        // Create clipping path for the image
                        this.ctx.beginPath();
                        this.ctx.moveTo(shape.corners[0].x, shape.corners[0].y);
                        this.ctx.lineTo(shape.corners[1].x, shape.corners[1].y);
                        this.ctx.lineTo(shape.corners[2].x, shape.corners[2].y);
                        this.ctx.lineTo(shape.corners[3].x, shape.corners[3].y);
                        this.ctx.closePath();
                        this.ctx.clip();
                        
                        // Calculate bounding box for image draw
                        const minX = Math.min(shape.corners[0].x, shape.corners[1].x, shape.corners[2].x, shape.corners[3].x);
                        const maxX = Math.max(shape.corners[0].x, shape.corners[1].x, shape.corners[2].x, shape.corners[3].x);
                        const minY = Math.min(shape.corners[0].y, shape.corners[1].y, shape.corners[2].y, shape.corners[3].y);
                        const maxY = Math.max(shape.corners[0].y, shape.corners[1].y, shape.corners[2].y, shape.corners[3].y);
                        
                        this.ctx.drawImage(shape.image, minX, minY, maxX - minX, maxY - minY);
                        this.ctx.restore();
                        
                        // Draw border if stroke width > 0
                        if (shape.strokeWidth > 0) {
                            this.ctx.strokeStyle = shape.strokeColor || '#000000';
                            this.ctx.lineWidth = shape.strokeWidth;
                            this.ctx.beginPath();
                            this.ctx.moveTo(shape.corners[0].x, shape.corners[0].y);
                            this.ctx.lineTo(shape.corners[1].x, shape.corners[1].y);
                            this.ctx.lineTo(shape.corners[2].x, shape.corners[2].y);
                            this.ctx.lineTo(shape.corners[3].x, shape.corners[3].y);
                            this.ctx.closePath();
                            this.ctx.stroke();
                        }
                    }
                } else {
                    // Fallback to regular image
                    if (shape.image && shape.image.complete && shape.image.width > 0) {
                        this.ctx.save();
                        // Apply blend mode if specified
                        if (shape.blendMode && shape.blendMode !== 'normal') {
                            this.ctx.globalCompositeOperation = shape.blendMode;
                        }
                        this.ctx.drawImage(shape.image, shape.x, shape.y, shape.width, shape.height);
                        this.ctx.restore();
                    }
                }
            } else if (shape.type === 'youtube') {
                if (shape.corners && shape.corners.length === 4) {
                    // Draw warped YouTube video using corners
                    this.ctx.fillStyle = '#000';
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.corners[0].x, shape.corners[0].y);
                    this.ctx.lineTo(shape.corners[1].x, shape.corners[1].y);
                    this.ctx.lineTo(shape.corners[2].x, shape.corners[2].y);
                    this.ctx.lineTo(shape.corners[3].x, shape.corners[3].y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Draw YouTube text (simplified - just in center)
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '14px Inter';
                    this.ctx.textAlign = 'center';
                    const centerX = (shape.corners[0].x + shape.corners[1].x + shape.corners[2].x + shape.corners[3].x) / 4;
                    const centerY = (shape.corners[0].y + shape.corners[1].y + shape.corners[2].y + shape.corners[3].y) / 4;
                    this.ctx.fillText('YouTube', centerX, centerY);
                } else {
                    // Fallback
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '14px Inter';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('YouTube', shape.x + shape.width / 2, shape.y + shape.height / 2);
                }
            }
            
            // Draw corner handles if selected and shape has corners
            if (shape === this.selectedShape && (shape.type === 'rectangle' || shape.type === 'youtube' || shape.type === 'image') && shape.corners) {
                this.ctx.restore();
                this.ctx.save();
                this.ctx.strokeStyle = '#316ac5';
                this.ctx.fillStyle = '#316ac5';
                this.ctx.lineWidth = 2;
                
                shape.corners.forEach((corner, i) => {
                    this.ctx.beginPath();
                    this.ctx.arc(corner.x, corner.y, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.strokeStyle = '#316ac5';
                    this.ctx.lineWidth = 2;
                });
            }
            
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }
    
    updateProjector() {
        if (!this.projectorWindow || this.projectorWindow.closed) {
            return;
        }
        
        try {
            // Send wall image if available
            let imageData = null;
            if (this.wallImage) {
                imageData = this.wallImage.src;
            }
            
            // Send shapes data (clone to avoid reference issues)
            const shapesData = this.shapes.map(shape => ({
                id: shape.id,
                type: shape.type,
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                radius: shape.radius,
                sides: shape.sides,
                points: shape.points ? shape.points.map(p => ({ x: p.x, y: p.y })) : undefined,
                corners: shape.corners ? shape.corners.map(c => ({ x: c.x, y: c.y })) : undefined,
                videoId: shape.videoId,
                imageData: shape.imageData, // Include image data for images (GIFs will animate)
                isGif: shape.isGif || false, // Include GIF flag
                blendMode: shape.blendMode || 'normal', // Include blend mode
                color: shape.color,
                strokeColor: shape.strokeColor,
                strokeWidth: shape.strokeWidth || 0,
                opacity: shape.opacity || 1,
                effect: shape.effect,
                visible: shape.visible,
                pulsePhase: shape.pulsePhase || 0,
                flowOffset: shape.flowOffset || 0
            }));
            
            // Send to projector window
            const message = {
                type: 'updateProjector',
                imageData: imageData,
                shapes: shapesData,
                canvasWidth: this.canvas.width || 1920,
                canvasHeight: this.canvas.height || 1080
            };
            
            this.projectorWindow.postMessage(message, '*');
            console.log('Projector update sent:', {
                shapesCount: shapesData.length,
                canvasSize: `${message.canvasWidth}x${message.canvasHeight}`
            });
        } catch (e) {
            console.error('Error updating projector:', e);
        }
    }
    
    animate() {
        requestAnimationFrame(() => {
            // Update animations
            this.shapes.forEach(shape => {
                if (shape.effect === 'pulse') {
                    shape.pulsePhase = (shape.pulsePhase || 0) + 0.1;
                }
                if (shape.effect === 'flow') {
                    shape.flowOffset = (shape.flowOffset || 0) + 0.02;
                }
                if (shape.effect === 'glow') {
                    // Use pulsePhase for glow animation too
                    if (!shape.pulsePhase) shape.pulsePhase = 0;
                    shape.pulsePhase += 0.1;
                }
            });
            
            // Audio reactive effects
            if (this.audioMode && window.audioAnalyzer) {
                const volume = window.audioAnalyzer.getVolume() || 0;
                const frequency = window.audioAnalyzer.getFrequency() || 0;
                
                this.shapes.forEach(shape => {
                    // When audio mode is enabled globally, affect all shapes
                    // The per-shape audioReactive checkbox can be used to exclude specific shapes if needed
                    // For now, we'll affect all shapes when audio mode is enabled
                    
                    switch (this.audioReactTo) {
                        case 'color':
                            // Audio reactive colors - only apply to shapes that use color property
                            if (shape.type !== 'image') { // Images don't use the color property
                                if (this.audioColorMode === 'rainbow') {
                                    const hue = (frequency * 360) % 360;
                                    shape.color = `hsl(${hue}, 100%, 50%)`;
                                } else if (this.audioColorMode === 'custom') {
                                    shape.color = this.audioCustomColor;
                                } else if (this.audioColorMode === 'preset1') {
                                    // Red to Orange gradient
                                    const hue = 0 + (volume * 30); // 0-30 (red to orange)
                                    shape.color = `hsl(${hue}, 100%, 50%)`;
                                } else if (this.audioColorMode === 'preset2') {
                                    // Blue to Purple gradient
                                    const hue = 220 + (volume * 60); // 220-280 (blue to purple)
                                    shape.color = `hsl(${hue}, 100%, 50%)`;
                                } else if (this.audioColorMode === 'preset3') {
                                    // Green to Teal gradient
                                    const hue = 120 + (volume * 60); // 120-180 (green to teal)
                                    shape.color = `hsl(${hue}, 100%, 50%)`;
                                }
                            }
                            break;
                            
                        case 'opacity':
                            // Audio reactive opacity (0.3 to 1.0 based on volume)
                            shape.opacity = 0.3 + (volume * 0.7);
                            break;
                            
                        case 'size':
                            // Audio reactive size (scale from 0.8x to 1.5x)
                            if (!shape.audioOriginalWidth) {
                                // Store original dimensions on first audio reactive activation
                                shape.audioOriginalWidth = shape.width || (shape.radius ? shape.radius * 2 : 100);
                                shape.audioOriginalHeight = shape.height || (shape.radius ? shape.radius * 2 : 100);
                                shape.audioOriginalRadius = shape.radius || null;
                                shape.audioOriginalX = shape.x;
                                shape.audioOriginalY = shape.y;
                            }
                            const scale = 0.8 + (volume * 0.7); // 0.8x to 1.5x
                            if (shape.width !== undefined) {
                                const newWidth = shape.audioOriginalWidth * scale;
                                const newHeight = shape.audioOriginalHeight * scale;
                                shape.width = newWidth;
                                shape.height = newHeight;
                                // Update position to keep center point
                                shape.x = shape.audioOriginalX + (shape.audioOriginalWidth - newWidth) / 2;
                                shape.y = shape.audioOriginalY + (shape.audioOriginalHeight - newHeight) / 2;
                                // Update corners for rectangles/images
                                if (shape.corners && shape.corners.length === 4) {
                                    const centerX = shape.audioOriginalX + shape.audioOriginalWidth / 2;
                                    const centerY = shape.audioOriginalY + shape.audioOriginalHeight / 2;
                                    shape.corners[0] = { x: centerX - newWidth / 2, y: centerY - newHeight / 2 };
                                    shape.corners[1] = { x: centerX + newWidth / 2, y: centerY - newHeight / 2 };
                                    shape.corners[2] = { x: centerX + newWidth / 2, y: centerY + newHeight / 2 };
                                    shape.corners[3] = { x: centerX - newWidth / 2, y: centerY + newHeight / 2 };
                                }
                            } else if (shape.radius !== undefined && shape.audioOriginalRadius !== null) {
                                shape.radius = shape.audioOriginalRadius * scale;
                                // Keep center position
                                shape.x = shape.audioOriginalX;
                                shape.y = shape.audioOriginalY;
                            }
                            break;
                            
                        case 'rotation':
                            // Audio reactive rotation
                            if (!shape.rotation) shape.rotation = 0;
                            shape.rotation += volume * 5; // Rotate based on volume
                            if (shape.rotation > Math.PI * 2) shape.rotation -= Math.PI * 2;
                            break;
                            
                        case 'flow':
                            // Audio reactive flow speed
                            if (shape.effect === 'flow') {
                                shape.flowOffset += 0.02 + (volume * 0.1);
                            }
                            break;
                    }
                });
            }
            
            this.draw();
            // Update projector continuously (every frame for smooth updates)
            if (this.projectorWindow && !this.projectorWindow.closed) {
                this.updateProjector();
            }
            // Update GIF overlays
            this.updateAllGifOverlays();
            this.animate();
        });
    }
}

// Initialize app when DOM is ready
function initApp() {
    try {
        console.log('Initializing app...');
        window.app = new ProjectionMappingApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        console.error(error.stack);
        alert('Error initializing application. Please check the console.');
    }
}

// Wait for DOM to be fully ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initApp, 50);
    });
} else {
    // DOM is already ready
    setTimeout(initApp, 50);
}

