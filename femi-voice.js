// Femi Voice Integration
// Replace 'your-replit-name.your-username.repl.co' with your actual Replit URL

class FemiVoice {
    constructor() {
        // Your Replit WebSocket URL - CHANGE THIS!
        this.wsUrl = 'wss://https://triangular-poor-emulators-ayooluwa2.replit.app/media-stream';
        this.ws = null;
        this.recorder = null;
        this.connected = false;

        // Find your existing Femi button
        this.button = document.querySelector('.play-button');
        this.init();
    }

    init() {
        // Add click handler to your existing button
        this.button.addEventListener('click', () => this.toggle());
    }

    async toggle() {
        if (this.connected) {
            this.stop();
        } else {
            await this.start();
        }
    }

    async start() {
        try {
            console.log('Connecting to Femi...');

            // Connect to your Replit backend
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('Connected to Femi');
                this.connected = true;
                this.startMicrophone();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.event === 'media') {
                    this.playAudio(data.media.payload);
                }
            };

            this.ws.onclose = () => {
                console.log('Disconnected from Femi');
                this.cleanup();
            };

            this.ws.onerror = () => {
                console.error('Connection failed');
                this.cleanup();
            };

        } catch (error) {
            console.error('Failed to start call:', error);
            this.cleanup();
        }
    }

    async startMicrophone() {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 8000,
                    channelCount: 1
                }
            });

            // Start recording
            this.recorder = new MediaRecorder(stream);
            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.connected) {
                    this.sendAudio(event.data);
                }
            };
            this.recorder.start(20); // 20ms chunks

            console.log('Microphone active - speak to Femi');

        } catch (error) {
            console.error('Microphone access failed:', error);
            this.cleanup();
        }
    }

    async sendAudio(audioBlob) {
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            // Send audio to your backend in the format it expects
            const message = {
                event: "media",
                media: {
                    payload: base64Audio
                }
            };

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
            }

        } catch (error) {
            console.error('Audio sending error:', error);
        }
    }

    async playAudio(base64Audio) {
        try {
            console.log('Femi is speaking...');

            // Decode and play audio from backend
            const audioData = atob(base64Audio);
            const audioArray = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
            }

            const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                console.log('Femi finished speaking');
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error('Audio playback error:', error);
        }
    }

    stop() {
        console.log('Ending call with Femi');
        this.cleanup();
    }

    cleanup() {
        this.connected = false;

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Stop recording
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
            this.recorder.stream.getTracks().forEach(track => track.stop());
            this.recorder = null;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        window.femiVoice = new FemiVoice();
        console.log('Femi voice integration ready');
    }, 1000);
});