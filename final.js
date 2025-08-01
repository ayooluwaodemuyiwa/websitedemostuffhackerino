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
    const hero_canvas = document.getElementById("hero-canvas");
    if (hero_canvas) {
        var w = window.innerWidth;
        var h = window.innerHeight;

        var ctx = hero_canvas.getContext("2d");
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
    // clear screen with transparency instead of solid black
    ctx.clearRect(0, 0, w, h);  // Use clearRect instead of black fillRect
    
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
    // clear screen with transparency instead of solid black
    ctx.clearRect(0, 0, w, h);  // Use clearRect instead of black fillRect
    
    // Draw animated dots
    drawDots(time);
    
    requestAnimationFrame(render);
}

        // Initialize noise and start rendering
        noise.seed(Math.random());
        render();
    }

    // ElevenLabs Voice Integration - Clean and Simple
    class ElevenLabsVoiceIntegration {
        constructor() {
            this.isConversationActive = {
                femi: false,
                sira: false
            };
            this.widgets = {
                femi: null,
                sira: null
            };
            this.initializeButtons();
            this.waitForElevenLabsWidgets();
        }

        initializeButtons() {
            // Find all play buttons for voice demos
            const playButtons = document.querySelectorAll('.play-button');
            
            playButtons.forEach((button, index) => {
                button.addEventListener('click', () => {
                    // Different behavior for different buttons
                    if (index === 0) {
                        // First button - accent transformation demo
                        this.handleAccentDemo();
                    } else if (index === 1) {
                        // Second button - Femi voice agent
                        this.handleVoiceAgentDemo('femi');
                    } else if (index === 2) {
                        // Third button - Sira voice agent
                        this.handleVoiceAgentDemo('sira');
                    }
                });
            });
        }

        waitForElevenLabsWidgets() {
            // Wait for the ElevenLabs widgets to load
            const checkWidgets = () => {
                this.widgets.femi = document.querySelector('#femi-widget');
                this.widgets.sira = document.querySelector('#sira-widget');
                
                if (this.widgets.femi && this.widgets.sira) {
                    console.log('ElevenLabs widgets found and ready');
                    this.setupWidgetEvents();
                } else {
                    // Keep checking every 500ms until widgets are loaded
                    setTimeout(checkWidgets, 500);
                }
            };
            checkWidgets();
        }

        setupWidgetEvents() {
            // Setup events for Femi widget
            if (this.widgets.femi) {
                this.widgets.femi.addEventListener('conversationStarted', () => {
                    this.isConversationActive.femi = true;
                    this.updateButtonState('femi', true);
                    console.log('Conversation started with Femi');
                });

                this.widgets.femi.addEventListener('conversationEnded', () => {
                    this.isConversationActive.femi = false;
                    this.updateButtonState('femi', false);
                    console.log('Conversation ended with Femi');
                });
            }

            // Setup events for Sira widget
            if (this.widgets.sira) {
                this.widgets.sira.addEventListener('conversationStarted', () => {
                    this.isConversationActive.sira = true;
                    this.updateButtonState('sira', true);
                    console.log('Conversation started with Sira');
                });

                this.widgets.sira.addEventListener('conversationEnded', () => {
                    this.isConversationActive.sira = false;
                    this.updateButtonState('sira', false);
                    console.log('Conversation ended with Sira');
                });
            }
        }

        handleAccentDemo() {
            // For the accent transformation demo
            console.log('Accent transformation demo clicked');
            this.showDemoFeedback('accent');
        }

handleVoiceAgentDemo(agent) {
    console.log(`${agent.charAt(0).toUpperCase() + agent.slice(1)} voice agent demo clicked`);
    
    const widget = this.widgets[agent];
    if (widget && widget.shadowRoot) {
        const startBtn = widget.shadowRoot.querySelector('button');
        const endBtn = widget.shadowRoot.querySelector('button[aria-label="End conversation"]');

        if (this.isConversationActive[agent] && endBtn) {
            endBtn.click();
        } else if (startBtn) {
            startBtn.click();
        } else {
            this.showDemoFeedback('loading');
        }
    } else {
        console.warn(`${agent} widget not yet available`);
        this.showDemoFeedback('loading');
    }
}


        updateButtonState(agent, isActive) {
            const playButtons = document.querySelectorAll('.play-button');
            const buttonIndex = agent === 'femi' ? 1 : 2; // Femi is button 1, Sira is button 2
            
            if (playButtons[buttonIndex]) {
                const button = playButtons[buttonIndex];
                if (isActive) {
                    button.style.background = 'var(--primary-pink)';
                    button.style.transform = 'scale(1.1)';
                    button.style.boxShadow = '0 15px 40px rgba(255, 107, 157, 0.5)';
                } else {
                    button.style.background = 'var(--gradient-rainbow)';
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = '0 10px 30px rgba(74, 144, 226, 0.3)';
                }
            }
        }

        showDemoFeedback(type) {
            // Show temporary feedback to user
            const feedback = document.createElement('div');
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 10000;
                border: 2px solid var(--primary-blue);
                text-align: center;
                font-size: 1.1rem;
            `;
            
            const messages = {
                accent: '🎤 Accent transformation demo - Feature coming soon!',
                loading: '⏳ Voice agent loading... Please wait a moment and try again.'
            };
            
            feedback.textContent = messages[type] || 'Demo feature activated!';
            document.body.appendChild(feedback);
            
            // Remove feedback after 3 seconds
            setTimeout(() => {
                if (document.body.contains(feedback)) {
                    document.body.removeChild(feedback);
                }
            }, 3000);
        }
    }

    // Initialize ElevenLabs integration when page loads
    setTimeout(() => {
        window.elevenLabsIntegration = new ElevenLabsVoiceIntegration();
        console.log('ElevenLabs voice integration initialized');
    }, 1000);

});
