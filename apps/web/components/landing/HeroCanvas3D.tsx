'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function HeroCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Disposables tracker
    const disposables: { dispose: () => void }[] = [];
    const register = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, getWidth() / getHeight(), 0.1, 100);
    camera.position.set(0, 0.0, 9.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting Setup (Soft Rim Lights Behind Model, Zero Front Blowout)
    const ambientLight = new THREE.AmbientLight(0x0c0517, 1.2);
    scene.add(ambientLight);

    // Behind top-left lavender rim light (illuminates top-left edge curves)
    const keyRimLeft = new THREE.DirectionalLight(0xc084fc, 3.8);
    keyRimLeft.position.set(-8, 6.0, -4.0);
    scene.add(keyRimLeft);

    // Behind top-right indigo rim light (crisp blue edge highlight)
    const keyRimRight = new THREE.DirectionalLight(0x818cf8, 3.2);
    keyRimRight.position.set(8, 5.0, -4.0);
    scene.add(keyRimRight);

    // Gentle back rim light (softly rims crest silhouette)
    const backRimLight = new THREE.DirectionalLight(0xa855f7, 2.4);
    backRimLight.position.set(0, 8.0, -6.0);
    scene.add(backRimLight);

    // Soft underside fill (gentle deep purple illumination)
    const bottomFill = new THREE.PointLight(0x3b0764, 1.5, 20);
    bottomFill.position.set(0, -5.5, 3.0);
    scene.add(bottomFill);

    // 3. Custom Sculptural Arch & Silk Ribbon Geometry
    function createSculpturalWaveGeometry(
      width: number,
      depth: number,
      uSegments: number,
      vSegments: number,
      layerOffset: number = 0
    ) {
      const geo = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let j = 0; j <= vSegments; j++) {
        const v = j / vSegments; // 0 (front edge) to 1 (back edge)
        for (let i = 0; i <= uSegments; i++) {
          const u = i / uSegments; // 0 (left) to 1 (right)
          const s = (u - 0.5) * 2; // -1 to +1 normalized horizontal

          // Width span across screen
          const x = s * (width * 0.5);

          // Wide flowing arch: peaks in center, sweeps down gracefully at sides
          const archShape = 2.45 * (1.0 - Math.pow(Math.abs(s), 2.15) * 0.68);

          // Smooth harmonic undulating wave (no random bumps or noise)
          const harmonicWave =
            Math.cos(s * Math.PI * 1.25) * 0.38 +
            Math.sin(s * Math.PI * 0.7) * 0.22;

          // Depth rollout: curves gently forward in center and rolls backward
          const zDepth = (v - 0.5) * depth - (1.0 - s * s * 0.4) * 1.5;

          // Smooth crest rollover: drops off smoothly into the bottom viewport
          const crestRoll = Math.sin(v * Math.PI * 0.8) * 0.65 - Math.pow(v, 2.1) * 2.1;

          // Secondary layer variation
          const layerShift = layerOffset !== 0 ? Math.sin(s * 2.5) * 0.25 + layerOffset : 0;

          const y = archShape + harmonicWave + crestRoll + layerShift;

          positions.push(x, y, zDepth);
          uvs.push(u, v);
        }
      }

      const rowSize = uSegments + 1;
      for (let j = 0; j < vSegments; j++) {
        for (let i = 0; i < uSegments; i++) {
          const a = j * rowSize + i;
          const b = (j + 1) * rowSize + i;
          const c = (j + 1) * rowSize + (i + 1);
          const d = j * rowSize + (i + 1);

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      return register(geo);
    }

    // Custom uniforms for gentle living movement
    const customUniforms = {
      uTime: { value: 0 },
    };

    // Material with custom Fresnel edge glow (dark center, illuminated lavender/blue edges)
    const createSculpturalMaterial = (baseColor: number, roughness: number) => {
      const mat = register(
        new THREE.MeshPhysicalMaterial({
          color: baseColor,
          emissive: 0x05020a,
          emissiveIntensity: 0.25,
          roughness: roughness, // Satin sheen
          metalness: 0.08, // Subtle reflections, avoid excessive metallic shine
          clearcoat: 0.45,
          clearcoatRoughness: 0.35,
          side: THREE.DoubleSide,
        })
      );

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = customUniforms.uTime;

        // Subtle gentle vertex undulation
        shader.vertexShader = `
          uniform float uTime;
          varying vec3 vWorldNormal;
          varying vec3 vViewPos;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          // Gentle smooth breathing wave
          float gentleWave = sin(position.x * 0.38 + uTime * 0.35) * cos(position.z * 0.42 + uTime * 0.28) * 0.08;
          transformed.y += gentleWave;
          `
        );

        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `
          #include <worldpos_vertex>
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vViewPos = - (modelViewMatrix * vec4(transformed, 1.0)).xyz;
          `
        );

        // Inject Fresnel edge glow into fragment shader
        shader.fragmentShader = `
          varying vec3 vWorldNormal;
          varying vec3 vViewPos;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          #include <dithering_fragment>
          // Elegant Fresnel glow on curved edges and silhouettes (dark center, illuminated purple curves)
          vec3 viewD = normalize(vViewPos);
          vec3 normD = normalize(vWorldNormal);
          float fresnel = pow(1.0 - abs(dot(viewD, normD)), 3.2);

          // Soft lavender-purple & subtle blue edge rim gradient
          vec3 lavender = vec3(0.72, 0.48, 0.96); // Soft lavender-purple
          vec3 softBlue = vec3(0.42, 0.58, 0.94); // Subtle blue highlight
          vec3 edgeGlow = mix(lavender, softBlue, clamp((normD.x + 1.0) * 0.5, 0.0, 1.0));

          gl_FragColor.rgb += edgeGlow * (fresnel * 1.35);
          `
        );
      };

      return mat;
    };

    // Main 3D Group
    const modelGroup = new THREE.Group();

    // 1. Primary Sculptural Arch (Wide, smooth, rising behind hero and extending beyond bottom)
    const primaryGeo = createSculpturalWaveGeometry(16.8, 5.8, 180, 120, 0);
    const primaryMat = createSculpturalMaterial(0x07040f, 0.52); // Deep obsidian indigo
    const primaryMesh = new THREE.Mesh(primaryGeo, primaryMat);
    primaryMesh.position.set(0, -5.05, 0.8);
    modelGroup.add(primaryMesh);

    // 2. Secondary Flowing Ribbon Layer (Layered behind for sophisticated depth)
    const secondaryGeo = createSculpturalWaveGeometry(15.2, 4.8, 150, 100, 0.35);
    const secondaryMat = createSculpturalMaterial(0x06030c, 0.56);
    const secondaryMesh = new THREE.Mesh(secondaryGeo, secondaryMat);
    secondaryMesh.position.set(0.3, -4.75, -0.6);
    secondaryMesh.rotation.y = 0.04;
    secondaryMesh.rotation.z = -0.015;
    modelGroup.add(secondaryMesh);

    scene.add(modelGroup);

    // 4. Subtle Ambient Cosmic Dust / Starfield
    const starCount = 280;
    const starGeo = register(new THREE.BufferGeometry());
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 26;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = register(
      new THREE.PointsMaterial({
        size: 0.035,
        color: 0xddd6fe,
        transparent: true,
        opacity: 0.5,
      })
    );
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 5. Mouse Interaction Tracking
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = normX;
      mouse.targetY = normY;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 6. Smooth Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTime) * 0.001;
      customUniforms.uTime.value = elapsed;

      // Mouse tracking with smooth inertia
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.035;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.035;

      // Subtle, elegant floating movement
      modelGroup.position.y = Math.sin(elapsed * 0.35) * 0.05;
      modelGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.02 + mouse.currentX * 0.12;
      modelGroup.rotation.x = mouse.currentY * 0.08;

      // Subtle camera parallax
      camera.position.x = mouse.currentX * 0.45;
      camera.position.y = mouse.currentY * 0.25;
      camera.lookAt(0, -0.3, 0);

      // Gentle starfield drift
      starMesh.rotation.y = elapsed * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

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
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0"
    />
  );
}
