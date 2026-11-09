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

    const camera = new THREE.PerspectiveCamera(42, getWidth() / getHeight(), 0.1, 100);
    camera.position.set(0, 0.1, 9.2);
    camera.lookAt(0, -0.4, 0);

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

    // 2. Consistent Fixed Lighting Setup
    // Fixed ambient base
    const ambientLight = new THREE.AmbientLight(0x1a0f2e, 1.8);
    scene.add(ambientLight);

    // Target for all directional lights (fixed at center of the 3D model)
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, -3.8, 0.4);
    scene.add(lightTarget);

    // Fixed Top-left purple key light (consistent main light source from top-left)
    const keyLight = new THREE.DirectionalLight(0xc084fc, 4.0);
    keyLight.position.set(-6, 6.5, 4.5);
    keyLight.target = lightTarget;
    scene.add(keyLight);

    // Fixed Top-right indigo rim light (crisp silhouette)
    const rimLightRight = new THREE.DirectionalLight(0x818cf8, 3.4);
    rimLightRight.position.set(6.5, 4.5, -2.5);
    rimLightRight.target = lightTarget;
    scene.add(rimLightRight);

    // Fixed Left purple rim light
    const rimLightLeft = new THREE.DirectionalLight(0xa855f7, 2.8);
    rimLightLeft.position.set(-6.5, 3.5, -2.5);
    rimLightLeft.target = lightTarget;
    scene.add(rimLightLeft);

    // Fixed Front-bottom fill light (gentle ambient curve illumination)
    const fillLight = new THREE.PointLight(0x7c3aed, 2.2, 20);
    fillLight.position.set(0, -4.0, 4.5);
    scene.add(fillLight);

    // 3. Central 3D Organic Liquid Model (Three.js)
    const sphereGeo = register(new THREE.SphereGeometry(3.9, 160, 160));

    const customUniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.38 },
      uNoiseSpeed: { value: 0.26 },
      uDisplacement: { value: 0.58 },
    };

    const blobMat = register(
      new THREE.MeshPhysicalMaterial({
        color: 0x241242, // Rich dark satin violet
        emissive: 0x140826, // Subtle internal purple glow
        emissiveIntensity: 0.45,
        roughness: 0.56, // Satin / velvet matte finish
        metalness: 0.10,
        clearcoat: 0.25, // Gentle sheen
        clearcoatRoughness: 0.35,
      })
    );

    // Custom Simplex noise displacement shader hook
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
          float n1 = snoise(p * uNoiseFreq + vec3(0.0, t * 0.7, t * 0.5)) * 0.65;
          float n2 = snoise(p * (uNoiseFreq * 2.2) - vec3(t * 0.6, 0.0, t * 0.4)) * 0.35;
          return (n1 + n2) * uDisplacement;
        }
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <defaultnormal_vertex>',
        `
        // Compute displacement & analytical normals with orthogonal tangent basis
        vec3 tNormal = normal;
        vec3 tangent = normalize(abs(tNormal.y) < 0.999 ? cross(tNormal, vec3(0.0, 1.0, 0.0)) : cross(tNormal, vec3(1.0, 0.0, 0.0)));
        vec3 bitangent = cross(tNormal, tangent);
        float eps = 0.02;

        vec3 p0 = position + tNormal * getDisplacement(position);
        vec3 p1 = position + tangent * eps + tNormal * getDisplacement(position + tangent * eps);
        vec3 p2 = position + bitangent * eps + tNormal * getDisplacement(position + bitangent * eps);

        vec3 computedNormal = normalize(cross(p1 - p0, p2 - p0));
        vec3 objectNormal = computedNormal;

        // Transform normal into view space using normalMatrix for consistent world lighting
        vec3 transformedNormal = normalMatrix * computedNormal;
        #ifdef USE_TANGENT
          vec3 transformedTangent = (modelViewMatrix * vec4(tangent, 0.0)).xyz;
        #endif
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = p0;
        `
      );
    };

    const blobMesh = new THREE.Mesh(sphereGeo, blobMat);
    // Position blob so upper organic crest rises from bottom center, peaking just below CTA
    blobMesh.position.set(0, -4.1, 0.4);
    blobMesh.scale.set(1.4, 1.05, 1.25);
    scene.add(blobMesh);

    // 4. Subtle Ambient Cosmic Dust / Starfield (Strictly in deep background behind 3D model)
    const starCount = 280;
    const starGeo = register(new THREE.BufferGeometry());
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      // Model center is at z = 0.4 with radius ~4.5 (reaches z ~ -4.2 at back).
      // Placing stars strictly between z = -6.5 and z = -18.0 guarantees they are ALWAYS behind the model.
      starPositions[i * 3 + 2] = -6.5 - Math.random() * 12.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = register(
      new THREE.PointsMaterial({
        size: 0.045,
        color: 0xddd6fe,
        transparent: true,
        opacity: 0.65,
        depthTest: true,
        depthWrite: false,
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
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 (left) to +1 (right)
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 (top/up) to +1 (bottom/down)
      mouse.targetX = normX;
      mouse.targetY = normY;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 6. Continuous Dynamic Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();
    let lastTime = performance.now();
    let currentRotY = 0;
    let currentRotX = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      const elapsed = (now - startTime) * 0.001;
      customUniforms.uTime.value = elapsed;

      // Mouse tracking with smooth inertia
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.06;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.06;

      // Keep camera stable
      camera.position.set(0, 0.1, 9.2);
      camera.lookAt(0, -0.4, 0);

      // Continuous angular velocity based on pointer position (keeps moving in direction):
      // Pointer is in RIGHT (currentX > 0) -> continuously rotates LEFT (negative angular velocity)
      // Pointer is in LEFT  (currentX < 0) -> continuously rotates RIGHT (positive angular velocity)
      const angularSpeedY = 0.06 - mouse.currentX * 0.9;

      // Pointer is DOWN (currentY > 0) -> continuously rotates UP (negative angular velocity)
      // Pointer is UP   (currentY < 0) -> continuously rotates DOWN (positive angular velocity)
      const angularSpeedX = -mouse.currentY * 0.75;

      currentRotY += angularSpeedY * delta;
      currentRotX += angularSpeedX * delta;

      blobMesh.rotation.y = currentRotY;
      blobMesh.rotation.x = currentRotX;

      // Rotate starfield in 2D plane (Z-axis) so depth never shifts forward
      starMesh.rotation.z = elapsed * 0.005;

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
