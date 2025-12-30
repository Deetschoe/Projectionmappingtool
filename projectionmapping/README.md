# Projection Mapping Web Tool

A web-based projection mapping tool for Mac that allows you to map shapes and effects onto a wall using your projector.

## Project Structure

```
projectionmapping/
├── index.html          # Main application interface
├── projector.html      # Projector window (fullscreen display)
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── main.js         # Core application logic
│   ├── audio.js        # Audio analysis for reactive effects
│   └── projector.js    # Projector window logic
├── vercel.json         # Vercel deployment configuration
└── README.md           # This file
```

## Features

- **Webcam Capture**: Take a photo of your wall to use as a reference
- **Shape Editor**: Create and manipulate rectangles, circles, and custom paths
- **Image Support**: Upload, paste, or search for images with corner warping
- **GIF Support**: Animated GIFs with blend modes
- **Dual Window System**: Control interface on your laptop, fullscreen display for projector
- **Keyboard Mapping**: Map each shape to a keyboard key for live control
- **Effects System**: 
  - Hide/Show shapes
  - Pulse animation
  - Color change
  - Flow animation (rotation)
  - Glow effects
  - Blur effects
- **Audio Reactive Mode**: Automatically change colors, opacity, size, rotation, or flow based on microphone input
- **Blend Modes**: Screen, multiply, overlay, and more for images/GIFs
- **After Effects-like Controls**: Familiar keyboard shortcuts (V, H, Z, P, Space)
- **Undo/Redo**: Full history system
- **Copy/Paste**: Duplicate shapes with Ctrl+C/Ctrl+V
- **Save/Load**: Export and import projects as JSON

## Usage

1. **Open the tool**: Open `index.html` in your web browser (or deploy to Vercel)
2. **Capture wall photo**: Click "Capture Wall Photo" to take a picture of your wall
3. **Open projector window**: Click "Open Projector Window" to create the fullscreen display
4. **Add shapes**: Use the buttons to add rectangles, circles, images, or draw with the pen tool
5. **Position shapes**: Click and drag shapes to position them on your wall
6. **Warp corners**: Drag corner handles to warp shapes to fit your wall
7. **Map keybinds**: Select a shape and press a key in the keybind input field
8. **Trigger effects**: Press the mapped key to trigger the shape's effect
9. **Enable audio mode**: Toggle audio reactive mode to have visuals react to sound

## Keyboard Shortcuts

- **V** - Selection Tool (drag shapes)
- **H** - Hand Tool (pan canvas)
- **Z** - Zoom Tool (scroll to zoom)
- **P** - Pen Tool (draw custom paths)
- **S** - Scale Tool (resize shapes)
- **Space** - Hand Tool (hold to pan)
- **⌘+Z / Ctrl+Z** - Undo
- **⌘+Shift+Z / Ctrl+Shift+Z** - Redo
- **⌘+C / Ctrl+C** - Copy selected shape
- **⌘+V / Ctrl+V** - Paste copied shape
- **Delete / Backspace** - Delete selected shape

## Controls

### Shape Properties
- **Keybind**: Map a keyboard key to trigger the shape
- **Effect**: Choose what happens when the key is pressed
  - Hide/Show: Toggle visibility
  - Pulse: Animate with pulsing effect
  - Color: Cycle through colors
  - Flow: Continuous rotation animation
  - Glow: Add glow effect
  - Blur: Add blur effect
- **Color**: Set the shape's color
- **Opacity**: Adjust transparency (0-100%)
- **Blend Mode**: (Images/GIFs only) Screen, multiply, overlay, etc.

### Audio Mode
- Enable "Audio Reactive" to have shapes automatically react to microphone input
- Choose what to react to: Color, Opacity, Size, Rotation, or Flow Speed
- The audio visualizer shows the frequency spectrum

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Webcam and microphone permissions (for capture and audio reactive features)
- HTTPS required for webcam/microphone (Vercel provides this automatically)
- For best results, use Chrome or Firefox

## Deployment

See `DEPLOY.md` for detailed deployment instructions to Vercel.

Quick deploy:
1. Push code to GitHub
2. Import repository in Vercel
3. Deploy (no build step needed - it's a static site!)

## Tips

- Position your projector first, then capture the wall photo
- Use the Hand tool (H) to pan around large canvases
- Use the Zoom tool (Z) to get precise positioning
- Map different keys to different shapes for live performance
- Enable audio mode for automatic reactive visuals
- Use blend modes on images/GIFs for creative effects
- Save your projects frequently to avoid losing work

## Development

This is a vanilla JavaScript application with no build step required. Simply:
- Edit HTML files in the root
- Edit CSS in `css/`
- Edit JavaScript in `js/`
- Test locally with `./start.sh` or any HTTP server
