'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function HeroCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Fog Setup (blends into #09090b background)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.038);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3.5, 12);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Track disposables
    const disposables: { dispose: () => void }[] = [];
    const register = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // 2. Interactive Digital Terrain Wave Geometry
    const gridWidth = 42;
    const gridDepth = 36;
    const segmentsX = 80;
    const segmentsY = 70;

    const planeGeo = register(
      new THREE.PlaneGeometry(gridWidth, gridDepth, segmentsX, segmentsY)
    );
    // Rotate to lie horizontally
    planeGeo.rotateX(-Math.PI / 2.15);

    // Store base positions for wave calculation
    const basePositions = planeGeo.attributes.position.clone();
    const count = basePositions.count;

    // A. Wireframe Wave Mesh
    const wireframeMat = register(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
    );
    const waveMesh = new THREE.Mesh(planeGeo, wireframeMat);
    waveMesh.position.set(0, -2.4, -2);
    scene.add(waveMesh);

    // B. Glowing Peak Particle Nodes
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
        gradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      return register(new THREE.CanvasTexture(canvas));
    };

    const particleTexture = createCircleTexture();
    const pointsMat = register(
      new THREE.PointsMaterial({
        size: 0.12,
        map: particleTexture,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const wavePoints = new THREE.Points(planeGeo, pointsMat);
    wavePoints.position.copy(waveMesh.position);
    scene.add(wavePoints);

    // C. Ambient Floating Cyber Dust Particles
    const dustCount = 180;
    const dustGeo = register(new THREE.BufferGeometry());
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 35;
      dustPositions[i * 3 + 1] = Math.random() * 8 - 1;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      dustSpeeds[i] = 0.003 + Math.random() * 0.008;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = register(
      new THREE.PointsMaterial({
        size: 0.08,
        map: particleTexture,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // 3. Mouse Interaction & Physics
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      worldX: 0,
      worldZ: 0,
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.targetX = normX;
      mouse.targetY = normY;
      mouse.worldX = normX * 12;
      mouse.worldZ = normY * 8;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 4. Smooth Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // Subtle camera parallax
      camera.position.x = mouse.x * 1.8;
      camera.position.y = 3.5 + mouse.y * 0.8;
      camera.lookAt(0, -0.6, 0);

      // Wave calculation across all vertices
      const positionAttr = planeGeo.attributes.position;
      const basePos = basePositions.array as Float32Array;
      const currentPos = positionAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const x = basePos[i3];
        const y = basePos[i3 + 1];
        const z = basePos[i3 + 2];

        // Complex undulating harmonic waves
        const wave1 = Math.sin(x * 0.35 + elapsedTime * 1.1) * Math.cos(z * 0.35 + elapsedTime * 0.8) * 0.75;
        const wave2 = Math.sin((x + z) * 0.22 + elapsedTime * 1.4) * 0.45;
        const wave3 = Math.cos(Math.sqrt(x * x + z * z) * 0.28 - elapsedTime * 0.9) * 0.35;

        // Interactive mouse gravity ripple
        const dx = x - mouse.worldX;
        const dz = z - mouse.worldZ;
        const distToMouse = Math.sqrt(dx * dx + dz * dz);
        const mouseRipple = Math.exp(-distToMouse * 0.22) * Math.sin(distToMouse * 1.2 - elapsedTime * 3) * 0.6;

        currentPos[i3 + 1] = y + wave1 + wave2 + wave3 + mouseRipple;
      }
      positionAttr.needsUpdate = true;

      // Animate ambient cyber dust floating upward
      const dustPos = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3 + 1] += dustSpeeds[i];
        if (dustPos[i * 3 + 1] > 7) {
          dustPos[i * 3 + 1] = -1.5;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 5. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {
          // ignore
        }
      });

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden -z-10"
      style={{ opacity: 0.85 }}
    />
  );
}
