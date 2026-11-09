'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function HeroCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 9.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Root group for all interactive tilt & rotation
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Track resources for safe disposal
    const disposables: { dispose: () => void }[] = [];
    const register = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // -------------------------------------------------------------
    // 2. CENTRAL CONTAINER POD (Symbolizing Docker Containerization)
    // -------------------------------------------------------------
    const containerGroup = new THREE.Group();
    worldGroup.add(containerGroup);

    // Glass walls of container
    const boxGeo = register(new THREE.BoxGeometry(2.4, 2.4, 2.4));
    const glassMat = register(
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        emissive: 0x0284c7,
        emissiveIntensity: 0.15,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.25,
        transmission: 0.6,
        ior: 1.4,
      })
    );
    const glassBox = new THREE.Mesh(boxGeo, glassMat);
    containerGroup.add(glassBox);

    // Neon edge rails
    const boxEdges = register(new THREE.EdgesGeometry(boxGeo));
    const edgeMat = register(
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      })
    );
    const edgeLines = new THREE.LineSegments(boxEdges, edgeMat);
    containerGroup.add(edgeLines);

    // 8 Corner reinforcement brackets (Container pads)
    const cornerGeo = register(new THREE.BoxGeometry(0.35, 0.35, 0.35));
    const cornerMat = register(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.9,
      })
    );
    const cornerPositions = [
      [-1.2, -1.2, -1.2],
      [-1.2, -1.2, 1.2],
      [-1.2, 1.2, -1.2],
      [-1.2, 1.2, 1.2],
      [1.2, -1.2, -1.2],
      [1.2, -1.2, 1.2],
      [1.2, 1.2, -1.2],
      [1.2, 1.2, 1.2],
    ];
    cornerPositions.forEach(([x, y, z]) => {
      const corner = new THREE.Mesh(cornerGeo, cornerMat);
      corner.position.set(x, y, z);
      containerGroup.add(corner);
    });

    // -------------------------------------------------------------
    // 3. FLOATING HOLOGRAPHIC CODE GLYPH: < / > (Symbolizing Editor & Code)
    // -------------------------------------------------------------
    const codeGlyphGroup = new THREE.Group();
    containerGroup.add(codeGlyphGroup);

    const segmentMat = register(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.8,
        roughness: 0.2,
        metalness: 0.5,
      })
    );

    // Helper to create glowing cylinder bars for the `< / >` code symbol
    const createBar = (length: number, rotZ: number, posX: number, posY: number) => {
      const geo = register(new THREE.CylinderGeometry(0.045, 0.045, length, 16));
      const mesh = new THREE.Mesh(geo, segmentMat);
      mesh.rotation.z = rotZ;
      mesh.position.set(posX, posY, 0);
      codeGlyphGroup.add(mesh);
    };

    // Left Angle Bracket `<`
    createBar(0.65, Math.PI / 4, -0.65, 0.22);
    createBar(0.65, -Math.PI / 4, -0.65, -0.22);

    // Slash `/`
    createBar(0.95, -Math.PI / 7, 0, 0);

    // Right Angle Bracket `>`
    createBar(0.65, -Math.PI / 4, 0.65, 0.22);
    createBar(0.65, Math.PI / 4, 0.65, -0.22);

    // Inner glowing energy core inside the code glyph
    const coreSphereGeo = register(new THREE.SphereGeometry(0.28, 24, 24));
    const coreSphereMat = register(
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.65,
      })
    );
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    codeGlyphGroup.add(coreSphere);

    // -------------------------------------------------------------
    // 4. SATELLITE RUNTIME PODS (JS, TS, Python, Docker)
    // -------------------------------------------------------------
    const POD_CONFIGS = [
      { color: 0xf59e0b, name: 'Node.js', angle: 0 },
      { color: 0x3b82f6, name: 'TypeScript', angle: Math.PI * 0.5 },
      { color: 0x10b981, name: 'Python', angle: Math.PI },
      { color: 0x06b6d4, name: 'Docker', angle: Math.PI * 1.5 },
    ];

    const satelliteOrbitRadius = 4.2;
    const satellites: {
      mesh: THREE.Group;
      angle: number;
      speed: number;
      color: number;
      laser: THREE.Line;
      packet: THREE.Mesh;
      packetProgress: number;
    }[] = [];

    const satelliteBoxGeo = register(new THREE.BoxGeometry(0.7, 0.7, 0.7));
    const satelliteEdges = register(new THREE.EdgesGeometry(satelliteBoxGeo));

    POD_CONFIGS.forEach((cfg) => {
      const satGroup = new THREE.Group();
      worldGroup.add(satGroup);

      // Mini pod body
      const satMat = register(
        new THREE.MeshStandardMaterial({
          color: 0x090d16,
          emissive: cfg.color,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.8,
          transparent: true,
          opacity: 0.7,
        })
      );
      const satMesh = new THREE.Mesh(satelliteBoxGeo, satMat);
      satGroup.add(satMesh);

      // Glowing edge lines
      const satEdgeMat = register(
        new THREE.LineBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.9,
        })
      );
      const satEdgeLine = new THREE.LineSegments(satelliteEdges, satEdgeMat);
      satGroup.add(satEdgeLine);

      // Laser stream connecting satellite to central container
      const linePositions = new Float32Array(6);
      const lineGeo = register(new THREE.BufferGeometry());
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const lineMat = register(
        new THREE.LineDashedMaterial({
          color: cfg.color,
          dashSize: 0.2,
          gapSize: 0.15,
          transparent: true,
          opacity: 0.45,
        })
      );
      const laserLine = new THREE.Line(lineGeo, lineMat);
      worldGroup.add(laserLine);

      // Data Packet travelling along the laser stream
      const packetGeo = register(new THREE.SphereGeometry(0.08, 12, 12));
      const packetMat = register(
        new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.9,
        })
      );
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      worldGroup.add(packetMesh);

      satellites.push({
        mesh: satGroup,
        angle: cfg.angle,
        speed: 0.25,
        color: cfg.color,
        laser: laserLine,
        packet: packetMesh,
        packetProgress: Math.random(),
      });
    });

    // -------------------------------------------------------------
    // 5. CYBER MAINFRAME GRID FLOOR (Symbolizing Cloud Infrastructure)
    // -------------------------------------------------------------
    const gridHelper = register(new THREE.GridHelper(26, 26, 0x38bdf8, 0x1e293b));
    gridHelper.position.y = -3.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    worldGroup.add(gridHelper);

    // -------------------------------------------------------------
    // 6. STREAMING DATA PARTICLES (Symbolizing Socket.IO & Realtime Packets)
    // -------------------------------------------------------------
    const particleCount = 900;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x38bdf8);
    const c2 = new THREE.Color(0x818cf8);
    const c3 = new THREE.Color(0x34d399);

    for (let i = 0; i < particleCount; i++) {
      // Cylinder cloud distribution
      const radius = 2.0 + Math.random() * 5.5;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.0;

      particlePositions[i * 3] = radius * Math.cos(angle);
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = radius * Math.sin(angle);

      const color = Math.random() < 0.55 ? c1 : Math.random() < 0.85 ? c2 : c3;
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    const particleGeo = register(new THREE.BufferGeometry());
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = register(
      new THREE.PointsMaterial({
        size: 0.065,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    const particles = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particles);

    // -------------------------------------------------------------
    // 7. LIGHTING
    // -------------------------------------------------------------
    const ambientLight = register(new THREE.AmbientLight(0xffffff, 0.7));
    scene.add(ambientLight);

    const keyLight = register(new THREE.PointLight(0x38bdf8, 4, 18));
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);

    const rimLight = register(new THREE.PointLight(0x818cf8, 3, 18));
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // -------------------------------------------------------------
    // 8. INTERACTIVITY: MOUSE TRACKING & PARALLAX SCROLL
    // -------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let scrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 2;
      mouseY = y * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY || 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // 9. ANIMATION LOOP
    // -------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Slow majestic rotation of central container
      containerGroup.rotation.y = elapsed * 0.2;
      containerGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.12;

      // Inner code glyph floats and bobs gently
      codeGlyphGroup.position.y = Math.sin(elapsed * 1.6) * 0.1;
      codeGlyphGroup.rotation.y = -elapsed * 0.4;
      const pulseScale = 1 + Math.sin(elapsed * 2.5) * 0.05;
      coreSphere.scale.set(pulseScale, pulseScale, pulseScale);

      // Rotate orbiting satellites & compute laser streams
      satellites.forEach((sat, i) => {
        sat.angle += sat.speed * delta;
        const x = Math.cos(sat.angle) * satelliteOrbitRadius;
        const z = Math.sin(sat.angle) * satelliteOrbitRadius;
        const y = Math.sin(sat.angle * 2 + i) * 0.6;

        sat.mesh.position.set(x, y, z);
        sat.mesh.rotation.x += delta * 0.8;
        sat.mesh.rotation.y += delta * 1.2;

        // Update laser line vertices from satellite to center
        const linePos = sat.laser.geometry.attributes.position as THREE.BufferAttribute;
        linePos.setXYZ(0, x, y, z);
        linePos.setXYZ(1, 0, 0, 0);
        linePos.needsUpdate = true;
        sat.laser.computeLineDistances();

        // Animate data packet moving along laser
        sat.packetProgress = (sat.packetProgress + delta * 0.7) % 1.0;
        const packetX = THREE.MathUtils.lerp(x, 0, sat.packetProgress);
        const packetY = THREE.MathUtils.lerp(y, 0, sat.packetProgress);
        const packetZ = THREE.MathUtils.lerp(z, 0, sat.packetProgress);
        sat.packet.position.set(packetX, packetY, packetZ);
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsed * 0.03;

      // Mouse & scroll parallax
      const scrollOffset = scrollY * 0.0012;
      targetRotationY = mouseX * 0.45;
      targetRotationX = mouseY * 0.3 + scrollOffset;

      worldGroup.rotation.y += (targetRotationY - worldGroup.rotation.y) * 0.04;
      worldGroup.rotation.x += (targetRotationX - worldGroup.rotation.x) * 0.04;

      // Smooth camera drift with scroll
      camera.position.y = 1.2 - scrollOffset * 0.8;

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.9 }}
    />
  );
}
