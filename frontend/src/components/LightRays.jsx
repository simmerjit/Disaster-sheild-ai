import React, { useEffect, useRef } from 'react';

/**
 * LightRays Component (React Bits Style)
 * Minimalist cinematic white light rays radiating downwards from top-center.
 * Designed for luxury monochrome / black-and-white aesthetic.
 */
export const LightRays = ({
  rayCount = 12,
  particleCount = 35,
  speed = 0.8,
  className = '',
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize cinematic white light rays radiating from top-center
    const rays = Array.from({ length: rayCount }, (_, i) => {
      // Fan across downward cone (~130 degrees)
      const baseAngle = ((i / rayCount) * Math.PI * 0.72) + (Math.PI * 0.14);
      return {
        baseAngle,
        currentAngle: baseAngle,
        swaySpeed: (0.0003 + Math.random() * 0.0005) * speed,
        swayAmplitude: 0.035 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        width: 0.07 + Math.random() * 0.12, // angular width in radians
        length: 1.15 + Math.random() * 0.45,
        alpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: (0.0008 + Math.random() * 0.0012) * speed,
        pulsePhase: Math.random() * Math.PI * 2,
        isCore: i % 3 === 0,
      };
    });

    // Faint atmospheric floating particles (motes)
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18 * speed,
      vy: (0.08 + Math.random() * 0.22) * speed,
      radius: 0.6 + Math.random() * 1.2,
      alpha: 0.08 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.025,
    }));

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const originX = width * 0.5;
      const originY = -40; // slightly above viewport top center
      const maxDist = Math.hypot(width, height) * 1.25;

      // ── 1. Soft Top Center Glow Origin
      const originBloom = ctx.createRadialGradient(originX, 0, 0, originX, 0, width * 0.5);
      originBloom.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      originBloom.addColorStop(0.12, 'rgba(255, 255, 255, 0.12)');
      originBloom.addColorStop(0.4, 'rgba(255, 255, 255, 0.03)');
      originBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = originBloom;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // ── 2. Cinematic Volumetric White Light Rays (Screen Blend)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      rays.forEach((ray) => {
        const sway = Math.sin(time * ray.swaySpeed + ray.phase) * ray.swayAmplitude;
        const angle = ray.baseAngle + sway;
        const pulse = Math.sin(time * ray.pulseSpeed + ray.pulsePhase);
        const dynamicAlpha = Math.max(0.04, ray.alpha + pulse * 0.12);

        const leftAngle = angle - ray.width * 0.5;
        const rightAngle = angle + ray.width * 0.5;
        const rayLen = maxDist * ray.length;

        const x1 = originX;
        const y1 = originY;
        const x2 = originX + Math.cos(leftAngle) * rayLen;
        const y2 = originY + Math.sin(leftAngle) * rayLen;
        const x3 = originX + Math.cos(rightAngle) * rayLen;
        const y3 = originY + Math.sin(rightAngle) * rayLen;

        const rayGrad = ctx.createRadialGradient(originX, originY, 10, originX, originY, rayLen * 0.85);

        if (ray.isCore) {
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${dynamicAlpha * 0.75})`);
          rayGrad.addColorStop(0.2, `rgba(255, 255, 255, ${dynamicAlpha * 0.35})`);
          rayGrad.addColorStop(0.65, `rgba(255, 255, 255, ${dynamicAlpha * 0.08})`);
          rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${dynamicAlpha * 0.45})`);
          rayGrad.addColorStop(0.25, `rgba(255, 255, 255, ${dynamicAlpha * 0.18})`);
          rayGrad.addColorStop(0.7, `rgba(255, 255, 255, 0.02)`);
          rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();

        ctx.fillStyle = rayGrad;
        ctx.fill();
      });

      ctx.restore();

      // ── 3. Faint Dust Motes in Beams
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const distFromCenter = Math.abs(p.x - width * 0.5);
        const beamProximity = Math.max(0.15, 1 - (distFromCenter / (width * 0.55)));
        const alpha = (p.alpha + Math.sin(p.pulse) * 0.15) * beamProximity;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha * 0.75)})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fill();
      });

      ctx.restore();

      // ── 4. Subtle Atmospheric Top-Down Haze
      const haze = ctx.createLinearGradient(0, 0, 0, height);
      haze.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      haze.addColorStop(0.35, 'rgba(255, 255, 255, 0.01)');
      haze.addColorStop(0.8, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [rayCount, particleCount, speed]);

  return (
    <div className={`light-rays-container ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default LightRays;
