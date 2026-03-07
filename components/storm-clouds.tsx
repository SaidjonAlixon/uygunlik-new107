"use client";

import { useEffect, useRef, useState } from "react";

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
}

interface Lightning {
  x: number;
  y: number;
  intensity: number;
  branches: Array<{ x: number; y: number }>;
  age: number;
  duration: number;
}

export function StormClouds() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const cloudsRef = useRef<Cloud[]>([]);
  const lightningsRef = useRef<Lightning[]>([]);
  const lastLightningTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size - only top 35% of screen with fade area
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.35; // Top 35% for clouds with fade
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize clouds - more clouds
    const initClouds = () => {
      const clouds: Cloud[] = [];
      const cloudCount = 15; // Increased from 8 to 15

      for (let i = 0; i < cloudCount; i++) {
        const layer = Math.floor(Math.random() * 3);
        clouds.push({
          x: Math.random() * canvas.width * 1.5 - canvas.width * 0.5,
          y: Math.random() * canvas.height * 0.6,
          width: 150 + Math.random() * 200 + layer * 50,
          height: 60 + Math.random() * 80 + layer * 30,
          speed: 0.1 + Math.random() * 0.2 + layer * 0.1,
          opacity: layer === 0 ? 0.3 : layer === 1 ? 0.5 : 0.7,
          layer,
        });
      }
      cloudsRef.current = clouds;
    };

    initClouds();

    // Generate random lightning
    const createLightning = () => {
      const now = Date.now();
      // Random lightning every 1.5-4 seconds (more frequent)
      if (now - lastLightningTimeRef.current > 1500 + Math.random() * 2500) {
        const cloud = cloudsRef.current[Math.floor(Math.random() * cloudsRef.current.length)];
        if (!cloud) return;

        const lightning: Lightning = {
          x: cloud.x + cloud.width * 0.3 + Math.random() * cloud.width * 0.4,
          y: cloud.y + cloud.height,
          intensity: 0.8 + Math.random() * 0.2,
          branches: [],
          age: 0,
          duration: 80 + Math.random() * 120, // 80-200ms (longer visible)
        };

        // Create simple lightning branches - fewer branches for simpler look
        const branchCount = 2 + Math.floor(Math.random() * 2); // 2-3 branches (simpler)
        const randomOffset = Math.random() * 1000; // Seed for consistent randomness
        for (let i = 0; i < branchCount; i++) {
          // Use deterministic randomness based on index
          const seedX = ((i * 17 + randomOffset) % 100) / 100;
          const seedY = ((i * 23 + randomOffset) % 100) / 100;
          lightning.branches.push({
            x: lightning.x + (seedX - 0.5) * 30, // Smaller spread
            y: lightning.y + (i + 1) * (canvas.height * 0.4 / branchCount) + (seedY - 0.5) * 15,
          });
        }

        lightningsRef.current.push(lightning);
        lastLightningTimeRef.current = now;
      }
    };

    // Draw a single cloud with volumetric depth and smooth bottom fade
    const drawCloud = (cloud: Cloud) => {
      ctx.save();
      
      // Calculate fade based on distance from bottom
      const bottomDistance = canvas.height - (cloud.y + cloud.height);
      const fadeStart = canvas.height * 0.1; // Start fading 10% from bottom
      const fadeRatio = Math.max(0, Math.min(1, bottomDistance / fadeStart));
      const finalOpacity = cloud.opacity * fadeRatio;
      
      ctx.globalAlpha = finalOpacity;

      // Create cloud using multiple overlapping circles for soft, volumetric look
      const gradient = ctx.createRadialGradient(
        cloud.x + cloud.width * 0.3,
        cloud.y + cloud.height * 0.5,
        0,
        cloud.x + cloud.width * 0.5,
        cloud.y + cloud.height * 0.5,
        cloud.width * 0.5
      );

      // Winter cloud colors: dark gray to deep blue
      if (cloud.layer === 0) {
        gradient.addColorStop(0, "rgba(60, 70, 85, 0.6)");
        gradient.addColorStop(0.5, "rgba(45, 55, 70, 0.5)");
        gradient.addColorStop(1, "rgba(30, 40, 55, 0.3)");
      } else if (cloud.layer === 1) {
        gradient.addColorStop(0, "rgba(50, 60, 75, 0.7)");
        gradient.addColorStop(0.5, "rgba(35, 45, 60, 0.6)");
        gradient.addColorStop(1, "rgba(25, 35, 50, 0.4)");
      } else {
        gradient.addColorStop(0, "rgba(40, 50, 65, 0.8)");
        gradient.addColorStop(0.5, "rgba(30, 40, 55, 0.7)");
        gradient.addColorStop(1, "rgba(20, 30, 45, 0.5)");
      }

      // Draw cloud using multiple circles for soft, layered effect
      const circles = [
        { x: cloud.x + cloud.width * 0.2, y: cloud.y + cloud.height * 0.3, r: cloud.width * 0.25 },
        { x: cloud.x + cloud.width * 0.5, y: cloud.y + cloud.height * 0.4, r: cloud.width * 0.3 },
        { x: cloud.x + cloud.width * 0.8, y: cloud.y + cloud.height * 0.35, r: cloud.width * 0.25 },
        { x: cloud.x + cloud.width * 0.35, y: cloud.y + cloud.height * 0.6, r: cloud.width * 0.2 },
        { x: cloud.x + cloud.width * 0.65, y: cloud.y + cloud.height * 0.65, r: cloud.width * 0.22 },
      ];

      circles.forEach((circle) => {
        const circleGradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.r
        );
        
        if (cloud.layer === 0) {
          circleGradient.addColorStop(0, "rgba(70, 80, 95, 0.5)");
          circleGradient.addColorStop(1, "rgba(40, 50, 65, 0)");
        } else if (cloud.layer === 1) {
          circleGradient.addColorStop(0, "rgba(60, 70, 85, 0.6)");
          circleGradient.addColorStop(1, "rgba(35, 45, 60, 0)");
        } else {
          circleGradient.addColorStop(0, "rgba(50, 60, 75, 0.7)");
          circleGradient.addColorStop(1, "rgba(30, 40, 55, 0)");
        }

        ctx.fillStyle = circleGradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add soft white highlights for depth
      if (cloud.layer > 0) {
        const highlightGradient = ctx.createRadialGradient(
          cloud.x + cloud.width * 0.3,
          cloud.y + cloud.height * 0.3,
          0,
          cloud.x + cloud.width * 0.3,
          cloud.y + cloud.height * 0.3,
          cloud.width * 0.2
        );
        highlightGradient.addColorStop(0, "rgba(200, 210, 220, 0.3)");
        highlightGradient.addColorStop(1, "rgba(200, 210, 220, 0)");
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.3, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw lightning with branches - thicker and simpler
    const drawLightning = (lightning: Lightning) => {
      ctx.save();
      
      // Lightning intensity based on age
      const ageRatio = lightning.age / lightning.duration;
      const currentIntensity = lightning.intensity * (1 - ageRatio);
      
      // Thicker lightning
      ctx.strokeStyle = `rgba(255, 255, 255, ${currentIntensity})`;
      ctx.lineWidth = 4; // Increased from 2 to 4
      ctx.shadowBlur = 25; // Increased glow
      ctx.shadowColor = `rgba(200, 220, 255, ${currentIntensity * 0.9})`;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Main lightning bolt
      ctx.beginPath();
      ctx.moveTo(lightning.x, lightning.y);
      
      lightning.branches.forEach((branch, index) => {
        if (index === 0) {
          ctx.lineTo(branch.x, branch.y);
        } else {
          const prevBranch = lightning.branches[index - 1];
          // Zigzag pattern for realistic lightning - use deterministic offset
          const zigzagOffset = ((index * 7 + lightning.x) % 30) - 15;
          const midX = (prevBranch.x + branch.x) / 2 + zigzagOffset;
          const midY = (prevBranch.y + branch.y) / 2;
          ctx.lineTo(midX, midY);
          ctx.lineTo(branch.x, branch.y);
        }
      });
      
      ctx.stroke();

      // Add bright flash at start with larger radius
      const flashRadius = 80;
      const flashGradient = ctx.createRadialGradient(
        lightning.x, lightning.y, 0,
        lightning.x, lightning.y, flashRadius
      );
      flashGradient.addColorStop(0, `rgba(255, 255, 255, ${currentIntensity * 0.8})`);
      flashGradient.addColorStop(0.3, `rgba(220, 240, 255, ${currentIntensity * 0.5})`);
      flashGradient.addColorStop(0.6, `rgba(200, 220, 255, ${currentIntensity * 0.2})`);
      flashGradient.addColorStop(1, "rgba(200, 220, 255, 0)");
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(lightning.x, lightning.y, flashRadius, 0, Math.PI * 2);
      ctx.fill();

      // Add strong screen flash effect - lightning illuminates the screen
      if (lightning.age < 5) {
        const flashIntensity = currentIntensity * 0.3; // Stronger flash
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add blue tint for realistic lightning flash
        ctx.fillStyle = `rgba(200, 220, 255, ${flashIntensity * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw clouds
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed;

        // Reset if off screen
        if (cloud.x > canvas.width + cloud.width) {
          cloud.x = -cloud.width;
          cloud.y = Math.random() * canvas.height * 0.6;
        }

        drawCloud(cloud);
      });

      // Create new lightning randomly
      createLightning();

      // Update and draw lightnings
      lightningsRef.current = lightningsRef.current.filter((lightning) => {
        lightning.age++;
        if (lightning.age < lightning.duration) {
          drawLightning(lightning);
          return true;
        }
        return false;
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
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{
        zIndex: 9998,
        height: "35vh",
      }}
      aria-hidden="true"
    />
  );
}

