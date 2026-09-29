/*
 * Interactive figures for the cable-actuated air hockey robot write-up.
 * Every demo re-implements the matching piece of the robot code
 * (vision.py, ekf_controller.py, kinematics_utils.py, spline_utils.py,
 * air_hockey_player.py) with the same geometry and constants.
 * Units: mm, s. World frame: origin at table center, +x toward the opponent.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Shared helpers
  // ------------------------------------------------------------------
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.body).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function palette() {
    return {
      fg: cssVar('--primary', '#1f2328'),
      fg2: cssVar('--secondary', '#6b7280'),
      bd: cssVar('--border', '#e5e7eb'),
      bg: cssVar('--entry', '#ffffff'),
      code: cssVar('--code-bg', '#f4f4f5'),
      dark: document.body.classList.contains('dark')
    };
  }
  var COL = {
    puck: '#16a34a', mallet: '#f59e0b', est: '#2563eb', pred: '#9333ea',
    plan: '#dc2626', ft: '#ea580c', ret: '#0891b2', cable: '#ef4444',
    idle: '#64748b', defend: '#2563eb', strike: '#dc2626', recover: '#0891b2'
  };
  var STATE_COL = { IDLE: COL.idle, DEFEND: COL.defend, STRIKE: COL.strike, RECOVER: COL.recover };

  function clip(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function norm(v) { return Math.hypot(v[0], v[1]); }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function scl(a, s) { return [a[0] * s, a[1] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function randn() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function font(px, weight) {
    return (weight || '') + ' ' + px + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
  }
  function mono(px) { return px + 'px ui-monospace, SFMono-Regular, Menlo, monospace'; }

  // Canvas stage: DPR-aware, resizes with its container, and only animates
  // while on screen.
  function Stage(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, visible = false, last = 0, t = 0, raf = 0;
    function resize() {
      var cw = canvas.parentElement.clientWidth;
      if (!cw || cw === w) return;
      var ch = Math.round(cw * opts.aspect(cw));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = cw; h = ch;
      if (opts.onResize) opts.onResize(w, h);
      if (!visible) opts.draw(ctx, w, h, 0, t);
    }
    function frame(now) {
      if (!w) { if (visible) raf = requestAnimationFrame(frame); return; }
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now; t += dt;
      opts.draw(ctx, w, h, dt, t);
      if (visible) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !visible) { visible = true; last = 0; raf = requestAnimationFrame(frame); }
        else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.05 }).observe(canvas);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
    window.addEventListener('resize', resize);
    resize();
    return {
      ctx: ctx,
      size: function () { return [w, h]; },
      redraw: function () { if (!visible) opts.draw(ctx, w, h, 0, t); }
    };
  }

  // World <-> screen mapping that preserves aspect ratio (y up).
  function Viewport(xmin, xmax, ymin, ymax) {
    var vp = this;
    vp.fit = function (px, py, pw, ph) {
      var s = Math.min(pw / (xmax - xmin), ph / (ymax - ymin));
      vp.s = s;
      vp.ox = px + (pw - s * (xmax - xmin)) / 2 - s * xmin;
      vp.oy = py + (ph - s * (ymax - ymin)) / 2 + s * ymax;
    };
    vp.X = function (x) { return vp.ox + vp.s * x; };
    vp.Y = function (y) { return vp.oy - vp.s * y; };
    vp.ix = function (px) { return (px - vp.ox) / vp.s; };
    vp.iy = function (py) { return (vp.oy - py) / vp.s; };
  }

  function pointerWorld(canvas, vp, ev) {
    var r = canvas.getBoundingClientRect();
    return [vp.ix(ev.clientX - r.left), vp.iy(ev.clientY - r.top)];
  }

  function arrow(ctx, x0, y0, x1, y1, color, width, head) {
    var a = Math.atan2(y1 - y0, x1 - x0), hl = head || 7;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
    ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function label(ctx, text, x, y, color, px, align, weight) {
    ctx.fillStyle = color; ctx.font = font(px || 12, weight);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function pill(ctx, text, x, y, color, px) {
    ctx.font = font(px || 12, '600');
    var tw = ctx.measureText(text).width, ph = (px || 12) + 10;
    ctx.fillStyle = color;
    roundRect(ctx, x, y, tw + 16, ph, ph / 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 8, y + ph / 2 + 0.5);
    return tw + 16;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ------------------------------------------------------------------
  // Robot geometry (config.py + table_calibration.json)
  // ------------------------------------------------------------------
  var G = (function () {
    var off = [-35, -17];
    var raw = [[13.8, 291.85], [-426.3, 235.3], [-426.3, -235.3], [13.8, -291.85]];
    var corners = raw.map(function (p) { return [p[0] + off[0], p[1] + off[1]]; });
    var T = { x0: -382, x1: 394, y0: -192, y1: 179 };      // calibrated bounds
    var WALL = 50, PR = 25, MR = 30;
    var P = { x0: T.x0 - WALL + PR, x1: T.x1 + WALL - PR, y0: T.y0 - WALL + PR, y1: T.y1 + WALL - PR };
    var R = { x0: T.x0 - WALL, x1: T.x1 + WALL, y0: T.y0 - WALL, y1: T.y1 + WALL }; // rails
    var xs = corners.map(function (c) { return c[0]; }), ys = corners.map(function (c) { return c[1]; });
    var M = {
      x0: Math.min.apply(null, xs) + 80, x1: Math.max.apply(null, xs) - 80,
      y0: Math.min.apply(null, ys) + 80, y1: Math.max.apply(null, ys) - 80
    };
    return {
      corners: corners, T: T, P: P, R: R, M: M, PR: PR, MR: MR,
      DEFEND_X: Math.max(T.x0 + 120, M.x0), ATTACK_X: -120, GOAL_Y: 80,
      SIGNS: [-1, 1, -1, 1], SPOOL_C: Math.PI * 75, TICK: 0.01
    };
  })();

  function clampWS(p) { return [clip(p[0], G.M.x0, G.M.x1), clip(p[1], G.M.y0, G.M.y1)]; }

  function drawTable(ctx, vp, pal, opts) {
    opts = opts || {};
    var R = G.R;
    ctx.fillStyle = pal.code;
    ctx.fillRect(vp.X(R.x0), vp.Y(R.y1), vp.s * (R.x1 - R.x0), vp.s * (R.y1 - R.y0));
    ctx.strokeStyle = pal.fg; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(vp.X(R.x0), vp.Y(G.GOAL_Y)); ctx.lineTo(vp.X(R.x0), vp.Y(R.y1));
    ctx.lineTo(vp.X(R.x1), vp.Y(R.y1)); ctx.lineTo(vp.X(R.x1), vp.Y(G.GOAL_Y));
    ctx.moveTo(vp.X(R.x1), vp.Y(-G.GOAL_Y)); ctx.lineTo(vp.X(R.x1), vp.Y(R.y0));
    ctx.lineTo(vp.X(R.x0), vp.Y(R.y0)); ctx.lineTo(vp.X(R.x0), vp.Y(-G.GOAL_Y));
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = COL.defend;
    ctx.beginPath(); ctx.moveTo(vp.X(R.x0), vp.Y(G.GOAL_Y)); ctx.lineTo(vp.X(R.x0), vp.Y(-G.GOAL_Y)); ctx.stroke();
    ctx.strokeStyle = COL.plan;
    ctx.beginPath(); ctx.moveTo(vp.X(R.x1), vp.Y(G.GOAL_Y)); ctx.lineTo(vp.X(R.x1), vp.Y(-G.GOAL_Y)); ctx.stroke();
    ctx.lineCap = 'butt';
    if (opts.center !== false) {
      ctx.strokeStyle = pal.fg2; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(vp.X(0), vp.Y(R.y1)); ctx.lineTo(vp.X(0), vp.Y(R.y0)); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawWorkspace(ctx, vp, pal) {
    var M = G.M;
    ctx.strokeStyle = pal.fg2; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.strokeRect(vp.X(M.x0), vp.Y(M.y1), vp.s * (M.x1 - M.x0), vp.s * (M.y1 - M.y0));
    ctx.setLineDash([]);
  }

  function drawCorners(ctx, vp, pal, m, alpha) {
    G.corners.forEach(function (c) {
      if (m) {
        ctx.strokeStyle = COL.cable; ctx.globalAlpha = alpha == null ? 0.55 : alpha; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(vp.X(c[0]), vp.Y(c[1])); ctx.lineTo(vp.X(m[0]), vp.Y(m[1])); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = pal.fg;
      ctx.fillRect(vp.X(c[0]) - 5, vp.Y(c[1]) - 5, 10, 10);
    });
  }

  function drawDisc(ctx, vp, p, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(vp.X(p[0]), vp.Y(p[1]), Math.max(2, r * vp.s), 0, 2 * Math.PI);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  // ------------------------------------------------------------------
  // Quintic spline (spline_utils.py), vectorized over x and y
  // ------------------------------------------------------------------
  function quinticCoeffs(p0, v0, a0, p1, v1, a1, T) {
    var c = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    for (var k = 0; k < 2; k++) {
      var c0 = p0[k], c1 = v0[k] * T, c2 = a0[k] * T * T / 2;
      var bp = p1[k] - (c0 + c1 + c2), bv = v1[k] * T - (c1 + 2 * c2), ba = a1[k] * T * T - 2 * c2;
      var row = [c0, c1, c2, 10 * bp - 4 * bv + 0.5 * ba, -15 * bp + 7 * bv - ba, 6 * bp - 3 * bv + 0.5 * ba];
      for (var i = 0; i < 6; i++) c[i][k] = row[i];
    }
    return c;
  }
  function quinticEval(c, tau, T) {
    var p = [0, 0], v = [0, 0], a = [0, 0];
    for (var k = 0; k < 2; k++) {
      p[k] = c[0][k] + tau * (c[1][k] + tau * (c[2][k] + tau * (c[3][k] + tau * (c[4][k] + tau * c[5][k]))));
      v[k] = (c[1][k] + tau * (2 * c[2][k] + tau * (3 * c[3][k] + tau * (4 * c[4][k] + tau * 5 * c[5][k])))) / T;
      a[k] = (2 * c[2][k] + tau * (6 * c[3][k] + tau * (12 * c[4][k] + tau * 20 * c[5][k]))) / (T * T);
    }
    return { p: p, v: v, a: a };
  }
  function quinticSample(c, n, T) {
    var pos = [], vel = [], acc = [];
    for (var i = 0; i < n; i++) {
      var e = quinticEval(c, n === 1 ? 0 : i / (n - 1), T);
      pos.push(e.p); vel.push(e.v); acc.push(e.a);
    }
    return { pos: pos, vel: vel, acc: acc };
  }

  // ------------------------------------------------------------------
  // Planner port (air_hockey_player.py)
  // ------------------------------------------------------------------
  var STRIKE_SPEED = 800, STRIKE_THROUGH = 20, MIN_APPROACH = 0.15;
  var ATTACK_MAX_PUCK_SPEED = 400, COOLDOWN_TICKS = 30, CONTACT = G.PR + G.MR;

  function predictTrajectory(pos, vel, dt, n) {
    var x = pos[0], y = pos[1], vx = vel[0], vy = vel[1], out = [];
    for (var i = 0; i < n; i++) {
      x += vx * dt; y += vy * dt;
      if (y < G.P.y0) { y = 2 * G.P.y0 - y; vy = -vy; } else if (y > G.P.y1) { y = 2 * G.P.y1 - y; vy = -vy; }
      if (x < G.P.x0) { x = 2 * G.P.x0 - x; vx = -vx; } else if (x > G.P.x1) { x = 2 * G.P.x1 - x; vx = -vx; }
      out.push([x, y]);
    }
    return out;
  }

  function predictIntercept(pos, vel, tx) {
    var x = pos[0], y = pos[1], vx = vel[0], vy = vel[1];
    if (Math.abs(vx) < 5) return null;
    if ((tx < x && vx > 0) || (tx > x && vx < 0)) return null;
    var dt = 0.005, t = 0;
    for (var i = 0; i < 1000; i++) {
      x += vx * dt; y += vy * dt; t += dt;
      if (y < G.P.y0) { y = 2 * G.P.y0 - y; vy = -vy; } else if (y > G.P.y1) { y = 2 * G.P.y1 - y; vy = -vy; }
      if ((vx < 0 && x <= tx) || (vx > 0 && x >= tx)) return { y: clip(y, G.M.y0, G.M.y1), t: t };
    }
    return null;
  }

  function outsideWS(pts) {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p[0] < G.M.x0 - 1e-6 || p[0] > G.M.x1 + 1e-6 || p[1] < G.M.y0 - 1e-6 || p[1] > G.M.y1 + 1e-6) return true;
    }
    return false;
  }

  // Three-phase strike: quintic approach -> straight follow-through -> quintic return.
  function buildStrike(start, contact, dir, speed, T, defendPos) {
    var z = [0, 0], endV = scl(dir, speed);
    var nA = Math.max(2, Math.floor(T / G.TICK));
    var A = quinticSample(quinticCoeffs(start, z, z, contact, endV, z, T), nA, T);
    var nF = Math.max(1, Math.floor(STRIKE_THROUGH / (speed * G.TICK)));
    var F = { pos: [], vel: [], acc: [] };
    for (var k = 1; k <= nF; k++) {
      var p = add(contact, scl(dir, speed * G.TICK * k));
      F.pos.push(clampWS(p)); F.vel.push(endV); F.acc.push([0, 0]);
    }
    var rs = F.pos[F.pos.length - 1];
    var rT = Math.max(dist(rs, defendPos) / 300, 0.3);
    var nR = Math.max(2, Math.floor(rT / G.TICK));
    var Rt = quinticSample(quinticCoeffs(rs, endV, z, defendPos, z, z, rT), nR, rT);
    Rt.pos = Rt.pos.map(clampWS);
    return {
      pos: A.pos.concat(F.pos, Rt.pos), vel: A.vel.concat(F.vel, Rt.vel), acc: A.acc.concat(F.acc, Rt.acc),
      phases: [nA, nF, nR], durations: [T, nF * G.TICK, rT]
    };
  }

  function planAttack(trk, mxy, defendPos) {
    if (!trk.init || !trk.visible) return null;
    var sp = norm(trk.vel);
    if (sp > ATTACK_MAX_PUCK_SPEED) return null;
    if (trk.pos[0] < G.DEFEND_X + 20) return null;
    var ax = G.ATTACK_X, hit = predictIntercept(trk.pos, trk.vel, ax), iy, it;
    if (!hit) {
      if (trk.pos[0] < ax + 100 && sp < 100) { iy = clip(trk.pos[1], G.M.y0, G.M.y1); it = null; }
      else return null;
    } else { iy = hit.y; it = hit.t; }
    var contact = [ax, iy], hd = sub([G.T.x1, 0], contact), hn = norm(hd);
    if (hn < 1) return null;
    var dir = scl(hd, 1 / hn), cc = clampWS(contact);
    if (dist(cc, contact) > 15) return null;
    var ad = dist(mxy, cc);
    if (ad < 10) return null;
    var dd = Math.max(ad / Math.max(0.7 * STRIKE_SPEED, 300), MIN_APPROACH);
    var T = (it !== null && it > MIN_APPROACH) ? Math.min(it, dd * 0.8) : dd;
    T = Math.min(T, 0.5);
    var tr = buildStrike(mxy.slice(), cc, dir, STRIKE_SPEED, T, defendPos);
    if (outsideWS(tr.pos)) return null;
    tr.contact = cc; tr.dir = dir;
    return tr;
  }

  function planRecover(trk, mxy) {
    if (!trk.init || !trk.visible) return null;
    if (norm(trk.vel) > 200) return null;
    var py = trk.pos[1];
    var dir = Math.abs(py - G.T.y1) < Math.abs(py - G.T.y0) ? [0, 1] : [0, -1];
    var STANDOFF = 25, PUSH = 500, THROUGH = 80, z = [0, 0];
    var so = clampWS(sub(trk.pos, scl(dir, CONTACT + STANDOFF)));
    var ad = dist(mxy, so);
    if (ad < 10) return null;
    var aT = clip(ad / 400, MIN_APPROACH, 0.4), pv = scl(dir, PUSH);
    var nA = Math.max(2, Math.floor(aT / G.TICK));
    var A = quinticSample(quinticCoeffs(mxy.slice(), z, z, so, pv, z, aT), nA, aT);
    var nP = Math.max(2, Math.floor((STANDOFF + THROUGH) / (PUSH * G.TICK))), F = { pos: [], vel: [] };
    for (var k = 1; k <= nP; k++) { F.pos.push(clampWS(add(so, scl(dir, PUSH * G.TICK * k)))); F.vel.push(pv); }
    var dp = clampWS([G.DEFEND_X, 0]), rs = F.pos[F.pos.length - 1];
    var rT = Math.max(dist(rs, dp) / 300, 0.3), nR = Math.max(2, Math.floor(rT / G.TICK));
    var Rt = quinticSample(quinticCoeffs(rs, pv, z, dp, z, z, rT), nR, rT);
    var pos = A.pos.concat(F.pos, Rt.pos);
    if (outsideWS(pos)) return null;
    return { pos: pos, vel: A.vel.concat(F.vel, Rt.vel), phases: [nA, nP, nR], contact: trk.pos.slice(), dir: dir };
  }

  function PuckTracker() { this.pos = [0, 0]; this.vel = [0, 0]; this.lastRaw = null; this.lastT = 0; this.init = false; this.visible = false; }
  PuckTracker.prototype.update = function (raw, valid, now) {
    this.visible = valid;
    if (!valid) return;
    if (!this.init) { this.pos = raw.slice(); this.vel = [0, 0]; this.lastRaw = raw.slice(); this.lastT = now; this.init = true; return; }
    if (dist(raw, this.pos) > 100) return;                       // jump rejection
    var dt = now - this.lastT;
    if (dt > 0.001) for (var k = 0; k < 2; k++) this.vel[k] = 0.7 * this.vel[k] + 0.3 * (raw[k] - this.lastRaw[k]) / dt;
    for (var j = 0; j < 2; j++) this.pos[j] = 0.5 * this.pos[j] + 0.5 * raw[j];
    this.lastRaw = raw.slice(); this.lastT = now;
  };

  // decide_strategy() with its module-level state kept on the instance.
  function Strategy() { this.reset(); }
  Strategy.prototype.reset = function () {
    this.atk = { phase: null, traj: null, tick: 0, cooldown: 0 };
    this.last = 'IDLE'; this.defY = 0; this.defV = 0; this.stuck = 0; this.interceptY = null;
  };
  Strategy.prototype.atkReset = function () { this.atk.phase = null; this.atk.traj = null; this.atk.tick = 0; };
  Strategy.prototype.cooldown = function () { this.atkReset(); this.atk.cooldown = COOLDOWN_TICKS; };
  Strategy.prototype.smoothDefense = function (raw) {
    var err = raw - this.defY, maxDv = 4000 * G.TICK;
    var dv = clip(err * 25, -500, 500) - this.defV;
    if (Math.abs(dv) > maxDv) dv = Math.sign(dv) * maxDv;
    this.defV += dv;
    this.defY = clip(this.defY + this.defV * G.TICK, G.M.y0, G.M.y1);
    if (Math.abs(raw - this.defY) < 2 && Math.abs(this.defV) < 20) { this.defY = raw; this.defV = 0; }
    return this.defY;
  };
  Strategy.prototype.start = function (tr, name) {
    this.atk.phase = 'TRAJECTORY'; this.atk.traj = tr; this.atk.tick = 1; this.last = name;
    return { s: name, xy: tr.pos[0], v: tr.vel[0] };
  };
  Strategy.prototype.decide = function (trk, mxy) {
    var a = this.atk;
    this.interceptY = null;
    if (!trk.init || !trk.visible) { this.atkReset(); return { s: 'IDLE' }; }
    var px = trk.pos[0], py = trk.pos[1], vx = trk.vel[0], ours = px < 0;
    if (a.cooldown > 0) a.cooldown--;
    var th = this.last === 'DEFEND' ? -10 : -30;
    if (a.phase === 'TRAJECTORY') th = -400;
    var sp = norm(trk.vel);
    if (sp < ATTACK_MAX_PUCK_SPEED && ours) th = -400;
    if (vx < th) {
      if (a.phase !== null) this.cooldown(); else this.atkReset();
      this.last = 'DEFEND';
      var hit = predictIntercept(trk.pos, trk.vel, G.DEFEND_X);
      var ry = hit ? hit.y : clip(py, G.M.y0, G.M.y1);
      this.interceptY = hit ? hit.y : null;
      return { s: 'DEFEND', y: this.smoothDefense(ry) };
    }
    if (a.phase === 'TRAJECTORY' && a.traj) {
      if (a.tick < a.traj.pos.length) {
        var k = a.tick++;
        return { s: this.last, xy: a.traj.pos[k], v: a.traj.vel[k] };
      }
      this.cooldown(); this.last = 'DEFEND';
      return { s: 'DEFEND', y: clip(py, G.M.y0, G.M.y1) };
    }
    var nearWall = Math.abs(py - G.T.y0) < 60 || Math.abs(py - G.T.y1) < 60 || Math.abs(px - G.T.x0) < 60;
    if (dist(mxy, trk.pos) < CONTACT * 3 && nearWall && sp < 80) this.stuck++;
    else this.stuck = Math.max(0, this.stuck - 2);
    var rp;
    if (this.stuck > 15 && a.phase === null) {
      this.stuck = 0;
      rp = planRecover(trk, mxy);
      if (rp) return this.start(rp, 'RECOVER');
    }
    if (ours && px < G.DEFEND_X + 40 && sp < 200 && a.cooldown === 0) {
      rp = planRecover(trk, mxy);
      if (rp) return this.start(rp, 'RECOVER');
    }
    if (ours && a.cooldown === 0) {
      var ap = planAttack(trk, mxy, clampWS([G.DEFEND_X, 0]));
      if (ap) return this.start(ap, 'STRIKE');
    }
    if (ours) { this.atkReset(); this.last = 'DEFEND'; return { s: 'DEFEND', y: clip(py, G.M.y0, G.M.y1) }; }
    this.atkReset(); this.last = 'IDLE';
    return { s: 'IDLE' };
  };

  // ------------------------------------------------------------------
  // Demo 1: vision -- HSV segmentation, homography, parallax
  // ------------------------------------------------------------------
  function solveLinear(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === c) continue;
        var f = M[r2][c] / M[c][c];
        for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k];
      }
    }
    return M.map(function (r, i) { return r[n] / r[i]; });
  }
  function homography(src, dst) {
    var A = [], b = [];
    for (var i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    return solveLinear(A, b).concat([1]);
  }
  function applyH(H, p) {
    var w = H[6] * p[0] + H[7] * p[1] + H[8];
    return [(H[0] * p[0] + H[1] * p[1] + H[2]) / w, (H[3] * p[0] + H[4] * p[1] + H[5]) / w];
  }

  function initVision(root) {
    var canvas = root.querySelector('canvas');
    var modeBtn = root.querySelector('[data-act="mode"]');
    var CAM_H = 305, MAL_H = 22.175, K = (CAM_H - MAL_H) / CAM_H;
    var worldPts = [[-273, 240], [273, 240], [273, -240], [-273, -240]];
    var pixPts = [[352, 118], [944, 96], [1004, 606], [300, 634]];     // clicked TL, TR, BR, BL
    var Hw2p = homography(worldPts, pixPts), Hp2w = homography(pixPts, worldPts);
    var TW = { x0: -431, x1: 431, y0: -240, y1: 240 };                // rectified 862 x 480 image
    var modes = ['RGB frame', 'puck mask (HSV)', 'mallet mask (HSV)'], mode = 0;
    var puck = { p: [120, 60], v: [310, 190] };
    var camVp = new Viewport(0, 1280, -720, 0), recVp = new Viewport(TW.x0, TW.x1, TW.y0, TW.y1);
    var layout = null;

    modeBtn.addEventListener('click', function () { mode = (mode + 1) % 3; modeBtn.textContent = 'View: ' + modes[mode]; stage.redraw(); });

    function onResize(w, h) {
      var wide = w >= 620, pad = 12, head = 22, foot = 40;
      if (wide) {
        var pw = (w - 3 * pad) / 2;
        layout = { a: [pad, head + 6, pw, h - head - foot - 6], b: [2 * pad + pw, head + 6, pw, h - head - foot - 6] };
      } else {
        var ph = (h - 2 * (head + foot) - 10) / 2;
        layout = { a: [pad, head + 4, w - 2 * pad, ph], b: [pad, 2 * head + foot + ph + 8, w - 2 * pad, ph] };
      }
      camVp.fit.apply(null, layout.a); recVp.fit.apply(null, layout.b);
    }

    // camera pixel (u, v) -> screen, with v pointing down
    function cX(u) { return camVp.X(u); }
    function cY(v) { return camVp.Y(-v); }

    function blob(ctx, centerW, r, fill) {
      ctx.beginPath();
      for (var i = 0; i <= 28; i++) {
        var a = i / 28 * 2 * Math.PI, q = applyH(Hw2p, [centerW[0] + r * Math.cos(a), centerW[1] + r * Math.sin(a)]);
        if (i === 0) ctx.moveTo(cX(q[0]), cY(q[1])); else ctx.lineTo(cX(q[0]), cY(q[1]));
      }
      ctx.fillStyle = fill; ctx.fill();
    }

    function draw(ctx, w, h, dt, t) {
      var pal = palette();
      ctx.clearRect(0, 0, w, h);
      // physics: puck bounces inside the rectified table, mallet sweeps the robot half
      var s = Math.min(dt, 0.05);
      puck.p[0] += puck.v[0] * s; puck.p[1] += puck.v[1] * s;
      if (puck.p[0] < -400 || puck.p[0] > 400) { puck.v[0] *= -1; puck.p[0] = clip(puck.p[0], -400, 400); }
      if (puck.p[1] < -210 || puck.p[1] > 210) { puck.v[1] *= -1; puck.p[1] = clip(puck.p[1], -210, 210); }
      var base = [-230 + 110 * Math.sin(0.8 * t), 150 * Math.sin(0.53 * t + 0.6)];
      var top = scl(base, 1 / K);                   // where the camera sees the mallet marker

      // --- camera frame ---
      var A = layout.a;
      label(ctx, 'Camera frame (pixels, 1280 × 720)', A[0], 12, pal.fg, 12, 'left', '600');
      var dark = mode > 0;
      ctx.fillStyle = dark ? '#000' : (pal.dark ? '#2b2f36' : '#d9dde3');
      ctx.fillRect(cX(0), cY(0), 1280 * camVp.s, 720 * camVp.s);
      var quad = [[TW.x0, TW.y1], [TW.x1, TW.y1], [TW.x1, TW.y0], [TW.x0, TW.y0]].map(function (p) { return applyH(Hw2p, p); });
      if (!dark) {
        ctx.beginPath();
        quad.forEach(function (q, i) { if (i) ctx.lineTo(cX(q[0]), cY(q[1])); else ctx.moveTo(cX(q[0]), cY(q[1])); });
        ctx.closePath(); ctx.fillStyle = pal.dark ? '#e8eaee' : '#f8fafc'; ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
        for (var gx = -400; gx <= 400; gx += 100) {
          var g0 = applyH(Hw2p, [gx, TW.y0]), g1 = applyH(Hw2p, [gx, TW.y1]);
          ctx.beginPath(); ctx.moveTo(cX(g0[0]), cY(g0[1])); ctx.lineTo(cX(g1[0]), cY(g1[1])); ctx.stroke();
        }
        for (var gy = -200; gy <= 200; gy += 100) {
          var h0 = applyH(Hw2p, [TW.x0, gy]), h1 = applyH(Hw2p, [TW.x1, gy]);
          ctx.beginPath(); ctx.moveTo(cX(h0[0]), cY(h0[1])); ctx.lineTo(cX(h1[0]), cY(h1[1])); ctx.stroke();
        }
      }
      if (mode !== 2) blob(ctx, puck.p, 25, dark ? '#fff' : COL.puck);
      if (mode !== 1) blob(ctx, top, 30, dark ? '#fff' : '#eab308');
      // calibration clicks
      pixPts.forEach(function (q, i) {
        ctx.strokeStyle = dark ? '#f97316' : '#ea580c'; ctx.lineWidth = 1.5;
        var x = cX(q[0]), y = cY(q[1]);
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
        label(ctx, String(i + 1), x + 6, y - 8, dark ? '#f97316' : '#ea580c', 11, 'left', '600');
      });
      var puckPix = applyH(Hw2p, puck.p), malPix = applyH(Hw2p, top);
      [[puckPix, mode !== 2], [malPix, mode !== 1]].forEach(function (e) {
        if (!e[1]) return;
        var x = cX(e[0][0]), y = cY(e[0][1]);
        ctx.strokeStyle = dark ? '#ef4444' : pal.fg; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
      });
      label(ctx, 'puck centroid (u, v) = (' + puckPix[0].toFixed(0) + ', ' + puckPix[1].toFixed(0) + ') px',
        A[0], A[1] + A[3] + 14, pal.fg2, 11);
      label(ctx, modes[mode] + ' · click order 1→4 defines H', A[0], A[1] + A[3] + 30, pal.fg2, 11);

      // --- rectified frame ---
      var B = layout.b;
      label(ctx, 'Rectified table frame (mm, 1 px = 1 mm)', B[0], (w >= 620 ? 12 : B[1] - 12), pal.fg, 12, 'left', '600');
      ctx.fillStyle = pal.code;
      ctx.fillRect(recVp.X(TW.x0), recVp.Y(TW.y1), recVp.s * 862, recVp.s * 480);
      ctx.strokeStyle = pal.bd; ctx.lineWidth = 1;
      for (var x2 = -400; x2 <= 400; x2 += 100) { ctx.beginPath(); ctx.moveTo(recVp.X(x2), recVp.Y(TW.y0)); ctx.lineTo(recVp.X(x2), recVp.Y(TW.y1)); ctx.stroke(); }
      for (var y2 = -200; y2 <= 200; y2 += 100) { ctx.beginPath(); ctx.moveTo(recVp.X(TW.x0), recVp.Y(y2)); ctx.lineTo(recVp.X(TW.x1), recVp.Y(y2)); ctx.stroke(); }
      ctx.strokeStyle = pal.fg2;
      ctx.strokeRect(recVp.X(-273), recVp.Y(240), recVp.s * 546, recVp.s * 480);
      var pw = applyH(Hp2w, puckPix), mw = applyH(Hp2w, malPix), mc = scl(mw, K);
      drawDisc(ctx, recVp, pw, 25, COL.puck);
      ctx.beginPath(); ctx.arc(recVp.X(mw[0]), recVp.Y(mw[1]), 30 * recVp.s, 0, 2 * Math.PI);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      drawDisc(ctx, recVp, mc, 30, COL.mallet, pal.fg);
      if (dist(mw, mc) * recVp.s > 4) arrow(ctx, recVp.X(mw[0]), recVp.Y(mw[1]), recVp.X(mc[0]), recVp.Y(mc[1]), pal.fg, 1.3, 6);
      drawDisc(ctx, recVp, [0, 0], 5, COL.plan);
      label(ctx, 'puck (x, y) = (' + pw[0].toFixed(0) + ', ' + pw[1].toFixed(0) + ') mm', B[0], B[1] + B[3] + 14, pal.fg2, 11);
      label(ctx, 'mallet: dashed = raw H·p, solid = × (h_c − h_m)/h_c = ' + K.toFixed(3), B[0], B[1] + B[3] + 30, pal.fg2, 11);
    }
    var stage = Stage(canvas, { aspect: function (w) { return w >= 620 ? 0.43 : 1.3; }, draw: draw, onResize: onResize });
  }

  // ------------------------------------------------------------------
  // Demo 2: mallet EKF (MalletEKF in ekf_controller.py)
  // ------------------------------------------------------------------
  function initEKF(root) {
    var canvas = root.querySelector('canvas');
    var slider = root.querySelector('input[name="sigma"]'), out = root.querySelector('output[name="sigma"]');
    var dropBox = root.querySelector('input[name="drop"]');
    var sigma = +slider.value;
    slider.addEventListener('input', function () { sigma = +slider.value; out.textContent = sigma + ' mm'; });
    var vp = new Viewport(-440, -40, -230, 230), L = null;
    var st = null;

    function truth(t) {
      var th = 1.15 * t + 0.9 * Math.sin(0.55 * t), r = 120 + 30 * Math.sin(0.37 * t);
      return [-240 + r * Math.cos(th), -10 + r * Math.sin(th)];
    }
    function reset() {
      var p0 = truth(0);
      st = { t: 0, x: [p0[0], p0[1], 0, 0], P: diag([4, 4, 100, 100]), meas: [], hist: [], trail: [], est: [] };
    }
    function diag(d) { return d.map(function (v, i) { return d.map(function (_, j) { return i === j ? v : 0; }); }); }
    function occluded(t) { return dropBox.checked && (t % 5) > 3.1 && (t % 5) < 3.85; }

    function step(dt) {
      var s = st, x = s.x, P = s.P;
      // predict: x <- F x, P <- F P F^T + Q dt
      x[0] += x[2] * dt; x[1] += x[3] * dt;
      var q = [25, 25, 2500, 2500];
      var n = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        // (F P F^T)_ij with F = [[I, dt I], [0, I]]
        var fi = function (r, c) { return P[r][c] + (r < 2 ? dt * P[r + 2][c] : 0); };
        var v = fi(i, j) + (j < 2 ? dt * fi(i, j + 2) : 0);
        n[i][j] = v + (i === j ? q[i] * dt : 0);
      }
      P = n;
      s.t += dt;
      var tr = truth(s.t);
      if (!occluded(s.t) && Math.random() > 0.04) {
        var z = [tr[0] + sigma * randn(), tr[1] + sigma * randn()], R = sigma * sigma;
        var S = [[P[0][0] + R, P[0][1]], [P[1][0], P[1][1] + R]];
        var det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
        var Si = [[S[1][1] / det, -S[0][1] / det], [-S[1][0] / det, S[0][0] / det]];
        var Kg = [];
        for (var r = 0; r < 4; r++) Kg.push([P[r][0] * Si[0][0] + P[r][1] * Si[1][0], P[r][0] * Si[0][1] + P[r][1] * Si[1][1]]);
        var y = [z[0] - x[0], z[1] - x[1]];
        for (var r2 = 0; r2 < 4; r2++) x[r2] += Kg[r2][0] * y[0] + Kg[r2][1] * y[1];
        var Pn = [];
        for (var a = 0; a < 4; a++) {
          Pn.push([]);
          for (var b = 0; b < 4; b++) Pn[a].push(P[a][b] - Kg[a][0] * P[0][b] - Kg[a][1] * P[1][b]);
        }
        P = Pn;
        s.meas.push({ t: s.t, z: z, e: dist(z, tr) });
      }
      s.P = P;
      s.trail.push({ t: s.t, p: tr });
      s.est.push({ t: s.t, p: [x[0], x[1]] });
      s.hist.push({ t: s.t, e: dist([x[0], x[1]], tr), b: 2 * Math.sqrt((P[0][0] + P[1][1]) / 2), occ: occluded(s.t) });
      var cut = s.t - 8;
      while (s.hist.length && s.hist[0].t < cut) s.hist.shift();
      while (s.meas.length && s.meas[0].t < cut) s.meas.shift();
      while (s.trail.length && s.trail[0].t < s.t - 2.5) s.trail.shift();
      while (s.est.length && s.est[0].t < s.t - 2.5) s.est.shift();
    }

    function onResize(w, h) {
      var wide = w >= 620, pad = 12;
      if (wide) L = { a: [pad, 26, w * 0.44, h - 36], b: [w * 0.44 + 3 * pad, 30, w * 0.56 - 4 * pad - 10, h - 64] };
      else L = { a: [pad, 26, w - 2 * pad, h * 0.55 - 30], b: [pad + 30, h * 0.55 + 22, w - 2 * pad - 36, h * 0.45 - 54] };
      vp.fit.apply(null, L.a);
    }

    function draw(ctx, w, h, dt) {
      var pal = palette();
      var n = Math.round(dt / 0.01);
      for (var i = 0; i < n; i++) step(0.01);
      ctx.clearRect(0, 0, w, h);
      var s = st;
      label(ctx, 'Table view (robot half)', L.a[0], 12, pal.fg, 12, 'left', '600');
      ctx.fillStyle = pal.code;
      ctx.fillRect(vp.X(-440), vp.Y(230), vp.s * 400, vp.s * 460);
      drawWorkspace(ctx, vp, pal);
      var occ = occluded(s.t);
      // truth trail
      ctx.strokeStyle = pal.fg2; ctx.lineWidth = 1; ctx.beginPath();
      s.trail.forEach(function (e, i) { if (i) ctx.lineTo(vp.X(e.p[0]), vp.Y(e.p[1])); else ctx.moveTo(vp.X(e.p[0]), vp.Y(e.p[1])); });
      ctx.stroke();
      // measurements (last 1 s)
      s.meas.forEach(function (m) {
        var age = s.t - m.t;
        if (age > 1) return;
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = pal.fg2;
        ctx.beginPath(); ctx.arc(vp.X(m.z[0]), vp.Y(m.z[1]), 2, 0, 2 * Math.PI); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // estimate trail
      ctx.strokeStyle = COL.est; ctx.lineWidth = 2; ctx.beginPath();
      s.est.forEach(function (e, i) { if (i) ctx.lineTo(vp.X(e.p[0]), vp.Y(e.p[1])); else ctx.moveTo(vp.X(e.p[0]), vp.Y(e.p[1])); });
      ctx.stroke();
      var tr = s.trail.length ? s.trail[s.trail.length - 1].p : truth(s.t);
      drawDisc(ctx, vp, tr, 30, 'rgba(245,158,11,0.35)', COL.mallet);
      // 2-sigma covariance ellipse
      var a = s.P[0][0], b = s.P[0][1], c = s.P[1][1];
      var m1 = (a + c) / 2, d = Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
      var l1 = m1 + d, l2 = Math.max(m1 - d, 1e-6), ang = 0.5 * Math.atan2(2 * b, a - c);
      ctx.beginPath();
      ctx.ellipse(vp.X(s.x[0]), vp.Y(s.x[1]), Math.max(2 * Math.sqrt(l1) * vp.s, 2), Math.max(2 * Math.sqrt(l2) * vp.s, 2), -ang, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(37,99,235,0.15)'; ctx.fill();
      ctx.strokeStyle = COL.est; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = COL.est; ctx.beginPath(); ctx.arc(vp.X(s.x[0]), vp.Y(s.x[1]), 3.5, 0, 2 * Math.PI); ctx.fill();
      arrow(ctx, vp.X(s.x[0]), vp.Y(s.x[1]), vp.X(s.x[0] + 0.2 * s.x[2]), vp.Y(s.x[1] + 0.2 * s.x[3]), COL.est, 1.5, 6);
      if (occ) pill(ctx, 'camera occluded: predict only', L.a[0] + 6, L.a[1] + 6, '#6b7280', 11);

      // --- error plot ---
      var B = L.b, x0 = B[0], y0 = B[1], pw = B[2], ph = B[3];
      label(ctx, 'Position error over the last 8 s', x0, 12, pal.fg, 12, 'left', '600');
      var ymax = Math.max(20, sigma * 3.2);
      var tx = function (t) { return x0 + pw * (1 - (s.t - t) / 8); };
      var ty = function (e) { return y0 + ph * (1 - Math.min(e, ymax) / ymax); };
      // occlusion bands
      ctx.fillStyle = pal.dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.13)';
      var bandStart = null;
      s.hist.forEach(function (e, i) {
        if (e.occ && bandStart === null) bandStart = e.t;
        if ((!e.occ || i === s.hist.length - 1) && bandStart !== null) { ctx.fillRect(tx(bandStart), y0, tx(e.t) - tx(bandStart), ph); bandStart = null; }
      });
      ctx.strokeStyle = pal.bd; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, pw, ph);
      for (var gv = 0; gv <= ymax; gv += (ymax > 40 ? 20 : 10)) {
        ctx.strokeStyle = pal.bd; ctx.beginPath(); ctx.moveTo(x0, ty(gv)); ctx.lineTo(x0 + pw, ty(gv)); ctx.stroke();
        label(ctx, String(gv), x0 - 5, ty(gv), pal.fg2, 10, 'right');
      }
      label(ctx, 'mm', x0 - 5, y0 - 10, pal.fg2, 10, 'right');
      // 2-sigma band
      ctx.beginPath();
      s.hist.forEach(function (e, i) { if (i) ctx.lineTo(tx(e.t), ty(e.b)); else ctx.moveTo(tx(e.t), ty(e.b)); });
      ctx.lineTo(x0 + pw, ty(0)); ctx.lineTo(tx(s.hist.length ? s.hist[0].t : s.t), ty(0)); ctx.closePath();
      ctx.fillStyle = 'rgba(37,99,235,0.12)'; ctx.fill();
      s.meas.forEach(function (m) { ctx.fillStyle = pal.fg2; ctx.fillRect(tx(m.t) - 1, ty(m.e) - 1, 2, 2); });
      ctx.strokeStyle = COL.est; ctx.lineWidth = 1.8; ctx.beginPath();
      s.hist.forEach(function (e, i) { if (i) ctx.lineTo(tx(e.t), ty(e.e)); else ctx.moveTo(tx(e.t), ty(e.e)); });
      ctx.stroke();
      var ly = y0 + ph + 16;
      ctx.fillStyle = pal.fg2; ctx.fillRect(x0, ly - 1, 6, 3); label(ctx, 'raw camera ‖z − p‖', x0 + 10, ly, pal.fg2, 11);
      ctx.fillStyle = COL.est; ctx.fillRect(x0 + 130, ly - 1, 14, 3); label(ctx, 'EKF ‖x̂ − p‖', x0 + 148, ly, pal.fg2, 11);
      ctx.fillStyle = 'rgba(37,99,235,0.25)'; ctx.fillRect(x0 + 232, ly - 5, 12, 10); label(ctx, '2σ from P', x0 + 248, ly, pal.fg2, 11);
    }
    reset();
    root.querySelector('[data-act="reset"]').addEventListener('click', function () { reset(); });
    Stage(canvas, { aspect: function (w) { return w >= 620 ? 0.46 : 1.25; }, draw: draw, onResize: onResize });
  }

  // ------------------------------------------------------------------
  // Demo 3: cable kinematics (kinematics_utils.py)
  // ------------------------------------------------------------------
  function ik(m) {
    return G.corners.map(function (c, i) { return G.SIGNS[i] * dist(c, m) / G.SPOOL_C; });
  }
  function jacRows(m) {
    return G.corners.map(function (c) { var d = sub(m, c), n = norm(d); return scl(d, 1 / Math.max(n, 1e-9)); });
  }
  function condJ(m) {
    var u = jacRows(m), a = 0, b = 0, c = 0;
    u.forEach(function (r) { a += r[0] * r[0]; b += r[0] * r[1]; c += r[1] * r[1]; });
    var mid = (a + c) / 2, d = Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
    return Math.sqrt((mid + d) / Math.max(mid - d, 1e-9));
  }

  function initKinematics(root) {
    var canvas = root.querySelector('canvas');
    var vp = new Viewport(-490, 45, -345, 312), L = null, heat = null;
    var m = [-240, 0], mPrev = m.slice(), vel = [0, 0], dragging = false, lastDrag = -10, tAuto = 0;

    function onResize(w, h) {
      var wide = w >= 620;
      if (wide) L = { a: [8, 8, w * 0.58, h - 16], b: [w * 0.58 + 24, 30, w * 0.42 - 36, h - 40] };
      else L = { a: [8, 8, w - 16, h * 0.6 - 8], b: [16, h * 0.6 + 26, w - 32, h * 0.4 - 36] };
      vp.fit.apply(null, L.a);
      // heatmap of the Jacobian condition number over the cable polygon
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      heat = document.createElement('canvas');
      heat.width = Math.ceil(w * dpr); heat.height = Math.ceil(h * dpr);
      var hc = heat.getContext('2d'); hc.setTransform(dpr, 0, 0, dpr, 0, 0);
      var step = 5;
      for (var sx = vp.X(-461.3); sx < vp.X(-21.2); sx += step) {
        for (var sy = vp.Y(274.85); sy < vp.Y(-308.85); sy += step) {
          var p = [vp.ix(sx + step / 2), vp.iy(sy + step / 2)];
          if (!inHull(p)) continue;
          var k = condJ(p), a = clip((Math.log(k)) / Math.log(4), 0, 1);
          hc.fillStyle = 'rgba(147,51,234,' + (0.04 + 0.4 * a).toFixed(3) + ')';
          hc.fillRect(sx, sy, step, step);
        }
      }
    }
    function inHull(p) {
      var c = G.corners, sgn = 0;
      for (var i = 0; i < 4; i++) {
        var a = c[i], b = c[(i + 1) % 4];
        var cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        if (cr === 0) continue;
        if (sgn === 0) sgn = Math.sign(cr); else if (Math.sign(cr) !== sgn) return false;
      }
      return true;
    }

    canvas.addEventListener('pointerdown', function (ev) {
      var p = pointerWorld(canvas, vp, ev);
      if (dist(p, m) < 90) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      m = clampWS(pointerWorld(canvas, vp, ev));
      lastDrag = performance.now() / 1000;
    });
    canvas.addEventListener('pointerup', function () { dragging = false; });
    canvas.addEventListener('pointercancel', function () { dragging = false; });

    function draw(ctx, w, h, dt) {
      var pal = palette(), now = performance.now() / 1000;
      if (!dragging && now - lastDrag > 1.5) {
        tAuto += dt;
        var target = [-241 + 115 * Math.sin(0.9 * tAuto), -17 + 175 * Math.sin(0.45 * tAuto + 0.3)];
        m = add(m, scl(sub(target, m), Math.min(1, dt * 4)));
      }
      if (dt > 0) {
        var raw = scl(sub(m, mPrev), 1 / dt);
        vel = add(scl(vel, 0.8), scl(raw, 0.2));
      }
      mPrev = m.slice();
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath(); ctx.rect(L.a[0], L.a[1], L.a[2], L.a[3]); ctx.clip();
      if (heat) ctx.drawImage(heat, 0, 0, w, h);
      drawTable(ctx, vp, pal, { center: false });
      drawWorkspace(ctx, vp, pal);
      var u = jacRows(m), Ldot = u.map(function (r) { return dot(r, vel); });
      G.corners.forEach(function (c, i) {
        var col = Ldot[i] > 5 ? COL.cable : (Ldot[i] < -5 ? COL.est : pal.fg2);
        ctx.strokeStyle = col; ctx.lineWidth = 1.2 + Math.min(Math.abs(Ldot[i]) / 150, 3);
        ctx.beginPath(); ctx.moveTo(vp.X(c[0]), vp.Y(c[1])); ctx.lineTo(vp.X(m[0]), vp.Y(m[1])); ctx.stroke();
        ctx.fillStyle = pal.fg; ctx.fillRect(vp.X(c[0]) - 6, vp.Y(c[1]) - 6, 12, 12);
        label(ctx, 'M' + (i + 1), vp.X(c[0]) + (c[0] > -200 ? -10 : 10), vp.Y(c[1]) + (c[1] > 0 ? -12 : 13), pal.fg, 11, c[0] > -200 ? 'right' : 'left', '600');
      });
      drawDisc(ctx, vp, m, 30, COL.mallet, pal.fg);
      if (norm(vel) > 20) arrow(ctx, vp.X(m[0]), vp.Y(m[1]), vp.X(m[0] + 0.25 * vel[0]), vp.Y(m[1] + 0.25 * vel[1]), pal.fg, 1.6, 7);
      label(ctx, dragging ? 'dragging' : 'drag the mallet', vp.X(m[0]), vp.Y(m[1]) + 30 * vp.s + 11, pal.fg2, 10, 'center');
      ctx.restore();

      // --- readout panel ---
      var B = L.b, q = ik(m), qd = Ldot.map(function (v, i) { return G.SIGNS[i] * v / G.SPOOL_C; });
      label(ctx, 'Per-cable state', B[0], B[1] - 14, pal.fg, 12, 'left', '600');
      var rowH = Math.min(54, (B[3] - 40) / 4);
      for (var i = 0; i < 4; i++) {
        var y = B[1] + 6 + i * rowH, len = dist(G.corners[i], m);
        label(ctx, 'M' + (i + 1), B[0], y + 6, pal.fg, 12, 'left', '600');
        var bx = B[0] + 30, bw = B[2] - 30;
        ctx.fillStyle = pal.code; ctx.fillRect(bx, y, bw, 12);
        ctx.fillStyle = pal.fg2; ctx.fillRect(bx, y, bw * clip(len / 650, 0, 1), 12);
        var col = qd[i] * G.SIGNS[i] > 0.02 ? COL.cable : (qd[i] * G.SIGNS[i] < -0.02 ? COL.est : pal.fg2);
        label(ctx, 'L = ' + len.toFixed(0) + ' mm,  q = ' + (q[i] >= 0 ? '+' : '') + q[i].toFixed(2) + ' rev', bx, y + 22, pal.fg2, 11);
        label(ctx, 'dq/dt = ' + (qd[i] >= 0 ? '+' : '') + qd[i].toFixed(2) + ' rev/s', bx, y + 36, col, 11, 'left', '600');
      }
      var yb = B[1] + 6 + 4 * rowH + 8;
      label(ctx, 'κ(J) at mallet = ' + condJ(m).toFixed(2), B[0], yb, pal.fg, 11, 'left', '600');
      ctx.fillStyle = COL.cable; ctx.fillRect(B[0], yb + 16, 14, 3); label(ctx, 'paying out', B[0] + 18, yb + 17, pal.fg2, 11);
      ctx.fillStyle = COL.est; ctx.fillRect(B[0] + 92, yb + 16, 14, 3); label(ctx, 'reeling in', B[0] + 110, yb + 17, pal.fg2, 11);
    }
    Stage(canvas, { aspect: function (w) { return w >= 620 ? 0.56 : 1.45; }, draw: draw, onResize: onResize });
  }

  // ------------------------------------------------------------------
  // Demo 4: quintic strike profile (plan_attack)
  // ------------------------------------------------------------------
  function initQuintic(root) {
    var canvas = root.querySelector('canvas');
    var inputs = {};
    ['vs', 'T', 'cy'].forEach(function (n) {
      var el = root.querySelector('input[name="' + n + '"]'), o = root.querySelector('output[name="' + n + '"]');
      inputs[n] = el;
      el.addEventListener('input', function () { o.textContent = fmt(n, +el.value); plan = make(); stage.redraw(); });
    });
    function fmt(n, v) { return n === 'vs' ? v + ' mm/s' : (n === 'T' ? v.toFixed(2) + ' s' : v + ' mm'); }
    var vp = new Viewport(-300, -40, -235, 235), L = null, clock = 0;
    function make() {
      var vs = +inputs.vs.value, T = +inputs.T.value, cy = +inputs.cy.value;
      var start = [G.DEFEND_X, 0], contact = [G.ATTACK_X, cy], d = sub([G.T.x1, 0], contact);
      var dir = scl(d, 1 / norm(d));
      var tr = buildStrike(start, contact, dir, vs, T, start);
      tr.contact = contact; tr.dir = dir; tr.speed = vs;
      var n = tr.pos.length, ts = [];
      for (var i = 0; i < n; i++) ts.push(i * G.TICK);
      tr.t = ts;
      // speed and acceleration magnitudes (finite differences over the concatenated plan)
      tr.sp = tr.vel.map(norm);
      tr.ac = tr.vel.map(function (v, i) {
        var j = Math.min(i + 1, n - 1), k = Math.max(i - 1, 0);
        return j === k ? 0 : norm(sub(tr.vel[j], tr.vel[k])) / ((j - k) * G.TICK) / 1000;
      });
      tr.total = n * G.TICK;
      return tr;
    }
    var plan = make();

    function onResize(w, h) {
      var wide = w >= 620;
      if (wide) L = { a: [8, 26, w * 0.36, h - 34], b: [w * 0.36 + 60, 26, w * 0.64 - 80, h - 60] };
      else L = { a: [8, 26, w - 16, h * 0.5 - 30], b: [52, h * 0.5 + 24, w - 72, h * 0.5 - 56] };
      vp.fit.apply(null, L.a);
    }
    function phaseOf(i) { return i < plan.phases[0] ? 0 : (i < plan.phases[0] + plan.phases[1] ? 1 : 2); }
    var PH = [COL.plan, COL.ft, COL.ret], PHN = ['approach', 'follow-through', 'return'];

    function draw(ctx, w, h, dt) {
      var pal = palette();
      clock += dt;
      var cycle = plan.total + 0.8, tt = clock % cycle, idx = Math.min(Math.floor(tt / G.TICK), plan.pos.length - 1);
      ctx.clearRect(0, 0, w, h);
      label(ctx, 'Planned path (robot half)', L.a[0], 12, pal.fg, 12, 'left', '600');
      ctx.save();
      ctx.beginPath(); ctx.rect(vp.X(-300), vp.Y(235), vp.s * 260, vp.s * 470); ctx.clip();
      ctx.fillStyle = pal.code; ctx.fillRect(vp.X(-300), vp.Y(235), vp.s * 260, vp.s * 470);
      drawWorkspace(ctx, vp, pal);
      ctx.strokeStyle = COL.defend; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vp.X(G.DEFEND_X), vp.Y(235)); ctx.lineTo(vp.X(G.DEFEND_X), vp.Y(-235)); ctx.stroke();
      ctx.strokeStyle = COL.strike;
      ctx.beginPath(); ctx.moveTo(vp.X(G.ATTACK_X), vp.Y(235)); ctx.lineTo(vp.X(G.ATTACK_X), vp.Y(-235)); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, 'defense', vp.X(G.DEFEND_X) + 3, vp.Y(222), COL.defend, 10);
      label(ctx, 'attack', vp.X(G.ATTACK_X) - 3, vp.Y(222), COL.strike, 10, 'right');
      for (var i = 1; i < plan.pos.length; i++) {
        ctx.strokeStyle = PH[phaseOf(i)]; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(vp.X(plan.pos[i - 1][0]), vp.Y(plan.pos[i - 1][1])); ctx.lineTo(vp.X(plan.pos[i][0]), vp.Y(plan.pos[i][1])); ctx.stroke();
      }
      for (var k = 0; k < plan.phases[0]; k += 3) {
        var p = plan.pos[k];
        ctx.fillStyle = COL.plan; ctx.beginPath(); ctx.arc(vp.X(p[0]), vp.Y(p[1]), 1.8, 0, 7); ctx.fill();
      }
      drawDisc(ctx, vp, add(plan.contact, scl(plan.dir, CONTACT)), 25, 'rgba(22,163,74,0.35)', COL.puck);
      arrow(ctx, vp.X(plan.contact[0]), vp.Y(plan.contact[1]), vp.X(plan.contact[0] + 90 * plan.dir[0]), vp.Y(plan.contact[1] + 90 * plan.dir[1]), COL.plan, 1.5, 7);
      drawDisc(ctx, vp, plan.pos[idx], 30, COL.mallet, pal.fg);
      ctx.restore();

      // --- profiles ---
      var B = L.b, x0 = B[0], pw = B[2], gap = 26, ph = (B[3] - gap) / 2;
      var tx = function (t) { return x0 + pw * t / plan.total; };
      var spMax = Math.max.apply(null, plan.sp) * 1.1, acMax = Math.max.apply(null, plan.ac) * 1.1;
      [[plan.sp, spMax, 'speed ‖v‖ (mm/s)', B[1]], [plan.ac, acMax, 'accel ‖a‖ (m/s²)', B[1] + ph + gap]].forEach(function (s) {
        var data = s[0], ymax = s[1], y0 = s[3];
        var ty = function (v) { return y0 + ph * (1 - v / ymax); };
        var acc = 0;
        for (var p2 = 0; p2 < 3; p2++) {
          var n = plan.phases[p2];
          ctx.fillStyle = PH[p2]; ctx.globalAlpha = 0.08;
          ctx.fillRect(tx(acc * G.TICK), y0, tx((acc + n) * G.TICK) - tx(acc * G.TICK), ph);
          ctx.globalAlpha = 1; acc += n;
        }
        ctx.strokeStyle = pal.bd; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, pw, ph);
        label(ctx, s[2], x0, y0 - 9, pal.fg, 11, 'left', '600');
        label(ctx, ymax.toFixed(0), x0 - 5, y0 + 6, pal.fg2, 10, 'right');
        label(ctx, '0', x0 - 5, y0 + ph, pal.fg2, 10, 'right');
        ctx.lineWidth = 1.8;
        for (var i2 = 1; i2 < data.length; i2++) {
          ctx.strokeStyle = PH[phaseOf(i2)];
          ctx.beginPath(); ctx.moveTo(tx(plan.t[i2 - 1]), ty(data[i2 - 1])); ctx.lineTo(tx(plan.t[i2]), ty(data[i2])); ctx.stroke();
        }
        ctx.strokeStyle = pal.fg; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx(plan.t[idx]), y0); ctx.lineTo(tx(plan.t[idx]), y0 + ph); ctx.stroke();
      });
      var ly = B[1] + B[3] + 16, lx = x0;
      for (var q = 0; q < 3; q++) {
        ctx.fillStyle = PH[q]; ctx.fillRect(lx, ly - 1, 14, 3);
        label(ctx, PHN[q] + ' ' + plan.durations[q].toFixed(2) + ' s', lx + 18, ly, pal.fg2, 11);
        lx += 40 + ctx.measureText(PHN[q] + ' 0.00 s').width;
      }
      var peak = Math.max.apply(null, plan.ac.slice(0, plan.phases[0]));
      label(ctx, 'peak approach accel ' + peak.toFixed(1) + ' m/s²', x0 + pw, B[1] - 9, pal.fg2, 11, 'right');
    }
    var stage = Stage(canvas, { aspect: function (w) { return w >= 620 ? 0.5 : 1.25; }, draw: draw, onResize: onResize });
  }

  // ------------------------------------------------------------------
  // Demo 5: full game loop -- tracker + predictor + FSM + cable-drive lag
  // ------------------------------------------------------------------
  function initGame(root) {
    var canvas = root.querySelector('canvas');
    var slowBox = root.querySelector('input[name="slow"]');
    var vp = new Viewport(-480, 470, -325, 300);
    var nodes = document.querySelectorAll('.hsd-node[data-hsd]');
    var S = null, acc = 0;

    function reset() {
      S = {
        t: 0, puck: { p: [200, 40], v: [0, 0] }, m: [G.DEFEND_X, 0], mv: [0, 0],
        cmd: [G.DEFEND_X, 0], cmdV: [0, 0], desired: [G.DEFEND_X, 0], trk: new PuckTracker(),
        strat: new Strategy(), state: 'IDLE', score: [0, 0], opp: 0, flash: null, pause: 0
      };
    }
    reset();

    function shoot(target, speed) {
      var d = sub(target, S.puck.p), n = norm(d);
      if (n < 1) return;
      S.puck.v = scl(d, speed / n);
    }
    function opponentShot() {
      var r = Math.random(), aimY = (Math.random() * 2 - 1) * 1.4 * G.GOAL_Y, speed;
      if (r < 0.15) speed = 80 + 170 * Math.random(); else speed = 300 + 800 * Math.random();
      var target = [G.P.x0, aimY];
      if (r > 0.7) { var wall = Math.random() < 0.5 ? G.P.y1 : G.P.y0; target = [G.P.x0, 2 * wall - aimY]; }
      shoot(target, speed);
    }
    function goal(robotScored) {
      S.score[robotScored ? 0 : 1]++;
      S.flash = { text: robotScored ? 'Robot scores' : 'Opponent scores', t: S.t };
      S.puck.p = [220, (Math.random() * 2 - 1) * 90]; S.puck.v = [0, 0];
      S.trk = new PuckTracker(); S.strat.reset(); S.pause = 0.7; S.opp = 0;
    }

    canvas.addEventListener('pointerdown', function (ev) {
      var p = pointerWorld(canvas, vp, ev);
      if (p[0] < G.R.x0 || p[0] > G.R.x1 || p[1] < G.R.y0 || p[1] > G.R.y1) return;
      shoot(p, 950); S.opp = 0; S.pause = 0;
      ev.preventDefault();
    });

    function tick(dt) {
      var s = S;
      s.t += dt;
      if (s.pause > 0) { s.pause -= dt; }
      // --- perception: noisy puck measurement -> alpha filter ---
      var z = [s.puck.p[0] + 1.5 * randn(), s.puck.p[1] + 1.5 * randn()];
      s.trk.update(z, true, s.t);
      var mEst = [s.m[0] + randn(), s.m[1] + randn()];
      // --- strategy ---
      var d = s.strat.decide(s.trk, mEst), prev = s.cmd.slice();
      s.state = d.s;
      if ((d.s === 'STRIKE' || d.s === 'RECOVER') && d.xy) {
        s.cmd = clampWS(d.xy); s.cmdV = d.v ? d.v.slice() : [0, 0];
      } else {
        var raw = clampWS(d.s === 'DEFEND' && d.y !== undefined ? [G.DEFEND_X, d.y] : [G.DEFEND_X, 0]);
        s.desired = add(scl(s.desired, 0.85), scl(raw, 0.15));
        var dir = sub(s.desired, s.cmd), dn = norm(dir), maxStep = 1200 * dt;
        s.cmd = dn > maxStep ? add(s.cmd, scl(dir, maxStep / dn)) : s.desired.slice();
        s.cmdV = scl(sub(s.cmd, prev), 1 / dt);
      }
      // --- cable drive: PD tracking with velocity feedforward, accel/speed limits ---
      var a = add(scl(sub(s.cmd, s.m), 2500), scl(sub(s.cmdV, s.mv), 100)), an = norm(a);
      if (an > 25000) a = scl(a, 25000 / an);
      s.mv = add(s.mv, scl(a, dt));
      var vn = norm(s.mv);
      if (vn > 2000) s.mv = scl(s.mv, 2000 / vn);
      s.m = clampWS(add(s.m, scl(s.mv, dt)));
      // --- puck physics ---
      var P = s.puck;
      if (s.pause <= 0) {
        P.v = scl(P.v, 1 - 0.15 * dt);
        P.p = add(P.p, scl(P.v, dt));
        if (P.p[1] < G.P.y0) { P.p[1] = 2 * G.P.y0 - P.p[1]; P.v[1] = -0.9 * P.v[1]; }
        if (P.p[1] > G.P.y1) { P.p[1] = 2 * G.P.y1 - P.p[1]; P.v[1] = -0.9 * P.v[1]; }
        if (P.p[0] < G.P.x0) {
          if (Math.abs(P.p[1]) < G.GOAL_Y) { goal(false); return; }
          P.p[0] = 2 * G.P.x0 - P.p[0]; P.v[0] = -0.9 * P.v[0];
        }
        if (P.p[0] > G.P.x1) {
          if (Math.abs(P.p[1]) < G.GOAL_Y) { goal(true); return; }
          P.p[0] = 2 * G.P.x1 - P.p[0]; P.v[0] = -0.9 * P.v[0];
        }
        var dm = sub(P.p, s.m), dn2 = norm(dm);
        if (dn2 < CONTACT && dn2 > 1e-6) {
          var nrm = scl(dm, 1 / dn2);
          P.p = add(s.m, scl(nrm, CONTACT));
          var rel = dot(sub(P.v, s.mv), nrm);
          if (rel < 0) P.v = sub(P.v, scl(nrm, 1.7 * rel));
          var pn = norm(P.v);
          if (pn > 2500) P.v = scl(P.v, 2500 / pn);
        }
        // scripted opponent on the far half
        if (P.p[0] > 60) {
          s.opp += dt;
          if ((norm(P.v) < 120 && s.opp > 0.4) || s.opp > 3) { opponentShot(); s.opp = 0; }
        } else s.opp = 0;
      }
    }

    function onResize(w, h) { vp.fit(6, 30, w - 12, h - 36); }

    var lastState = null;
    function draw(ctx, w, h, dt) {
      var pal = palette();
      acc += dt * (slowBox.checked ? 0.3 : 1);
      var n = 0;
      while (acc >= G.TICK && n < 8) { tick(G.TICK); acc -= G.TICK; n++; }
      if (n === 8) acc = 0;
      var s = S;
      if (s.state !== lastState) {
        nodes.forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-hsd') === s.state); });
        lastState = s.state;
      }
      ctx.clearRect(0, 0, w, h);
      drawTable(ctx, vp, pal);
      drawWorkspace(ctx, vp, pal);
      // defense and attack lines
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
      ctx.strokeStyle = COL.defend;
      ctx.beginPath(); ctx.moveTo(vp.X(G.DEFEND_X), vp.Y(G.R.y1)); ctx.lineTo(vp.X(G.DEFEND_X), vp.Y(G.R.y0)); ctx.stroke();
      ctx.strokeStyle = COL.strike;
      ctx.beginPath(); ctx.moveTo(vp.X(G.ATTACK_X), vp.Y(G.R.y1)); ctx.lineTo(vp.X(G.ATTACK_X), vp.Y(G.R.y0)); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, 'defense line', vp.X(G.DEFEND_X), vp.Y(G.R.y0) + 10, COL.defend, 10, 'center');
      label(ctx, 'attack line', vp.X(G.ATTACK_X), vp.Y(G.R.y0) + 10, COL.strike, 10, 'center');
      drawCorners(ctx, vp, pal, s.m, 0.5);
      // predicted puck path from the filtered state
      if (s.trk.init && norm(s.trk.vel) > 30) {
        var pr = predictTrajectory(s.trk.pos, s.trk.vel, 0.02, 60);
        ctx.strokeStyle = COL.pred; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(vp.X(s.trk.pos[0]), vp.Y(s.trk.pos[1]));
        pr.forEach(function (p) { ctx.lineTo(vp.X(p[0]), vp.Y(p[1])); });
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (s.state === 'DEFEND' && s.strat.interceptY !== null) {
        var ix = vp.X(G.DEFEND_X), iy = vp.Y(s.strat.interceptY);
        ctx.strokeStyle = COL.pred; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ix - 6, iy - 6); ctx.lineTo(ix + 6, iy + 6); ctx.moveTo(ix + 6, iy - 6); ctx.lineTo(ix - 6, iy + 6); ctx.stroke();
      }
      // committed trajectory
      var tr = s.strat.atk.traj;
      if (tr) {
        var PH = [COL.plan, COL.ft, COL.ret];
        for (var i = 1; i < tr.pos.length; i++) {
          var ph = i < tr.phases[0] ? 0 : (i < tr.phases[0] + tr.phases[1] ? 1 : 2);
          ctx.strokeStyle = s.state === 'RECOVER' && ph === 0 ? COL.recover : PH[ph];
          ctx.globalAlpha = i < s.strat.atk.tick ? 0.25 : 1; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(vp.X(tr.pos[i - 1][0]), vp.Y(tr.pos[i - 1][1])); ctx.lineTo(vp.X(tr.pos[i][0]), vp.Y(tr.pos[i][1])); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      drawDisc(ctx, vp, s.puck.p, G.PR, COL.puck, pal.dark ? '#bbf7d0' : '#14532d');
      drawDisc(ctx, vp, s.m, G.MR, COL.mallet, pal.fg);
      ctx.strokeStyle = pal.fg; ctx.lineWidth = 1;
      var cx = vp.X(s.cmd[0]), cy = vp.Y(s.cmd[1]);
      ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke();
      // HUD
      pill(ctx, s.state, 8, 4, STATE_COL[s.state] || COL.idle, 12);
      label(ctx, 'Robot ' + s.score[0] + ' – ' + s.score[1] + ' Opponent', w - 8, 16, pal.fg, 13, 'right', '600');
      if (s.flash && s.t - s.flash.t < 1.2) label(ctx, s.flash.text, w / 2, 16, pal.fg2, 13, 'center', '600');
    }
    root.querySelector('[data-act="reset"]').addEventListener('click', reset);
    Stage(canvas, { aspect: function (w) { return w >= 620 ? 0.68 : 0.72; }, draw: draw, onResize: onResize });
  }

  function boot() {
    var map = { vision: initVision, ekf: initEKF, kinematics: initKinematics, quintic: initQuintic, game: initGame };
    document.querySelectorAll('[data-ahr-demo]').forEach(function (el) {
      var f = map[el.getAttribute('data-ahr-demo')];
      if (f) { try { f(el); } catch (e) { if (window.console) console.error('air hockey demo failed', e); } }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
