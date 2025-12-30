# Projection Mapping Web Tool

A web-based projection mapping tool for Mac that allows you to map shapes and effects onto a wall using your projector.

## Features

- **Webcam Capture**: Take a photo of your wall to use as a reference
- **Shape Editor**: Create and manipulate rectangles, circles, and polygons
- **Dual Window System**: Control interface on your laptop, fullscreen display for projector
- **Keyboard Mapping**: Map each shape to a keyboard key for live control
- **Effects System**: 
  - Hide/Show shapes
  - Pulse animation
  - Color change
  - Flow animation
- **Audio Reactive Mode**: Automatically change colors based on microphone input
- **After Effects-like Controls**: Familiar keyboard shortcuts (V, H, Z, Space)

## Usage

1. **Open the tool**: Open `index.html` in your web browser
2. **Capture wall photo**: Click "Capture Wall Photo" to take a picture of your wall
3. **Open projector window**: Click "Open Projector Window" to create the fullscreen display
4. **Add shapes**: Use the buttons to add rectangles, circles, or polygons
5. **Position shapes**: Click and drag shapes to position them on your wall
6. **Map keybinds**: Select a shape and press a key in the keybind input field
7. **Trigger effects**: Press the mapped key to trigger the shape's effect
8. **Enable audio mode**: Toggle audio reactive mode to have colors change with sound

## Keyboard Shortcuts

- **V** - Selection Tool (drag shapes)
- **H** - Hand Tool (pan canvas)
- **Z** - Zoom Tool (scroll to zoom)
- **Space** - Play/Pause timeline
- **⌘+Z** - Undo (coming soon)
- **⌘+Shift+Z** - Redo (coming soon)

## Controls

### Shape Properties
- **Keybind**: Map a keyboard key to trigger the shape
- **Effect**: Choose what happens when the key is pressed
  - Hide/Show: Toggle visibility
  - Pulse: Animate with pulsing effect
  - Color: Cycle through colors
  - Flow: Continuous rotation animation
- **Color**: Set the shape's color
- **Opacity**: Adjust transparency

### Timeline
- Use the play/pause/stop buttons to control playback
- Drag the timeline slider to scrub through time

### Audio Mode
- Enable "Audio Reactive" to have shapes automatically change colors based on microphone input
- The audio visualizer shows the frequency spectrum

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Webcam and microphone permissions
- For best results, use Chrome or Firefox

## Tips

- Position your projector first, then capture the wall photo
- Use the Hand tool (H) to pan around large canvases
- Use the Zoom tool (Z) to get precise positioning
- Map different keys to different shapes for live performance
- Enable audio mode for automatic reactive visuals


