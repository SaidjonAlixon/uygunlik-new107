"use client";

import { useEffect, useRef } from "react";

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  wind: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  drift: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
  lightAngle: number; // Angle for light refraction
}

export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const snowflakesRef = useRef<Snowflake[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize snowflakes with realistic ice crystal properties
    const initSnowflakes = () => {
      const snowflakes: Snowflake[] = [];
      const count = 80; // Optimized count for performance

      for (let i = 0; i < count; i++) {
        const layer = Math.floor(Math.random() * 3); // 0, 1, or 2
        
        snowflakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height, // Start above viewport
          size: layer === 0 ? 5 + Math.random() * 5 : layer === 1 ? 8 + Math.random() * 6 : 12 + Math.random() * 8,
          speed: layer === 0 ? 0.4 + Math.random() * 0.4 : layer === 1 ? 0.6 + Math.random() * 0.6 : 0.9 + Math.random() * 0.8,
          wind: (Math.random() - 0.5) * 0.4,
          opacity: layer === 0 ? 0.6 : layer === 1 ? 0.8 : 0.95, // Semi-transparent for realism
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          drift: (Math.random() - 0.5) * 0.6,
          layer,
          lightAngle: Math.random() * Math.PI * 2, // Random light angle for refraction
        });
      }
      snowflakesRef.current = snowflakes;
    };

    initSnowflakes();

    // Draw realistic ice crystal with perfect symmetry, transparency, and light refraction
    const drawSnowflake = (flake: Snowflake) => {
      ctx.save();
      ctx.globalAlpha = flake.opacity;
      ctx.translate(flake.x, flake.y);
      ctx.rotate(flake.rotation);

      const size = flake.size;
      const branchLength = size * 0.9;
      const branchWidth = size * 0.12;

      // Calculate light direction (from top, slightly angled)
      const lightX = Math.sin(flake.lightAngle) * 0.3;
      const lightY = -0.8; // Light comes from top
      
      // Draw 6 main branches with perfect symmetry
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);

        // Main branch with transparency gradient
        const branchGradient = ctx.createLinearGradient(0, 0, 0, branchLength);
        branchGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)"); // Center - more opaque
        branchGradient.addColorStop(0.5, "rgba(240, 248, 255, 0.85)"); // Mid - semi-transparent
        branchGradient.addColorStop(1, "rgba(220, 240, 255, 0.6)"); // Tip - more transparent
        
        ctx.fillStyle = branchGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-branchWidth, branchLength * 0.4);
        ctx.lineTo(0, branchLength);
        ctx.lineTo(branchWidth, branchLength * 0.4);
        ctx.closePath();
        ctx.fill();

        // Add light refraction effect on branch - rainbow prism colors
        const refractionGradient = ctx.createLinearGradient(
          -branchWidth * 0.5, 0,
          branchWidth * 0.5, branchLength * 0.6
        );
        // Realistic prism refraction colors
        refractionGradient.addColorStop(0, "rgba(180, 200, 255, 0.4)"); // Blue
        refractionGradient.addColorStop(0.2, "rgba(200, 220, 255, 0.5)"); // Light blue
        refractionGradient.addColorStop(0.4, "rgba(255, 255, 255, 0.6)"); // White
        refractionGradient.addColorStop(0.5, "rgba(255, 250, 240, 0.5)"); // Warm white
        refractionGradient.addColorStop(0.6, "rgba(255, 255, 255, 0.6)"); // White
        refractionGradient.addColorStop(0.8, "rgba(220, 240, 255, 0.5)"); // Light blue
        refractionGradient.addColorStop(1, "rgba(200, 220, 255, 0.4)"); // Blue
        
        ctx.fillStyle = refractionGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-branchWidth * 0.6, branchLength * 0.6);
        ctx.lineTo(0, branchLength * 0.9);
        ctx.lineTo(branchWidth * 0.6, branchLength * 0.6);
        ctx.closePath();
        ctx.fill();

        // Side branches (left) - smaller, more delicate
        ctx.save();
        ctx.translate(branchLength * 0.6, 0);
        ctx.rotate(-Math.PI / 3);
        
        const sideGradient = ctx.createLinearGradient(0, 0, 0, branchLength * 0.35);
        sideGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        sideGradient.addColorStop(1, "rgba(240, 248, 255, 0.5)");
        
        ctx.fillStyle = sideGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-branchWidth * 0.5, branchLength * 0.15);
        ctx.lineTo(0, branchLength * 0.35);
        ctx.lineTo(branchWidth * 0.5, branchLength * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Side branches (right)
        ctx.save();
        ctx.translate(branchLength * 0.6, 0);
        ctx.rotate(Math.PI / 3);
        
        ctx.fillStyle = sideGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-branchWidth * 0.5, branchLength * 0.15);
        ctx.lineTo(0, branchLength * 0.35);
        ctx.lineTo(branchWidth * 0.5, branchLength * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      // Center hexagon - more realistic than circle
      const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.25);
      centerGradient.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      centerGradient.addColorStop(0.5, "rgba(240, 248, 255, 0.9)");
      centerGradient.addColorStop(1, "rgba(220, 240, 255, 0.7)");
      
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = Math.cos(angle) * size * 0.2;
        const y = Math.sin(angle) * size * 0.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Light reflection from top (winter sun)
      const lightReflection = ctx.createRadialGradient(
        lightX * size * 0.3,
        lightY * size * 0.3,
        0,
        lightX * size * 0.3,
        lightY * size * 0.3,
        size * 0.4
      );
      lightReflection.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      lightReflection.addColorStop(0.5, "rgba(250, 250, 255, 0.3)");
      lightReflection.addColorStop(1, "rgba(240, 248, 255, 0)");
      
      ctx.fillStyle = lightReflection;
      ctx.beginPath();
      ctx.arc(lightX * size * 0.3, lightY * size * 0.3, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Subtle shadow for depth
      if (flake.layer > 0) {
        ctx.shadowBlur = size * 0.2;
        ctx.shadowColor = "rgba(150, 180, 220, 0.3)";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((flake) => {
        // Update position with natural physics
        flake.y += flake.speed;
        
        // Wind effect - stronger for larger flakes (near layer)
        const windStrength = flake.layer === 0 ? 0.2 : flake.layer === 1 ? 0.4 : 0.6;
        const windVariation = Math.sin(flake.y * 0.005 + Date.now() * 0.0001) * windStrength;
        flake.x += flake.wind + windVariation + Math.sin(flake.y * 0.01) * flake.drift;
        
        flake.rotation += flake.rotationSpeed;
        
        // Update light angle for dynamic refraction
        flake.lightAngle += 0.01;

        // Reset if off screen
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        // Wrap horizontally for seamless loop
        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }

        // Only draw if visible (performance optimization)
        if (flake.y > -20 && flake.y < canvas.height + 20) {
          drawSnowflake(flake);
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Bokeh background effect - blurred winter atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9997,
          background: "radial-gradient(circle at 20% 30%, rgba(200, 220, 240, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(180, 200, 230, 0.1) 0%, transparent 50%)",
          filter: "blur(40px)",
          opacity: 0.6,
        }}
        aria-hidden="true"
      />
      
      {/* Main snowflake canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          filter: "blur(0.2px)",
        }}
        aria-hidden="true"
      />
      
      {/* Winter sun light from top */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 9998,
          height: "40vh",
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 0%, rgba(240, 248, 255, 0.04) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      />
    </>
  );
}

