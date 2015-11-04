(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
(function(){
    var animationFrame;
    var deg_to_rad = Math.PI / 180.0;
    var depth_start = 10;
    var n = 6;
    var zoom = 5;
    var rotation = 0;
    var curl = 0;
    var twist = 0;
    var a_curl = .1;
    var a_twist = 0;
    var next = {};
    var rgb;
    var elem = document.getElementById('bgcanvas');
    var ctx = elem.getContext('2d');
    var last = fps_tick = Date.now();

    var reset = function() {
        if(window.location.hash) {
            var parts = window.location.hash.substr(1).split(':');
            depth_start = parts[0];
            n           = parts[1];
            zoom        = parts[2];
            rotation    = parts[3];
            a_curl      = parseFloat(parts[4]);
            a_twist     = parseFloat(parts[5]);
        }

        depth_start = Math.min(15, depth_start);
        depth_start = Math.max(1, depth_start);
        zoom = Math.min(10, zoom);
        zoom = Math.max(1, zoom);
        n = Math.max(1, n);
        n = Math.min(48, n);
        rotation = Math.max(0, rotation);
        rotation = Math.min(360, rotation);
        twist = 0;
        curl = 1080;

        $('#depth:not(:focus)').val(depth_start);
        $('#n:not(:focus)').val(n);
        $('#zoom:not(:focus)').val(zoom);
        $('#rotation:not(:focus)').val(rotation);
        $('#a_curl:not(:focus)').val(a_curl);
        $('#a_twist:not(:focus)').val(a_twist);

        elem.width = w = window.innerWidth;
        elem.height = h = window.innerHeight;

        window.cancelAnimationFrame(animationFrame);
    }

    reset();

    var drawFractal = function() {
        ctx.rect(0,0,elem.width,elem.height);
        ctx.fillStyle="black";
        ctx.fill();
        ctx.lineWidth = .4;
        if(animationFrame) {
            window.cancelAnimationFrame(animationFrame);
        }
        function drawTree(x1, y1, angle, depth, dangle, length){
            var dcurl = curl * (depth / depth_start);
            var x2 = x1 + (Math.cos(angle * deg_to_rad) * depth * length);
            var y2 = y1 + (Math.sin(angle * deg_to_rad) * depth * length);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            if(depth>1) {
                next[depth - 1].push([x2, y2, angle - (dangle + dcurl) + twist, depth - 1, dangle, length]);
                next[depth - 1].push([x2, y2, angle + (dangle + dcurl) + twist, depth - 1, dangle, length]);
            }
        }
        for(i=0; i<depth_start; i++) {
            next[i] = [];
        }
        var start = Date.now();
        for(i=0; i<n; i++) {
            rgb = HSLtoRGB([1, .8, .5]);
            ctx.strokeStyle = "rgba("+parseInt(rgb[0])+","+parseInt(rgb[1])+","+parseInt(rgb[2])+","+.75+")";
            ctx.beginPath();
            drawTree(w/2, h/2, i*(360/n) + (rotation/n),  depth_start, 360 / n, elem.height/(zoom*n));
            ctx.closePath();
            ctx.stroke();
        }
        for(i=depth_start; i > 0; i--) {
            rgb = HSLtoRGB([(i/depth_start), .8, .5]);
            ctx.strokeStyle = "rgba("+parseInt(rgb[0])+","+parseInt(rgb[1])+","+parseInt(rgb[2])+","+.75+")";
            ctx.beginPath();
            for(j in next[i]) {
                drawTree(next[i][j][0], next[i][j][1], next[i][j][2], next[i][j][3], next[i][j][4], next[i][j][5]);
            }
            ctx.closePath();
            ctx.stroke();
        }

        curl  = (curl < 360*depth_start ? curl : curl - 360*depth_start) + a_curl;
        twist = (twist < 360 ? twist : twist - 360) + a_twist;

        animationFrame = window.requestAnimationFrame(drawFractal);
        var now = Date.now();
        if(fps_tick + 1000 < now) {
            $('#fps').html(parseInt(1000/(now - last)) + " fps");
            fps_tick = now;
        }
        last = now;
    };
    var bgtimeout = null;
    $(window).resize(function(){
        clearTimeout(bgtimeout);
        bgtimeout = setTimeout(function(){
            elem.width = w = window.innerWidth;
            elem.height = h = window.innerHeight;
            window.cancelAnimationFrame(animationFrame);
            drawFractal();
        }, 500);
    });
    $('#control').on('change', 'input,select', function(){
        clearTimeout(bgtimeout);
        bgtimeout = setTimeout(function(){
            var parts = [
                $('#depth').val(),
                $('#n').val(),
                $('#zoom').val(),
                $('#rotation').val(),
                $('#a_curl').val(),
                $('#a_twist').val()
            ];
            window.location.hash = parts.join(':');
        }, 500);
    });
    window.onhashchange = function() {
        reset();
        bgtimeout = setTimeout(function(){
            window.location.reload();
        }, 500);
    };
    var HSLtoRGB = function (hsl) {
        var h = hsl[0],
            s = hsl[1],
            l = hsl[2],
            r, g, b,
            hue2rgb = function (p, q, t){
                if (t < 0) {
                    t += 1;
                }
                if (t > 1) {
                    t -= 1;
                }
                if (t < 1/6) {
                    return p + (q - p) * 6 * t;
                }
                if (t < 1/2) {
                    return q;
                }
                if (t < 2/3) {
                    return p + (q - p) * (2/3 - t) * 6;
                }
                return p;
            };
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var
            q = l < 0.5 ? l * (1 + s) : l + s - l * s,
            p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [r * 0xFF, g * 0xFF, b * 0xFF];
    };
    drawFractal(true);
})();