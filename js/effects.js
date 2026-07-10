/* ============================================================
   Creative Network · effects.js
   Cursor smoke for the Artists block — a faithful port of the
   setaprint.ch fluid: a real GPU Navier–Stokes simulation, not
   noise-shaped blobs.

   Pipeline per frame (all at ¼ resolution, half-float targets):
     1. advect velocity (MacCormack back/forward trace, ×0.997)
     2. + inject velocity under the pointer (additive soft quad)
     3. + inject dye     under the pointer (gradient-sampled color)
     4. divergence → 16 Jacobi iterations of the pressure Poisson
     5. subtract pressure gradient  → divergence-free velocity
     6. advect dye through the velocity field (decay 0.99)
     7. composite dye to screen + static grain

   The pointer is a blend of the real cursor and a noise-driven
   "fake pointer" that keeps the smoke alive while idle — exactly
   the setaprint resting behaviour. The dye colors come from
   setaprint's own 512×1 gradient strip (embedded below).

   Public API (unchanged): window.CNEffects
     mount(canvas) · setActive(bool) · setProgress(0..1)
   ============================================================ */
(function () {
  "use strict";

  var RESOLUTION = 0.25; // sim runs at ¼ of the canvas pixels
  var ITERATIONS = 16;   // pressure Poisson iterations

  /* setaprint's default dye gradient (512×1 PNG, embedded verbatim) */
  var GRADIENT_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAABCAYAAACouxZ2AAAAAXNSR0IArs4c6QAAAR5JREFUSEvtVNl1xEAIE/Sw/beQBjPkcZm5c30m/sHsCIHEeOn1ehMiQj4igv/87/gBCMACUMTnvYFYICQWn/PEUQMYAE24hUtxXr/nKx7Dsd4/gWgc+hbPlY/bomXsO/V79MR83GCfg/JsdedcB56uxvu6P6t/6Yeeu4+pf92F1jvuzBfz2PzzLvv+4950/2ZZym2/ycV5bAUdz5ybnFufjkdxLj/m/Eaude8dXv/bfsJj/pz6HnToCrIur+SVZ6cv5v3Ur4Ofpl+v1ZlHP38BoxFDQBCLmpNFIUKLuMVlTeDbloNRv3uPHlc9vo7LWZPnxHfHRb9BX+nu9bo/7sfgT+h9zjOfYs1RHKMPoy/uee1k9a/fzQ1XO5376cwfQQkCZ3rauhMAAAAASUVORK5CYII=";

  var VERT_FS =
    "attribute vec2 aPos; varying vec2 vUv;" +
    "void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }";

  var VERT_PT =
    "attribute vec2 aPos; varying vec2 vUv;" +
    "uniform vec2 uCenter; uniform vec2 uSize;" +
    "void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos*uSize*0.5+uCenter,0.,1.); }";

  /* velocity advection — setaprint advection.frag */
  var FRAG_ADVECT =
    "precision highp float; uniform sampler2D velocity; uniform vec2 size; uniform float delta; varying vec2 vUv;" +
    "void main(){" +
    "  vec2 ratio = max(size.x,size.y)/size;" +
    "  vec2 vel_old = texture2D(velocity, vUv).xy;" +
    "  vec2 spot_old = vUv - vel_old*delta*ratio;" +
    "  vec2 vel_new1 = texture2D(velocity, spot_old).xy;" +
    "  vec2 spot_new2 = spot_old + vel_new1*delta*ratio;" +
    "  vec2 error = spot_new2 - vUv;" +
    "  vec2 spot_new3 = vUv - error/2.0;" +
    "  vec2 vel_2 = texture2D(velocity, spot_new3).xy;" +
    "  vec2 spot_old2 = spot_new3 - vel_2*delta*ratio;" +
    "  gl_FragColor = vec4(texture2D(velocity, spot_old2).xy*0.997, 0.0, 1.0);" +
    "}";

  /* pointer velocity splat — setaprint addVelocity.frag */
  var FRAG_ADDVEL =
    "precision highp float; uniform vec2 uForce; varying vec2 vUv;" +
    "void main(){" +
    "  vec2 circle = (vUv-0.5)*2.0;" +
    "  float d = 1.0-min(length(circle),1.0); d *= d;" +
    "  gl_FragColor = vec4(uForce, 0.0, d);" +
    "}";

  /* pointer dye splat — setaprint addDye.frag */
  var FRAG_ADDDYE =
    "precision highp float; uniform sampler2D grad; uniform float uOpacity; uniform float uTime; uniform float uShift; varying vec2 vUv;" +
    "void main(){" +
    "  vec2 circle = (vUv-0.5)*2.0;" +
    "  float d = 1.0-min(length(circle),1.0); d *= d;" +
    "  float c = (cos(uTime*0.0005)+1.0)*0.5;" +
    "  vec3 col = texture2D(grad, vec2(fract(c+uShift), 0.5)).rgb;" +
    "  gl_FragColor = vec4(col, d*uOpacity);" +
    "}";

  var FRAG_DIV =
    "precision highp float; uniform sampler2D velocity; uniform float delta; uniform vec2 cellSize; varying vec2 vUv;" +
    "void main(){" +
    "  float x0 = texture2D(velocity, vUv-vec2(cellSize.x,0.)).x;" +
    "  float x1 = texture2D(velocity, vUv+vec2(cellSize.x,0.)).x;" +
    "  float y0 = texture2D(velocity, vUv-vec2(0.,cellSize.y)).y;" +
    "  float y1 = texture2D(velocity, vUv+vec2(0.,cellSize.y)).y;" +
    "  gl_FragColor = vec4(((x1-x0)+(y1-y0))/2.0/delta);" +
    "}";

  var FRAG_POISSON =
    "precision highp float; uniform sampler2D pressure; uniform sampler2D divergence; uniform vec2 cellSize; varying vec2 vUv;" +
    "void main(){" +
    "  float p0 = texture2D(pressure, vUv+vec2(cellSize.x*2.,0.)).r;" +
    "  float p1 = texture2D(pressure, vUv-vec2(cellSize.x*2.,0.)).r;" +
    "  float p2 = texture2D(pressure, vUv+vec2(0.,cellSize.y*2.)).r;" +
    "  float p3 = texture2D(pressure, vUv-vec2(0.,cellSize.y*2.)).r;" +
    "  float div = texture2D(divergence, vUv).r;" +
    "  gl_FragColor = vec4((p0+p1+p2+p3)/4.0 - div);" +
    "}";

  var FRAG_PRESSURE =
    "precision highp float; uniform sampler2D pressure; uniform sampler2D velocity; uniform vec2 cellSize; uniform float delta; varying vec2 vUv;" +
    "void main(){" +
    "  float p0 = texture2D(pressure, vUv+vec2(cellSize.x,0.)).r;" +
    "  float p1 = texture2D(pressure, vUv-vec2(cellSize.x,0.)).r;" +
    "  float p2 = texture2D(pressure, vUv+vec2(0.,cellSize.y)).r;" +
    "  float p3 = texture2D(pressure, vUv-vec2(0.,cellSize.y)).r;" +
    "  vec2 v = texture2D(velocity, vUv).xy;" +
    "  gl_FragColor = vec4(v - vec2(p0-p1,p2-p3)*0.5*delta, 0.0, 1.0);" +
    "}";

  /* dye advection — same MacCormack trace, with decay */
  var FRAG_DYE =
    "precision highp float; uniform sampler2D dye; uniform sampler2D velocity; uniform vec2 size; uniform float delta; uniform float decay; varying vec2 vUv;" +
    "void main(){" +
    "  vec2 ratio = max(size.x,size.y)/size;" +
    "  vec2 vel_old = texture2D(velocity, vUv).xy;" +
    "  vec2 spot_old = vUv - vel_old*delta*ratio;" +
    "  vec2 vel_new1 = texture2D(velocity, spot_old).xy;" +
    "  vec2 spot_new2 = spot_old + vel_new1*delta*ratio;" +
    "  vec2 error = spot_new2 - vUv;" +
    "  vec2 spot_new3 = vUv - error/2.0;" +
    "  vec2 vel_2 = texture2D(velocity, spot_new3).xy;" +
    "  vec2 spot_old2 = spot_new3 - vel_2*delta*ratio;" +
    "  gl_FragColor = vec4(texture2D(dye, spot_old2).rgb*decay, 1.0);" +
    "}";

  /* screen composite — setaprint output.frag (grain, no reveal mask).
     Pure black field: the ONLY color on screen is the pointer-driven
     dye (fluid smoke) itself — no ambient/idle layer. */
  var FRAG_OUT =
    "precision highp float; uniform sampler2D diffuse; uniform float uActive; varying vec2 vUv;" +
    "float random(vec2 p){" +
    "  vec2 K1 = vec2(23.14069263277926, 2.665144142690225);" +
    "  return fract(cos(dot(p,K1))*12345.6789);" +
    "}" +
    "void main(){" +
    "  vec3 color = texture2D(diffuse, vUv).rgb;" +
    "  vec2 uvRandom = vUv;" +
    "  uvRandom.y *= random(vec2(uvRandom.y));" +
    "  color += random(uvRandom)*0.075;" +
    "  gl_FragColor = vec4(color, uActive);" +
    "}";

  var CN = {
    gl: null, gl2: false, canvas: null, halfType: 0,
    progs: {}, quad: null, rt: {},
    W: 0, H: 0, simW: 0, simH: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    gradTex: null, whiteTex: null,
    // pointer state (clip coords, like setaprint's Stage)
    device: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    mix: 1, mixTarget: 1,
    active: 0, target: 0, prog: 0,
    running: false, start: 0
  };

  /* ---- tiny smooth 1-D noise for the idle fake pointer ---- */
  function hash1(n) { var x = Math.sin(n * 127.1) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; }
  function noise1(seed, t) {
    var i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f);
    return hash1(i + seed * 113.1) * (1 - u) + hash1(i + 1 + seed * 113.1) * u;
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("CNEffects shader:", gl.getShaderInfoLog(sh)); return null;
    }
    return sh;
  }
  function program(gl, vs, fs) {
    var v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn("CNEffects link:", gl.getProgramInfoLog(p)); return null;
    }
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); u[inf.name] = gl.getUniformLocation(p, inf.name); }
    return { p: p, u: u };
  }

  function createRT(gl, w, h) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (CN.gl2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, CN.halfType, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, CN.halfType, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok ? { tex: tex, fbo: fbo, w: w, h: h } : null;
  }

  function mount(canvas) {
    CN.canvas = canvas;
    var opts = { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false };
    var gl = canvas.getContext("webgl2", opts);
    if (gl) {
      CN.gl2 = true;
      if (!gl.getExtension("EXT_color_buffer_float")) { CN.gl2 = false; gl = null; }
      else CN.halfType = gl.HALF_FLOAT;
    }
    if (!gl) {
      gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
      if (!gl) { console.warn("CNEffects: WebGL unavailable"); return false; }
      var ext = gl.getExtension("OES_texture_half_float");
      if (!ext) { console.warn("CNEffects: no half-float"); return false; }
      gl.getExtension("OES_texture_half_float_linear");
      CN.halfType = ext.HALF_FLOAT_OES;
    }
    CN.gl = gl;

    CN.progs.advect = program(gl, VERT_FS, FRAG_ADVECT);
    CN.progs.addVel = program(gl, VERT_PT, FRAG_ADDVEL);
    CN.progs.addDye = program(gl, VERT_PT, FRAG_ADDDYE);
    CN.progs.div = program(gl, VERT_FS, FRAG_DIV);
    CN.progs.poisson = program(gl, VERT_FS, FRAG_POISSON);
    CN.progs.pressure = program(gl, VERT_FS, FRAG_PRESSURE);
    CN.progs.dye = program(gl, VERT_FS, FRAG_DYE);
    CN.progs.out = program(gl, VERT_FS, FRAG_OUT);
    for (var k in CN.progs) if (!CN.progs[k]) return false;

    CN.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, CN.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // 1×1 white placeholder until the gradient strip decodes
    CN.whiteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, CN.whiteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    var img = new Image();
    img.onload = function () {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      CN.gradTex = t;
    };
    img.src = GRADIENT_URI;

    if (!resize()) return false;
    window.addEventListener("resize", resize);
    document.addEventListener("mousemove", onMouse, { passive: true });
    document.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("touchstart", onTouch, { passive: true });

    CN.start = performance.now();
    return true;
  }

  function resize() {
    var gl = CN.gl;
    CN.W = Math.round(window.innerWidth * CN.dpr);
    CN.H = Math.round(window.innerHeight * CN.dpr);
    CN.canvas.width = CN.W; CN.canvas.height = CN.H;
    CN.simW = Math.max(8, Math.round(CN.W * RESOLUTION));
    CN.simH = Math.max(8, Math.round(CN.H * RESOLUTION));
    var names = ["velocity1", "velocity2", "divergence", "pressure1", "pressure2", "dye1", "dye2"];
    for (var i = 0; i < names.length; i++) {
      var rt = createRT(gl, CN.simW, CN.simH);
      if (!rt) { console.warn("CNEffects: FBO incomplete"); return false; }
      CN.rt[names[i]] = rt;
    }
    return true;
  }

  function onMouse(e) {
    CN.mixTarget = 1;
    CN.device.x = (e.clientX / window.innerWidth) * 2 - 1;
    CN.device.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }
  function onTouch(e) {
    if (e.touches && e.touches.length) onMouse(e.touches[0]);
  }

  /* draw helpers */
  function pass(prog, target, blend) {
    var gl = CN.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : CN.W, target ? target.h : CN.H);
    if (blend) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); }
    else gl.disable(gl.BLEND);
    gl.useProgram(prog.p);
  }
  function tex(prog, name, unit, t) {
    var gl = CN.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(prog.u[name], unit);
  }
  function draw() { CN.gl.drawArrays(CN.gl.TRIANGLE_STRIP, 0, 4); }

  var step = 0;
  function frame() {
    if (!CN.running) return;
    var gl = CN.gl;
    var now = performance.now();
    var time = now - CN.start;
    step++;

    CN.active += (CN.target - CN.active) * 0.06;
    if (CN.target === 0 && CN.active < 0.01) { CN.active = 0; CN.running = false; composite(); return; }

    /* --- pointer blend: real cursor ←→ idle fake pointer ------- */
    var aspect = CN.W / CN.H;
    var landscape = aspect > 1;
    CN.mixTarget *= 0.995;
    CN.mix += (CN.mixTarget - CN.mix) * 0.01;

    var t = time * 3e-4;
    var fakeSize = 1.25 + (Math.sin(t) + 1) * 0.5;
    var fx = noise1(0, t) * 0.95;
    var fy = noise1(1, t) * 0.95 / aspect;

    var px = fx + (CN.device.x - fx) * CN.mix;
    var py = fy + (CN.device.y - fy) * CN.mix;
    var mx = px - CN.last.x, my = py - CN.last.y;
    CN.last.x = px; CN.last.y = py;
    CN.pointer.x = px; CN.pointer.y = py;

    var mlen = Math.sqrt(mx * mx + my * my);
    var delta = 1 / 180 + (1 / 60 - 1 / 180) * CN.mix;
    var decay = 0.995 + (0.99 - 0.995) * CN.mix;
    var opacity = (3 + (4 - 3) * CN.mix) * mlen;
    var forceK = 3 + (2 - 3) * CN.mix;
    var size = fakeSize + (1.25 - fakeSize) * CN.mix;
    var sizeX = landscape ? size / aspect : size;
    var sizeY = landscape ? size : size * aspect;

    var rt = CN.rt;
    var sign = step % 2 === 0;
    var dyeIn = sign ? rt.dye1 : rt.dye2;
    var dyeOut = sign ? rt.dye2 : rt.dye1;

    /* 1 · advect velocity: velocity1 → velocity2 */
    var pr = CN.progs.advect;
    pass(pr, rt.velocity2, false);
    tex(pr, "velocity", 0, rt.velocity1.tex);
    gl.uniform2f(pr.u.size, CN.simW, CN.simH);
    gl.uniform1f(pr.u.delta, delta);
    draw();

    /* 2 · inject velocity at the pointer (additive) */
    pr = CN.progs.addVel;
    pass(pr, rt.velocity2, true);
    gl.uniform2f(pr.u.uCenter, CN.pointer.x, CN.pointer.y);
    gl.uniform2f(pr.u.uSize, sizeX, sizeY);
    gl.uniform2f(pr.u.uForce, mx * forceK, my * forceK);
    draw();

    /* 3 · inject dye at the pointer (additive, gradient color) */
    pr = CN.progs.addDye;
    pass(pr, dyeIn, true);
    tex(pr, "grad", 0, CN.gradTex || CN.whiteTex);
    gl.uniform2f(pr.u.uCenter, CN.pointer.x, CN.pointer.y);
    gl.uniform2f(pr.u.uSize, sizeX, sizeY);
    gl.uniform1f(pr.u.uOpacity, opacity);
    gl.uniform1f(pr.u.uTime, time);
    gl.uniform1f(pr.u.uShift, CN.prog * 0.35);
    draw();

    /* 4 · divergence of velocity2 */
    pr = CN.progs.div;
    pass(pr, rt.divergence, false);
    tex(pr, "velocity", 0, rt.velocity2.tex);
    gl.uniform1f(pr.u.delta, delta);
    gl.uniform2f(pr.u.cellSize, 1 / CN.simW, 1 / CN.simH);
    draw();

    /* 5 · Poisson pressure solve (16 Jacobi iterations) */
    pr = CN.progs.poisson;
    var pIn, pOut;
    for (var i = 0; i < ITERATIONS; i++) {
      pIn = i % 2 === 0 ? rt.pressure1 : rt.pressure2;
      pOut = i % 2 === 0 ? rt.pressure2 : rt.pressure1;
      pass(pr, pOut, false);
      tex(pr, "pressure", 0, pIn.tex);
      tex(pr, "divergence", 1, rt.divergence.tex);
      gl.uniform2f(pr.u.cellSize, 1 / CN.simW, 1 / CN.simH);
      draw();
    }

    /* 6 · subtract pressure gradient: velocity2 → velocity1 */
    pr = CN.progs.pressure;
    pass(pr, rt.velocity1, false);
    tex(pr, "pressure", 0, pOut.tex);
    tex(pr, "velocity", 1, rt.velocity2.tex);
    gl.uniform2f(pr.u.cellSize, 1 / CN.simW, 1 / CN.simH);
    gl.uniform1f(pr.u.delta, delta);
    draw();

    /* 7 · advect dye through velocity2 with decay */
    pr = CN.progs.dye;
    pass(pr, dyeOut, false);
    tex(pr, "dye", 0, dyeIn.tex);
    tex(pr, "velocity", 1, rt.velocity2.tex);
    gl.uniform2f(pr.u.size, CN.simW, CN.simH);
    gl.uniform1f(pr.u.delta, delta);
    gl.uniform1f(pr.u.decay, decay);
    draw();

    CN.lastDye = dyeOut;
    composite();
    requestAnimationFrame(frame);
  }

  function composite() {
    var gl = CN.gl;
    var pr = CN.progs.out;
    pass(pr, null, false);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    tex(pr, "diffuse", 0, (CN.lastDye || CN.rt.dye1).tex);
    gl.uniform1f(pr.u.uActive, CN.active);
    draw();
  }

  function kick() {
    if (CN.running || !CN.gl) return;
    CN.running = true;
    requestAnimationFrame(frame);
  }

  window.CNEffects = {
    mount: mount,
    setActive: function (on) {
      CN.target = on ? 1 : 0;
      if (on) kick();
    },
    setProgress: function (p) { CN.prog = Math.max(0, Math.min(1, p)); }
  };
  if (location.hash.indexOf("dbg") >= 0) { window.__CNdbg = CN; window.__CNstep = frame; }
})();
