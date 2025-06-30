var w = window.innerWidth;
var h = window.innerHeight;

var canvas = document.getElementById("canvas");
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

function render(time) {
    // clear screen
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, w, h);
    drawSine(time, 10); // angular_freq Join Waitlist= 10
    requestAnimationFrame(render);
}

//----------------------------------------------------------------------------
noise.seed(Math.random());
render();