'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function HeroCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Atmosphere (matches deep purple-obsidian from reference image)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08060f, 0.042);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 9.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Track disposables for clean cleanup
    const disposables: { dispose: () => void }[] = [];
    const register = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // 2. Lighting Setup (Soft purple/violet key light, deep indigo rim light)
    const ambientLight = new THREE.AmbientLight(0x181028, 1.6);
    scene.add(ambientLight);

    // Top-left purple key light
    const keyLight = new THREE.DirectionalLight(0xc084fc, 3.0);
    keyLight.position.set(-5, 6, 4.5);
    scene.add(keyLight);

    // Top-right indigo rim light
    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.2);
    rimLight.position.set(6, 4.5, -2);
    scene.add(rimLight);

    // Front-bottom fill light
    const fillLight = new THREE.PointLight(0xa855f7, 2.0, 15);
    fillLight.position.set(0, -3.5, 3.5);
    scene.add(fillLight);

    // 3. Central Organic 3D Liquid Undulating Blob (as shown in reference image)
    const sphereGeo = register(new THREE.SphereGeometry(3.6, 128, 128));

    // Custom uniforms for GPU simplex noise displacement
    const customUniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.48 },
      uNoiseSpeed: { value: 0.35 },
      uDisplacement: { value: 0.85 },
    };

    const blobMat = register(
      new THREE.MeshPhysicalMaterial({
        color: 0x160e26,
        emissive: 0x120822,
        emissiveIntensity: 0.3,
        roughness: 0.48, // Velvety satin matte finish
        metalness: 0.12,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
      })
    );

    // Hook custom 3D Simplex noise directly into the vertex shader
    blobMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.uNoiseFreq = customUniforms.uNoiseFreq;
      shader.uniforms.uNoiseSpeed = customUniforms.uNoiseSpeed;
      shader.uniforms.uDisplacement = customUniforms.uDisplacement;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uNoiseFreq;
        uniform float uNoiseSpeed;
        uniform float uDisplacement;

        // 3D Simplex noise
        vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0);
          vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        float getDisplacement(vec3 p) {
          float t = uTime * uNoiseSpeed;
          float n1 = snoise(p * uNoiseFreq + vec3(0.0, t * 0.8, t * 0.6)) * 0.65;
          float n2 = snoise(p * (uNoiseFreq * 2.1) - vec3(t * 0.7, 0.0, t * 0.5)) * 0.35;
          return (n1 + n2) * uDisplacement;
        }
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        float disp = getDisplacement(position);
        transformed += normal * disp;

        // Recalculate normal using tangent offsets for smooth lighting
        float eps = 0.02;
        vec3 v1 = position + vec3(eps, 0.0, 0.0);
        vec3 v2 = position + vec3(0.0, eps, 0.0);
        vec3 p1 = v1 + normal * getDisplacement(v1);
        vec3 p2 = v2 + normal * getDisplacement(v2);
        vec3 newNormal = normalize(cross(p1 - transformed, p2 - transformed));
        if (dot(newNormal, normal) > 0.0) {
          transformedNormal = normalMatrix * newNormal;
        }
        `
      );
    };

    const blobMesh = new THREE.Mesh(sphereGeo, blobMat);
    // Position blob so upper organic crest rises from bottom center
    blobMesh.position.set(0, -2.6, 0.4);
    scene.add(blobMesh);

    // 4. Subtle Cosmos Starfield / Dust Specks (scattered like in the image)
    const starCount = 220;
    const starGeo = register(new THREE.BufferGeometry());
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 22;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 1.5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = register(
      new THREE.PointsMaterial({
        size: 0.035,
        color: 0xddd6fe,
        transparent: true,
        opacity: 0.55,
      })
    );
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 5. Mouse Parallax Tracking
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

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      customUniforms.uTime.value = elapsed;

      // Smooth mouse tracking with inertia
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.04;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.04;

      // Subtle camera parallax
      camera.position.x = mouse.currentX * 0.5;
      camera.position.y = 0.4 + mouse.currentY * 0.35;
      camera.lookAt(0, -0.4, 0);

      // Slow organic rotation of the blob
      blobMesh.rotation.y = elapsed * 0.06 + mouse.currentX * 0.2;
      blobMesh.rotation.x = mouse.currentY * 0.15;

      // Gentle twinkle in starfield
      starMesh.rotation.y = elapsed * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden -z-10"
    />
  );
}
