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

// Configuration
const API_BASE_URL = 'https://triangular-poor-emulators-ayooluwa2.replit.app/'; // Replace with your Replit URL

// Agent ID mapping
const AGENT_IDS = {
    'femi': 'femi',  // This sends 'femi' to your backend
    'sira': 'sira'   // This sends 'sira' to your backend
};

// Phone validation function
async function validatePhone(phoneNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/validate-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber })
        });
        return await response.json();
    } catch (error) {
        console.error('Phone validation error:', error);
        return { valid: false, message: 'Unable to validate phone number' };
    }
}

// Make the call function with agent ID
async function initiateCall(callData) {
    try {
        const response = await fetch(`${API_BASE_URL}/initiate-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...callData,
                agent_id: AGENT_IDS[callData.agent] // Pass the specific agent ID
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to initiate call');
        }

        return await response.json();
    } catch (error) {
        console.error('Call initiation error:', error);
        throw error;
    }
}

// Enhanced phone number formatting with international support
function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Auto-add country code for US numbers
    if (value.length > 0 && !value.startsWith('1') && value.length === 10) {
        value = '1' + value;
    }
    
    // Format based on length
    if (value.length >= 11) {
        input.value = value.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    } else if (value.length >= 7) {
        input.value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 4) {
        input.value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
    }
    
    return value;
}

// Real-time validation feedback
function showValidationFeedback(input, result) {
    const parent = input.closest('.form-group') || input.parentElement;
    let feedback = parent.querySelector('.phone-feedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'phone-feedback';
        feedback.style.cssText = `
            font-size: 0.875rem; 
            margin-top: 0.5rem; 
            padding: 0.5rem;
            border-radius: 4px; 
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        parent.appendChild(feedback);
    }
    
    if (result.valid) {
        feedback.innerHTML = `
            <span style="color: #52C41A;">✓</span>
            <span>Valid ${result.country || 'number'} - Ready to call!</span>
        `;
        feedback.style.cssText += 'color: #52C41A; background: rgba(82, 196, 26, 0.1); border: 1px solid rgba(82, 196, 26, 0.3);';
        input.style.borderColor = '#52C41A';
        input.style.boxShadow = '0 0 0 3px rgba(82, 196, 26, 0.1)';
    } else {
        feedback.innerHTML = `
            <span style="color: #FF6B9D;">✗</span>
            <span>${result.message}</span>
        `;
        feedback.style.cssText += 'color: #FF6B9D; background: rgba(255, 107, 157, 0.1); border: 1px solid rgba(255, 107, 157, 0.3);';
        input.style.borderColor = '#FF6B9D';
        input.style.boxShadow = '0 0 0 3px rgba(255, 107, 157, 0.1)';
    }
}

// Enhanced call status with loading states
function showCallStatus(message, status, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    let statusElement = modal.querySelector('.call-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'call-status';
        statusElement.style.cssText = `
            margin: 1rem 0; 
            padding: 1rem; 
            border-radius: 8px;
            font-weight: 500; 
            text-align: center; 
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        `;
        const form = modal.querySelector('.agent-form');
        if (form) form.parentNode.insertBefore(statusElement, form);
    }
    
    // Add loading spinner for initiated status
    if (status === 'initiated') {
        statusElement.innerHTML = `
            <div style="width: 20px; height: 20px; border: 2px solid #2e979d; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>${message}</span>
        `;
        
        // Add spinner animation
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        statusElement.textContent = message;
    }
    
    statusElement.className = `call-status ${status}`;
    statusElement.style.display = 'flex';
    
    // Status-specific styling
    const colors = {
        'initiated': 'background: rgba(46, 151, 157, 0.1); color: #2e979d; border: 1px solid rgba(46, 151, 157, 0.3);',
        'ringing': 'background: rgba(255, 193, 7, 0.1); color: #856404; border: 1px solid rgba(255, 193, 7, 0.3);',
        'answered': 'background: rgba(82, 196, 26, 0.1); color: #52C41A; border: 1px solid rgba(82, 196, 26, 0.3);',
        'failed': 'background: rgba(255, 107, 157, 0.1); color: #FF6B9D; border: 1px solid rgba(255, 107, 157, 0.3);'
    };
    statusElement.style.cssText += colors[status] || colors.initiated;
}

// Main form submission handler
async function handleCallFormSubmit(form, agent, modalId) {
    const name = form.querySelector('input[placeholder*="Name"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const phone = form.querySelector('input[type="tel"]').value.trim();

    // Clear previous status
    const existingStatus = form.parentNode.querySelector('.call-status');
    if (existingStatus) existingStatus.remove();

    // Enhanced validation
    if (!name) {
        showCallStatus('Please enter your name.', 'failed', modalId);
        return;
    }
    if (!email) {
        showCallStatus('Please enter your email address.', 'failed', modalId);
        return;
    }
    if (!phone) {
        showCallStatus('Please enter your phone number.', 'failed', modalId);
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showCallStatus('Please enter a valid email address.', 'failed', modalId);
        return;
    }

    // Phone validation
    showCallStatus('Validating phone number...', 'initiated', modalId);
    const phoneValidation = await validatePhone(phone);
    
    if (!phoneValidation.valid) {
        showCallStatus(`Invalid phone: ${phoneValidation.message}`, 'failed', modalId);
        return;
    }

    // Disable form during call
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input, button');
    inputs.forEach(input => input.disabled = true);
    
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Calling...';

    showCallStatus(`Connecting you with ${agent.charAt(0).toUpperCase() + agent.slice(1)}...`, 'initiated', modalId);

    try {
        const callData = {
            name: name,
            email: email,
            phone: phoneValidation.e164 || phoneValidation.formatted || phone,
            agent: agent.toLowerCase()
        };

        console.log('Initiating call with data:', callData);
        const result = await initiateCall(callData);
        
        showCallStatus(
            `🎉 Call initiated! ${agent.charAt(0).toUpperCase() + agent.slice(1)} will call you at ${phoneValidation.formatted || phone} in about ${result.estimated_time || '30-60 seconds'}.`, 
            'answered', 
            modalId
        );
        
        // Reset form after successful call
        setTimeout(() => {
            inputs.forEach(input => input.disabled = false);
            submitBtn.textContent = originalBtnText;
            form.reset();
            
            // Clear validation feedback
            const feedback = form.querySelector('.phone-feedback');
            if (feedback) feedback.remove();
        }, 5000);

    } catch (error) {
        console.error('Call failed:', error);
        showCallStatus(`Failed to connect: ${error.message}`, 'failed', modalId);
        
        // Re-enable form immediately on error
        inputs.forEach(input => input.disabled = false);
        submitBtn.textContent = originalBtnText;
    }
}

// Setup phone input with enhanced formatting
function setupPhoneInput(phoneInput) {
    let debounceTimer;
    
    // Add placeholder and styling
    phoneInput.placeholder = '+1 (555) 123-4567';
    phoneInput.style.transition = 'all 0.3s ease';
    
    phoneInput.addEventListener('input', (e) => {
        formatPhoneInput(e.target);
        
        // Clear existing validation
        const feedback = e.target.parentElement.querySelector('.phone-feedback');
        if (feedback) feedback.remove();
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const cleaned = e.target.value.replace(/\D/g, '');
            if (cleaned.length >= 10) {
                const result = await validatePhone(e.target.value);
                showValidationFeedback(phoneInput, result);
            }
        }, 800);
    });
    
    // Reset styling on focus
    phoneInput.addEventListener('focus', () => {
        phoneInput.style.borderColor = '';
        phoneInput.style.boxShadow = '';
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing complete voice agent system...');

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

        var ctx2 = hero_canvas.getContext("2d");
        ctx2.canvas.width = w;
        ctx2.canvas.height = h;

        var start = performance.now();

        window.onresize = function () {
            w = window.innerWidth;
            h = window.innerHeight;
            ctx2.canvas.width = w;
            ctx2.canvas.height = h;
        };

        function drawSine(time, angular_freq) {
            ctx2.beginPath();
            ctx2.strokeStyle = "rgba(46, 151, 157, 1)";

            var elapsed = (time - start) / 1000;
            var phase_angle = elapsed * 2;

            var x, y, amplitude;
            for (x = 0; x < w; x++) {
                amplitude = noise.perlin2(x / 100, elapsed) * 200;
                amplitude *= Math.sin(x * 2) * 3;
                y = amplitude * Math.sin(x * angular_freq + phase_angle);
                ctx2.lineTo(x, y + h / 2);
            }

            ctx2.stroke();
            ctx2.closePath();
        }

        function drawDots(time) {
            var elapsed = (time - start) / 1000;
            var dotSize = 3;
            var spacing = 20;
            
            ctx2.fillStyle = "rgba(46, 151, 157, 0.6)";
            
            for (var x = 0; x < w; x += spacing) {
                for (var y = 0; y < h; y += spacing) {
                    var noiseValue = noise.perlin3(x / 100, y / 100, elapsed * 0.5);
                    var alpha = Math.abs(noiseValue);
                    var size = dotSize + (noiseValue * 2);
                    
                    if (alpha > 0.3) {
                        ctx2.globalAlpha = alpha;
                        ctx2.beginPath();
                        ctx2.arc(x, y, size, 0, Math.PI * 2);
                        ctx2.fill();
                    }
                }
            }
            ctx2.globalAlpha = 1;
        }

        function render(time) {
            // Clear screen with transparency instead of solid black
            ctx2.clearRect(0, 0, w, h);
            
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

    // Second canvas animation (dots only)
    const canvas = document.getElementById("canvas");
    if (canvas) {
        var w2 = window.innerWidth;
        var h2 = window.innerHeight;

        var ctx = canvas.getContext("2d");
        ctx.canvas.width = w2;
        ctx.canvas.height = h2;

        var start2 = performance.now();

        window.addEventListener('resize', function () {
            w2 = window.innerWidth;
            h2 = window.innerHeight;
            ctx.canvas.width = w2;
            ctx.canvas.height = h2;
        });

        function drawDots2(time) {
            var elapsed = (time - start2) / 1000;
            var dotSize = 3;
            var spacing = 20;
            
            ctx.fillStyle = "rgba(46, 151, 157, 0.6)";
            
            for (var x = 0; x < w2; x += spacing) {
                for (var y = 0; y < h2; y += spacing) {
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

        function render2(time) {
            // Clear screen with transparency instead of solid black
            ctx.clearRect(0, 0, w2, h2);
            
            // Draw animated dots
            drawDots2(time);
            
            requestAnimationFrame(render2);
        }

        // Initialize noise and start rendering
        noise.seed(Math.random());
        render2();
    }

    // Microphone popup functionality (first button - accent demo)
    const micButton = document.querySelector('.demo-card .play-button');
    const micPopup = document.getElementById('mic-popup-container');
    const closeMic = document.querySelector('.close-mic-popup');

    if (micButton && micPopup && closeMic) {
        micButton.addEventListener('click', () => {
            console.log('Accent demo button clicked');
            micPopup.style.display = 'block';
        });

        closeMic.addEventListener('click', () => {
            micPopup.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (
                micPopup.style.display === 'block' &&
                !micPopup.contains(e.target) &&
                !micButton.contains(e.target)
            ) {
                micPopup.style.display = 'none';
            }
        });
    }

    // FIXED: Agent modal functionality for Femi and Sira
    const demoCardGrid = document.querySelector('.demo-card-grid');
    
    if (demoCardGrid) {
        // Get Femi and Sira buttons specifically
        const femiDiv = demoCardGrid.children[0]; // First div in grid
        const siraDiv = demoCardGrid.children[1]; // Second div in grid
        
        const femiButton = femiDiv ? femiDiv.querySelector('.play-button') : null;
        const siraButton = siraDiv ? siraDiv.querySelector('.play-button') : null;
        
        console.log('Femi button found:', !!femiButton);
        console.log('Sira button found:', !!siraButton);

        // Handle Femi button click
        if (femiButton) {
            femiButton.addEventListener('click', () => {
                console.log('Femi button clicked');
                const modal = document.getElementById('agent1');
                if (modal) {
                    modal.style.display = 'flex';
                    console.log('Femi modal opened');
                } else {
                    console.log('agent1 modal not found');
                }
            });
        }

        // Handle Sira button click
        if (siraButton) {
            siraButton.addEventListener('click', () => {
                console.log('Sira button clicked');
                const modal = document.getElementById('agent2');
                if (modal) {
                    modal.style.display = 'flex';
                    console.log('Sira modal opened');
                } else {
                    console.log('agent2 modal not found');
                }
            });
        }
    }

    // Handle close button clicks for both modals
    const closeAgentBtns = document.querySelectorAll('.close-agent-popup');
    closeAgentBtns.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            const agent1Modal = document.getElementById('agent1');
            const agent2Modal = document.getElementById('agent2');
            
            if (agent1Modal) agent1Modal.style.display = 'none';
            if (agent2Modal) agent2Modal.style.display = 'none';
        });
    });

    // Click outside to close modals
    document.addEventListener('click', (e) => {
        const agent1Modal = document.getElementById('agent1');
        const agent2Modal = document.getElementById('agent2');
        
        if (agent1Modal && agent1Modal.style.display === 'flex' && 
            !agent1Modal.querySelector('.agent-popup').contains(e.target)) {
            agent1Modal.style.display = 'none';
        }
        
        if (agent2Modal && agent2Modal.style.display === 'flex' && 
            !agent2Modal.querySelector('.agent-popup').contains(e.target)) {
            agent2Modal.style.display = 'none';
        }
    });

    // Setup phone inputs in both modals
    const phoneInputs = document.querySelectorAll('#agent1 input[type="tel"], #agent2 input[type="tel"]');
    phoneInputs.forEach(setupPhoneInput);
    
    // Setup form submissions with proper agent mapping
    const agent1Form = document.querySelector('#agent1 .agent-form');
    const agent2Form = document.querySelector('#agent2 .agent-form');
    
    if (agent1Form) {
        agent1Form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCallFormSubmit(agent1Form, 'femi', 'agent1');
        });
    }
    
    if (agent2Form) {
        agent2Form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCallFormSubmit(agent2Form, 'sira', 'agent2');
        });
    }

    console.log('Complete voice agent system with animations initialized successfully');
});
