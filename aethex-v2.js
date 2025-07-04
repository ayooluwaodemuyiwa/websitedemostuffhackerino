// Define noise module globally first
(function (global) {
    var module = global.noise = {};

    function Grad(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    Grad.prototype.dot2 = function (x, y) {
        return this.x * x + this.y * y;
    };

    Grad.prototype.dot3 = function (x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };

    var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

    var p = [151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    
    var perm = new Array(512);
    var gradP = new Array(512);

    module.seed = function (seed) {
        if (seed > 0 && seed < 1) {
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = p[i] ^ (seed & 255);
            } else {
                v = p[i] ^ ((seed >> 8) & 255);
            }

            perm[i] = perm[i + 256] = v;
            gradP[i] = gradP[i + 256] = grad3[v % 12];
        }
    };

    module.seed(0);

    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;
    var F3 = 1 / 3;
    var G3 = 1 / 6;

    module.simplex2 = function (xin, yin) {
        var n0, n1, n2;
        var s = (xin + yin) * F2;
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var x0 = xin - i + t;
        var y0 = yin - j + t;
        var i1, j1;
        if (x0 > y0) {
            i1 = 1; j1 = 0;
        } else {
            i1 = 0; j1 = 1;
        }
        var x1 = x0 - i1 + G2;
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1 + 2 * G2;
        var y2 = y0 - 1 + 2 * G2;
        i &= 255;
        j &= 255;
        var gi0 = gradP[i + perm[j]];
        var gi1 = gradP[i + i1 + perm[j + j1]];
        var gi2 = gradP[i + 1 + perm[j + 1]];
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot2(x0, y0);
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot2(x1, y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot2(x2, y2);
        }
        return 70 * (n0 + n1 + n2);
    };

    module.simplex3 = function (xin, yin, zin) {
        var n0, n1, n2, n3;
        var s = (xin + yin + zin) * F3;
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);

        var t = (i + j + k) * G3;
        var x0 = xin - i + t;
        var y0 = yin - j + t;
        var z0 = zin - k + t;

        var i1, j1, k1;
        var i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        var x1 = x0 - i1 + G3;
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;

        var x2 = x0 - i2 + 2 * G3;
        var y2 = y0 - j2 + 2 * G3;
        var z2 = z0 - k2 + 2 * G3;

        var x3 = x0 - 1 + 3 * G3;
        var y3 = y0 - 1 + 3 * G3;
        var z3 = z0 - 1 + 3 * G3;

        i &= 255;
        j &= 255;
        k &= 255;
        var gi0 = gradP[i + perm[j + perm[k]]];
        var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
        var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
        var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot3(x0, y0, z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) {
            n3 = 0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
        }
        return 32 * (n0 + n1 + n2 + n3);
    };

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }

    module.perlin2 = function (x, y) {
        var X = Math.floor(x), Y = Math.floor(y);
        x = x - X; y = y - Y;
        X = X & 255; Y = Y & 255;

        var n00 = gradP[X + perm[Y]].dot2(x, y);
        var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
        var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
        var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

        var u = fade(x);

        return lerp(
            lerp(n00, n10, u),
            lerp(n01, n11, u),
            fade(y));
    };

    module.perlin3 = function (x, y, z) {
        var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        x = x - X; y = y - Y; z = z - Z;
        X = X & 255; Y = Y & 255; Z = Z & 255;

        var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
        var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
        var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
        var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
        var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
        var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
        var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
        var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

        var u = fade(x);
        var v = fade(y);
        var w = fade(z);

        return lerp(
            lerp(
                lerp(n000, n100, u),
                lerp(n001, n101, u), w),
            lerp(
                lerp(n010, n110, u),
                lerp(n011, n111, u), w),
            v);
    };

})(this);

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {

    // Create floating particles
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        const navButton = document.querySelector('.nav-buttons .btn.btn-secondary');
        
        if (nav) {
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(0, 0, 0, 0.4)';
                nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                if (navButton) {
                    navButton.style.color = 'white';
                    navButton.style.borderColor = 'white';
                }
            } else {
                nav.style.background = 'rgba(0, 0, 0, 0.75)';
                nav.style.boxShadow = 'none';
            }
        }
    });

    // Pause team scroll on hover
    const teamScroll = document.querySelector('.team-scroll');
    if (teamScroll) {
        teamScroll.addEventListener('mouseenter', () => {
            teamScroll.style.animationPlayState = 'paused';
        });
        teamScroll.addEventListener('mouseleave', () => {
            teamScroll.style.animationPlayState = 'running';
        });
    }

    // Canvas animation - Enhanced version with both sine wave and dots
    const canvas = document.getElementById("canvas");
    if (canvas) {
        var w = window.innerWidth;
        var h = window.innerHeight;

        var ctx = canvas.getContext("2d");
        ctx.canvas.width = w;
        ctx.canvas.height = h;

        var start = performance.now();

        window.onresize = function () {
            w = window.innerWidth;
            h = window.innerHeight;
            ctx.canvas.width = w;
            ctx.canvas.height = h;
        };

        function drawSine(time, angular_freq) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(46, 151, 157, 1)";

            var elapsed = (time - start) / 1000;
            var phase_angle = elapsed * 2;

            var x, y, amplitude;
            for (x = 0; x < w; x++) {
                amplitude = noise.perlin2(x / 100, elapsed) * 200;
                amplitude *= Math.sin(x * 2) * 3;
                y = amplitude * Math.sin(x * angular_freq + phase_angle);
                ctx.lineTo(x, y + h / 2);
            }

            ctx.stroke();
            ctx.closePath();
        }

        function drawDots(time) {
            var elapsed = (time - start) / 1000;
            var dotSize = 3;
            var spacing = 20;
            
            ctx.fillStyle = "rgba(46, 151, 157, 0.6)";
            
            for (var x = 0; x < w; x += spacing) {
                for (var y = 0; y < h; y += spacing) {
                    var noiseValue = noise.perlin3(x / 100, y / 100, elapsed * 0.5);
                    var alpha = Math.abs(noiseValue);
                    var size = dotSize + (noiseValue * 2);
                    
                    if (alpha > 0.3) {
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        function render(time) {
            // clear screen
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(0, 0, w, h);
            
            // Draw animated dots
            drawDots(time);
            
            // Draw sine wave
            drawSine(time, 10);
            
            requestAnimationFrame(render);
        }

        // Initialize noise and start rendering
        noise.seed(Math.random());
        render();
    }

    // Femi Voice Integration - Fixed for Twilio-compatible backend
    class FemiVoice {
        constructor() {
            this.wsUrl = 'wss://triangular-poor-emulators-ayooluwa2.replit.app/media-stream';
            this.ws = null;
            this.audioContext = null;
            this.microphone = null;
            this.processor = null;
            this.connected = false;
            this.streamSid = 'browser-stream-' + Date.now();

            // Find your existing Femi button
            this.button = document.querySelector('.demo-card .play-button');
            if (this.button) {
                this.init();
            }
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
                    // Send start event like Twilio does
                    this.ws.send(JSON.stringify({
                        event: 'start',
                        start: {
                            streamSid: this.streamSid
                        }
                    }));
                    this.startMicrophone();
                };

                this.ws.onmessage = (event) => {
                    console.log('Received message from Femi:', event.data);
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Parsed data:', data);
                        if (data.event === 'media') {
                            this.playAudio(data.media.payload);
                        } else {
                            console.log('Non-media event received:', data.event);
                        }
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('Disconnected from Femi');
                    this.cleanup();
                };

                this.ws.onerror = (error) => {
                    console.error('Connection failed:', error);
                    this.cleanup();
                };

            } catch (error) {
                console.error('Failed to start call:', error);
                this.cleanup();
            }
        }

        async startMicrophone() {
            try {
                console.log('🎤 Starting high-quality PCM microphone...');
                
                // Get high-quality microphone access
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 48000,  // High quality input
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: false,  
                        autoGainControl: false    
                    }
                });

                // Create audio context for raw PCM processing
                this.tempAudioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: 48000
                });

                this.microphone = this.tempAudioContext.createMediaStreamSource(stream);
                
                // Use larger buffer for better quality - 4096 samples = ~85ms at 48kHz
                this.processor = this.tempAudioContext.createScriptProcessor(4096, 1, 1);
                
                this.processor.onaudioprocess = (event) => {
                    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
                        const inputBuffer = event.inputBuffer;
                        const inputData = inputBuffer.getChannelData(0); // Raw Float32 PCM
                        
                        // High-quality resampling 48kHz → 8kHz using linear interpolation
                        const downsampledData = this.resampleLinear(inputData, 48000, 8000);
                        
                        // Conservative gain normalization (only boost quiet audio)
                        let max = Math.max(...downsampledData.map(Math.abs)) || 1;
                        const gain = max < 0.1 ? Math.min(2.0, 0.5 / max) : 1.0; // Only boost if very quiet
                        
                        // Convert Float32 to 16-bit PCM with proper rounding and clamping
                        const pcmData = new Int16Array(downsampledData.length);
                        for (let i = 0; i < downsampledData.length; i++) {
                            // Apply conservative gain and clamp to [-1, 1]
                            const sample = Math.max(-1, Math.min(1, downsampledData[i] * gain));
                            // Round to nearest integer to prevent float errors
                            pcmData[i] = Math.round(sample * 32767);
                        }

                        // Send raw PCM to backend - let Python handle μ-law conversion properly
                        const pcmBytes = new Uint8Array(pcmData.buffer);
                        const base64Audio = btoa(String.fromCharCode(...pcmBytes));
                        
                        const message = {
                            event: "media",
                            streamSid: this.streamSid,
                            media: {
                                payload: base64Audio
                            }
                        };

                        this.ws.send(JSON.stringify(message));
                        console.log('📤 Sent HQ PCM:', downsampledData.length, 'samples @8kHz, gain:', gain.toFixed(3));
                    }
                };

                // Connect the audio processing chain (silent - no self-monitoring)
                this.microphone.connect(this.processor);
                this.processor.connect(this.tempAudioContext.createGain()); // Silent sink - no echo

                console.log('✅ High-quality PCM microphone active - speak to Femi');

            } catch (error) {
                console.error('❌ Microphone access failed:', error);
                this.cleanup();
            }
        }

        // High-quality resampling using linear interpolation
        resampleLinear(inputData, inputRate = 48000, outputRate = 8000) {
            const ratio = inputRate / outputRate;
            const outputLength = Math.floor(inputData.length / ratio);
            const outputData = new Float32Array(outputLength);
            
            for (let i = 0; i < outputLength; i++) {
                const index = i * ratio;
                const low = Math.floor(index);
                const high = Math.min(Math.ceil(index), inputData.length - 1);
                const weight = index - low;
                
                // Linear interpolation between adjacent samples
                const sample = (1 - weight) * inputData[low] + weight * inputData[high];
                outputData[i] = sample;
            }
            
            return outputData;
        }

        async sendCleanAudio(audioBlob) {
            try {
                // Convert the audio blob to a format the backend can handle
                const arrayBuffer = await audioBlob.arrayBuffer();
                
                // Create audio context for conversion
                if (!this.tempAudioContext) {
                    this.tempAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Decode the audio data
                const audioBuffer = await this.tempAudioContext.decodeAudioData(arrayBuffer);
                
                // Get the raw audio data
                const channelData = audioBuffer.getChannelData(0);
                
                // Resample to 8kHz but keep high quality through the process
                const resampledData = this.highQualityResample(channelData, audioBuffer.sampleRate, 8000);
                
                // Convert to 16-bit PCM
                const pcmData = new Int16Array(resampledData.length);
                for (let i = 0; i < resampledData.length; i++) {
                    pcmData[i] = Math.max(-32768, Math.min(32767, resampledData[i] * 32767));
                }

                // Convert to μ-law
                const mulawData = this.simpleMulaw(pcmData);
                const base64Audio = btoa(String.fromCharCode(...mulawData));
                
                // Send to backend
                const message = {
                    event: "media",
                    streamSid: this.streamSid,
                    media: {
                        payload: base64Audio
                    }
                };

                this.ws.send(JSON.stringify(message));
                console.log('📤 Sent HQ audio chunk:', resampledData.length, 'samples');

            } catch (error) {
                console.error('Clean audio sending error:', error);
            }
        }

        // Better resampling that preserves quality for upsampling
        highQualityResample(inputData, inputRate, outputRate) {
            const ratio = inputRate / outputRate;
            const outputLength = Math.floor(inputData.length / ratio);
            const outputData = new Float32Array(outputLength);
            
            // Use simple decimation for downsampling (better for upsampling later)
            for (let i = 0; i < outputLength; i++) {
                const inputIndex = Math.floor(i * ratio);
                outputData[i] = inputData[inputIndex];
            }
            
            return outputData;
        }

        // Much simpler resampling
        simpleResample(inputData, inputRate, outputRate) {
            const ratio = inputRate / outputRate;
            const outputLength = Math.floor(inputData.length / ratio);
            const outputData = new Float32Array(outputLength);
            
            for (let i = 0; i < outputLength; i++) {
                const inputIndex = Math.floor(i * ratio);
                outputData[i] = inputData[inputIndex];
            }
            
            return outputData;
        }

        // Much simpler μ-law conversion
        simpleMulaw(pcmData) {
            const mulawData = new Uint8Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                let sample = pcmData[i];
                // Simple μ-law approximation
                const sign = sample < 0 ? 0x80 : 0x00;
                if (sample < 0) sample = -sample;
                
                sample = Math.min(sample, 32635);
                let exponent = 7;
                
                if (sample >= 256) {
                    let temp = sample >> 8;
                    exponent = 0;
                    while (temp) {
                        temp >>= 1;
                        exponent++;
                    }
                }
                
                const mantissa = (sample >> (exponent + 3)) & 0x0F;
                mulawData[i] = ~(sign | (exponent << 4) | mantissa);
            }
            return mulawData;
        }

        // Convert PCM to μ-law (simplified implementation)
        pcmToMulaw(pcmData) {
            const mulawData = new Uint8Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                mulawData[i] = this.linearToMulaw(pcmData[i]);
            }
            return mulawData;
        }

        linearToMulaw(sample) {
            const MULAW_MAX = 0x1FFF;
            const MULAW_BIAS = 33;
            let sign = (sample >> 8) & 0x80;
            if (sign != 0) sample = -sample;
            if (sample > MULAW_MAX) sample = MULAW_MAX;
            sample = sample + MULAW_BIAS;
            let exponent = 7;
            for (let expMask = 0x4000; (sample & expMask) == 0 && exponent > 0; exponent--, expMask >>= 1) {}
            let mantissa = (sample >> (exponent + 3)) & 0x0F;
            let mulawbyte = ~(sign | (exponent << 4) | mantissa);
            return mulawbyte & 0xFF;
        }

        async playAudio(base64Audio) {
            try {
                console.log('Femi is speaking...');

                // Decode μ-law audio from backend
                const mulawData = atob(base64Audio);
                const mulawArray = new Uint8Array(mulawData.length);
                for (let i = 0; i < mulawData.length; i++) {
                    mulawArray[i] = mulawData.charCodeAt(i);
                }

                // Convert μ-law to PCM
                const pcmArray = this.mulawToPcm(mulawArray);
                
                // Create WAV file from PCM data
                const wavBuffer = this.createWavFile(pcmArray, 8000);
                const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Use simple HTML5 audio for playback
                const audio = new Audio(audioUrl);
                audio.volume = 1.0;
                
                audio.onloadeddata = () => {
                    console.log('Audio loaded, duration:', audio.duration);
                };
                
                audio.onended = () => {
                    console.log('Femi finished speaking');
                    URL.revokeObjectURL(audioUrl);
                };
                
                audio.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    URL.revokeObjectURL(audioUrl);
                };

                // Play the audio
                await audio.play();

            } catch (error) {
                console.error('Audio playback error:', error);
            }
        }

        // Create a proper WAV file from PCM data
        createWavFile(pcmData, sampleRate) {
            const length = pcmData.length;
            const buffer = new ArrayBuffer(44 + length * 2);
            const view = new DataView(buffer);
            
            // WAV file header
            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, length * 2, true);
            
            // PCM data - fixed the variable name
            let offset = 44;
            for (let i = 0; i < length; i++) {
                view.setInt16(offset, pcmData[i], true);  // Fixed: was pcmArray[i]
                offset += 2;
            }
            
            return buffer;
        }

        // Convert μ-law to PCM
        mulawToPcm(mulawData) {
            const pcmData = new Int16Array(mulawData.length);
            for (let i = 0; i < mulawData.length; i++) {
                pcmData[i] = this.mulawToLinear(mulawData[i]);
            }
            return pcmData;
        }

        mulawToLinear(mulawbyte) {
            mulawbyte = ~mulawbyte;
            let sign = (mulawbyte & 0x80);
            let exponent = (mulawbyte >> 4) & 0x07;
            let mantissa = mulawbyte & 0x0F;
            let sample = mantissa << (exponent + 3);
            sample += (0x84 << exponent);
            if (sign != 0) sample = -sample;
            return sample;
        }

        stop() {
            console.log('Ending call with Femi');
            
            // Send stop event
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    event: 'stop',
                    streamSid: this.streamSid
                }));
            }
            
            this.cleanup();
        }

        cleanup() {
            this.connected = false;

            // Close WebSocket
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }

            // Stop MediaRecorder
            if (this.recorder && this.recorder.state !== 'inactive') {
                this.recorder.stop();
                this.recorder = null;
            }

            // Close temp audio context
            if (this.tempAudioContext) {
                this.tempAudioContext.close();
                this.tempAudioContext = null;
            }
        }
    }

    // Initialize Femi Voice when page loads
    setTimeout(() => {
        window.femiVoice = new FemiVoice();
        console.log('Femi voice integration ready');
    }, 1000);

});
