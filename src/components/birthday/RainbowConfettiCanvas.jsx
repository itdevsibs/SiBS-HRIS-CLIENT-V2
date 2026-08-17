import { useEffect, useRef } from "react";
import { createBirthdayParticles } from "./birthdayConfetti.js";

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i += 1) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, x, y, size) {
  const d = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + d / 2);
  ctx.bezierCurveTo(x, y, x - d, y, x - d, y + d / 2);
  ctx.bezierCurveTo(x - d, y + d, x, y + d * 1.4, x, y + d * 1.8);
  ctx.bezierCurveTo(x, y + d * 1.4, x + d, y + d, x + d, y + d / 2);
  ctx.bezierCurveTo(x + d, y, x, y, x, y + d / 2);
  ctx.closePath();
  ctx.fill();
}

export default function RainbowConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const count = width >= 768 ? 80 : 40;
    const particles = createBirthdayParticles({ count, width, height });

    let animationFrameId = null;
    let startTime = null;
    const maxDuration = 3000;

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed >= maxDuration) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.rotation += p.rotationSpeed;

        const progress = elapsed / p.lifeMs;
        const opacity = progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 1;

        if (opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "rect") {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, 0, 0, 5, p.width, p.width * 0.45);
        } else if (p.shape === "heart") {
          drawHeart(ctx, 0, -p.width / 2, p.width);
        }

        ctx.restore();
      });

      animationFrameId = window.requestAnimationFrame(render);
    }

    animationFrameId = window.requestAnimationFrame(render);

    const handleVisibilityChange = () => {
      if (document.hidden && animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        if (ctx) ctx.clearRect(0, 0, width, height);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    />
  );
}
