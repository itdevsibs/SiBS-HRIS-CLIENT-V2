import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;

uniform float u_time;
uniform vec3 u_base;
uniform vec3 u_navy;
uniform vec3 u_blue;
uniform vec3 u_orange;
varying vec2 v_uv;

// Simplex noise from the supplied GradientWave shader.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec2 uv = v_uv;
  float drift = u_time * 0.09;
  // Move and deform the sampling field for all three color layers together.
  vec2 travel = vec2(
    0.78 * sin(u_time * 0.31 - 1.0),
    0.60 * cos(u_time * 0.36)
  );
  vec2 flow = (uv - 0.5) * vec2(1.85, 1.7) - travel;
  flow.y += flow.x * 0.38;
  float fold = snoise(vec3(flow * 0.82, drift));
  flow += fold * vec2(0.22, 0.38);

  float depth = snoise(vec3(flow * 0.72 + vec2(0.3, 1.4), drift + 1.0));
  float crest = snoise(vec3(flow * vec2(0.93, 1.48), drift + 3.0));
  float blue = smoothstep(-0.30, 0.54, crest);
  float orange = smoothstep(0.20, 0.77, crest);

  vec3 color = mix(u_base, u_navy, smoothstep(-0.55, 0.55, depth));
  color = mix(color, u_blue, 0.64 * blue);
  color = mix(color, u_orange, 0.64 * orange * orange);

  vec2 center = (uv - vec2(0.5)) * vec2(1.0, 0.84);
  color = mix(color, u_base, 0.42 * (1.0 - smoothstep(0.06, 0.46, length(center))));
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = vertex && fragment && gl.createProgram();
  if (program) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!program) return null;
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function setColor(gl, program, styles, uniform, token) {
  const hex = styles.getPropertyValue(token).trim();
  const rgb = Number.parseInt(hex.slice(1), 16);
  gl.uniform3f(
    gl.getUniformLocation(program, uniform),
    ((rgb >> 16) & 255) / 255,
    ((rgb >> 8) & 255) / 255,
    (rgb & 255) / 255,
  );
}

export function GradientWave() {
  const canvasRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const styles = getComputedStyle(canvas);
    setColor(gl, program, styles, "u_base", "--color-sibs-auth-bg");
    setColor(gl, program, styles, "u_navy", "--color-sibs-navy");
    setColor(gl, program, styles, "u_blue", "--color-sibs-tertiary-4");
    setColor(gl, program, styles, "u_orange", "--color-sibs-orange");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    let frame;
    let lastDraw;
    let elapsed = 0;
    const draw = () => {
      gl.uniform1f(timeLocation, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (!clientWidth || !clientHeight || gl.isContextLost()) return;
      // Keep the decorative canvas below full viewport resolution on large displays.
      const scale = Math.min(1, 960 / clientWidth, 640 / clientHeight);
      canvas.width = Math.round(clientWidth * scale);
      canvas.height = Math.round(clientHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
      canvas.style.visibility = "visible";
    };
    const tick = (now) => {
      if (lastDraw === undefined || now - lastDraw >= 32) {
        if (lastDraw !== undefined) elapsed += Math.min(now - lastDraw, 64) / 1000;
        lastDraw = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const syncVisibility = () => {
      cancelAnimationFrame(frame);
      lastDraw = undefined;
      if (!document.hidden && !gl.isContextLost()) frame = requestAnimationFrame(tick);
    };
    const showFallback = () => {
      cancelAnimationFrame(frame);
      canvas.style.visibility = "hidden";
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", syncVisibility);
    canvas.addEventListener("webglcontextlost", showFallback);
    syncVisibility();

    return () => {
      showFallback();
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      canvas.removeEventListener("webglcontextlost", showFallback);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-sibs-auth-bg"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 85% 30%, color-mix(in srgb, var(--color-sibs-orange) 32%, transparent), transparent 30%),
          radial-gradient(ellipse at 7% 28%, var(--color-sibs-tertiary-4), transparent 62%),
          linear-gradient(145deg, var(--color-sibs-navy), var(--color-sibs-auth-bg) 62%)
        `,
      }}
    >
      {!prefersReducedMotion && (
        <canvas ref={canvasRef} className="invisible absolute inset-0 block h-full w-full" />
      )}
    </div>
  );
}
