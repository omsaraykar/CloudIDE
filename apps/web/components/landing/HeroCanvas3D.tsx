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

    // Performance & Accessibility checks
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isVisible = true;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, getWidth() / getHeight(), 0.1, 100);
    camera.position.set(0, 0.1, 9.2);
    camera.lookAt(0, -0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.6s ease';
    container.appendChild(renderer.domElement);

    // 2. High-End Studio Environment Map (Single Soft Top-Left Softbox)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const addSoftbox = (
      w: number,
      h: number,
      color: number,
      intensity: number,
      pos: [number, number, number]
    ) => {
      const planeMat = register(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(intensity),
          side: THREE.DoubleSide,
        })
      );
      const m = new THREE.Mesh(register(new THREE.PlaneGeometry(w, h)), planeMat);
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      envScene.add(m);
    };

    // Single soft top-left light strip on black background: reflections only on lit side
    addSoftbox(14, 3.5, 0xc084fc, 6.0, [-8, 7, 4]);

    const envTex = pmrem.fromScene(envScene, 0.04).texture;
    register(envTex);
    pmrem.dispose();

    // 3. Cinematic Directional Lighting (Dominant Top-Left Key Light + Dark Shadows)
    const ambientLight = new THREE.AmbientLight(0x0a0414, 0.08);
    scene.add(ambientLight);

    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, -4.55, 0.4);
    scene.add(lightTarget);

    // Dominant key light from top-left (fixed in world space)
    const keyLight = new THREE.DirectionalLight(0xc084fc, 5.5);
    keyLight.position.set(-7, 7, 4);
    keyLight.target = lightTarget;
    scene.add(keyLight);

    // Faint indigo rim accent on bottom-right silhouette only (< 0.6)
    const rimAccent = new THREE.DirectionalLight(0x6366f1, 0.38);
    rimAccent.position.set(7, -5, -3.5);
    rimAccent.target = lightTarget;
    scene.add(rimAccent);

    // 4. Upgraded Physical Satin & Sheen Material with Iridescence & Deep Shadows
    const sphereGeo = register(new THREE.SphereGeometry(3.9, 128, 128));

    const customUniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.38 },
      uNoiseSpeed: { value: prefersReducedMotion ? 0.03 : 0.18 },
      uDisplacement: { value: 0.40 },
    };

    const blobMat = register(
      new THREE.MeshPhysicalMaterial({
        color: 0x0d0618,
        roughness: 0.38,
        metalness: 0.0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        sheen: 1.0,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color(0x8b5cf6), // velvet edge sheen
        iridescence: 0.25,                     // subtle oil-slick shift
        iridescenceIOR: 1.3,
        iridescenceThicknessMinimum: 200,
        iridescenceThicknessMaximum: 450,
        envMap: envTex,
        envMapIntensity: 0.9,
        emissive: 0x06020e,
        emissiveIntensity: 0.08,
        transparent: false,
        opacity: 1.0,
        depthWrite: true,
      })
    );

    // Custom Simplex noise displacement + Fresnel rim glow and crest tinting via vDisp
    blobMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.uniforms.uNoiseFreq = customUniforms.uNoiseFreq;
      shader.uniforms.uNoiseSpeed = customUniforms.uNoiseSpeed;
      shader.uniforms.uDisplacement = customUniforms.uDisplacement;

      shader.vertexShader = 'varying float vDisp;\n' + shader.vertexShader;

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
        vec3 tNormal = normal;
        vec3 tangent = normalize(abs(tNormal.y) < 0.999 ? cross(tNormal, vec3(0.0, 1.0, 0.0)) : cross(tNormal, vec3(1.0, 0.0, 0.0)));
        vec3 bitangent = cross(tNormal, tangent);
        float eps = 0.02;

        vec3 p0 = position + tNormal * getDisplacement(position);
        vec3 p1 = position + tangent * eps + tNormal * getDisplacement(position + tangent * eps);
        vec3 p2 = position + bitangent * eps + tNormal * getDisplacement(position + bitangent * eps);

        vec3 computedNormal = normalize(cross(p1 - p0, p2 - p0));
        objectNormal = computedNormal;
        vec3 transformedNormal = normalMatrix * computedNormal;
        #ifdef USE_TANGENT
          vec3 transformedTangent = (modelViewMatrix * vec4(tangent, 0.0)).xyz;
        #endif

        vDisp = getDisplacement(position) / max(uDisplacement, 0.001);
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = p0;
        `
      );

      // Fragment: Fresnel rim glow + displacement crest tinting focused on lit side
      shader.fragmentShader = 'varying float vDisp;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        vec3 vDir = normalize(vViewPosition);
        float fres = pow(1.0 - saturate(dot(normal, vDir)), 3.0);
        vec3 rimCol = mix(vec3(0.35, 0.18, 0.9), vec3(0.9, 0.35, 0.85), vDisp * 0.5 + 0.5);
        // Align glow with top-left dominant key light, allowing shadow side to fall into deep darkness
        float litSide = smoothstep(-0.25, 0.45, dot(normal, normalize(vec3(-0.7, 0.7, 0.35))));
        totalEmissiveRadiance += rimCol * fres * 0.85 * litSide;
        totalEmissiveRadiance += vec3(0.22, 0.07, 0.45) * smoothstep(0.1, 0.6, vDisp) * 0.28 * litSide;
        `
      );
    };

    const blobMesh = new THREE.Mesh(sphereGeo, blobMat);
    blobMesh.position.set(0, -4.55, 0.4);
    blobMesh.scale.set(1.4, 1.05, 1.25);
    scene.add(blobMesh);

    // 5. Restrained Starfield with Soft Circular Radial Texture
    const createCircleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.35, 'rgba(221,214,254,0.7)');
        grad.addColorStop(1, 'rgba(221,214,254,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return register(new THREE.CanvasTexture(c));
    };

    const starCount = 120;
    const starGeo = register(new THREE.BufferGeometry());
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      starPositions[i * 3 + 2] = -7.5 - Math.random() * 10.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = register(
      new THREE.PointsMaterial({
        size: 0.14,
        map: createCircleTexture(),
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
      })
    );
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 6. Smooth Damped Mouse Tracking
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 (left) to +1 (right)
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 (top/up) to +1 (bottom/down)
      mouse.targetX = normX;
      mouse.targetY = normY;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 7. Visibility & Intersection Observers
    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting && document.visibilityState === 'visible';
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // 8. Animation Loop with Cinematic Intro & Intentional Motion
    let animationFrameId: number;
    const startTime = performance.now();
    let lastTime = performance.now();

    const damp = (a: number, b: number, k: number, dt: number) =>
      a + (b - a) * (1 - Math.exp(-k * dt));

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      const elapsed = (now - startTime) * 0.001;

      // Cinematic Intro Swell & Fade-in
      const intro = 1 - Math.pow(1 - Math.min(elapsed / 2.4, 1), 3); // easeOutCubic
      customUniforms.uTime.value = elapsed;
      customUniforms.uDisplacement.value = 0.40 * intro;
      blobMesh.position.y = -4.55 - (1 - intro) * 1.4;
      renderer.domElement.style.opacity = String(Math.min(elapsed / 1.2, 1));

      // Frame-rate independent exponential damping
      mouse.currentX = damp(mouse.currentX, mouse.targetX, 3.5, delta);
      mouse.currentY = damp(mouse.currentY, mouse.targetY, 3.5, delta);

      // Intentional, calm tilt per user direction requirements (pointer down tilts up, pointer right tilts left)
      if (!prefersReducedMotion) {
        blobMesh.rotation.y = mouse.currentX * -0.14 + elapsed * 0.02;
        blobMesh.rotation.x = -mouse.currentY * 0.08;
      }

      // Gentle starfield drift
      starMesh.rotation.z = elapsed * 0.004;

      renderer.render(scene, camera);
    };

    animate();

    // 9. ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();

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
      renderer.forceContextLoss();
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
