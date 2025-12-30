// Audio analysis for reactive effects
class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.animationFrame = null;
        this.isRunning = false;
        this.frequency = 0;
        this.volume = 0;
        
        this.setupVisualizer();
    }
    
    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.microphone.connect(this.analyser);
            
            this.isRunning = true;
            this.analyze();
            
            console.log('Audio analyzer started');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        console.log('Audio analyzer stopped');
    }
    
    analyze() {
        if (!this.isRunning) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average frequency and volume
        let sum = 0;
        let max = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
            max = Math.max(max, this.dataArray[i]);
        }
        
        this.volume = max / 255;
        this.frequency = sum / this.dataArray.length / 255;
        
        // Update visualizer
        this.updateVisualizer();
        
        this.animationFrame = requestAnimationFrame(() => this.analyze());
    }
    
    getFrequency() {
        return this.frequency;
    }
    
    getVolume() {
        return this.volume;
    }
    
    getFrequencyData() {
        return this.dataArray;
    }
    
    setupVisualizer() {
        const canvas = document.getElementById('audioCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        this.visualizerCanvas = canvas;
        this.visualizerCtx = ctx;
    }
    
    updateVisualizer() {
        if (!this.visualizerCtx || !this.dataArray) return;
        
        const canvas = this.visualizerCanvas;
        const ctx = this.visualizerCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height;
            
            // Create soft pastel gradient (pink to blue)
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            const intensity = this.dataArray[i] / 255;
            if (intensity > 0.5) {
                gradient.addColorStop(0, 'rgba(255, 182, 193, 0.6)');
                gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.7)');
                gradient.addColorStop(1, 'rgba(173, 216, 230, 0.8)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 182, 193, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 192, 203, 0.5)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            // Add soft glow effect
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(255, 182, 193, 0.4)';
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            ctx.shadowBlur = 0;
            
            x += barWidth;
        }
    }
}

// Initialize audio analyzer
window.audioAnalyzer = new AudioAnalyzer();

