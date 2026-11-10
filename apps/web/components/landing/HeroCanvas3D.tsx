'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Ball {
  id: number;
  radius: number;
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  meshGroup: THREE.Group;
  sphere: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  role: 'pastel' | 'light' | 'medium' | 'deep' | 'glass';
  isGlass: boolean;
  visualScale: number;
  color: THREE.Color;
  restPosition: THREE.Vector3;
  shapeTarget: THREE.Vector3;
  angleY: number;
  angleZ: number;
}

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

    // Performance & Motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isVisible = true;

    // Dimensions
    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || window.innerHeight;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, getWidth() / getHeight(), 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    container.appendChild(renderer.domElement);

    // Fade in renderer
    requestAnimationFrame(() => {
      if (renderer.domElement) {
        renderer.domElement.style.opacity = '1';
      }
    });

    // 2. Palette & Dynamic Color Mapping (CloudIDE Luxury Violet & Obsidian Theme)
    const getDynamicColors = () => {
      return {
        pastel: new THREE.Color('#f5f0ff'), // Pearlescent Lilac-White
        light: new THREE.Color('#c084fc'),  // Soft Luminous Lavender
        medium: new THREE.Color('#8b5cf6'), // Electric Violet / Purple
        deep: new THREE.Color('#2e0d54'),   // Deep Obsidian Amethyst Plum
        glass: new THREE.Color('#a855f7'),  // Translucent Electric Violet Crystal Glass
      };
    };

    const palette = getDynamicColors();
    const ROLES = ['pastel', 'light', 'medium', 'deep', 'glass'] as const;
    const curPal: Record<string, THREE.Color> = {};
    ROLES.forEach((r) => {
      curPal[r] = palette[r].clone();
    });

    // 3. Studio Lighting (Tailored for Rich Violet & Obsidian Balloons)
    const hemiLight = new THREE.HemisphereLight(0xffffff, new THREE.Color(palette.medium), 1.6);
    scene.add(hemiLight);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-6, 10, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      near: 0.5,
      far: 30,
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
    });
    key.shadow.bias = -0.0003;
    key.shadow.radius = 8;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xc084fc, 1.4);
    rim.position.set(8, 7, -8);
    scene.add(rim);

    const front = new THREE.DirectionalLight(0xffffff, 0.4);
    front.position.set(0, 0, 11);
    scene.add(front);

    const side = new THREE.DirectionalLight(0x818cf8, 0.45);
    side.position.set(-9, -2, 4);
    scene.add(side);

    // 4. Subtle Ambient Cosmic Starfield in Deep Background
    const createCircleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.35, 'rgba(216,180,254,0.7)');
        grad.addColorStop(1, 'rgba(216,180,254,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return register(new THREE.CanvasTexture(c));
    };

    const starCount = 120;
    const starGeo = register(new THREE.BufferGeometry());
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 32;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      starPositions[i * 3 + 2] = -9.0 - Math.random() * 8.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = register(
      new THREE.PointsMaterial({
        size: 0.13,
        map: createCircleTexture(),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
      })
    );
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 5. Frustum Viewport Bounds Calculation
    let viewportHeight = 6;
    let viewportWidth = 10;
    const updateFrustumBounds = () => {
      const fov = THREE.MathUtils.degToRad(camera.fov);
      viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
      viewportWidth = viewportHeight * (getWidth() / getHeight());
    };
    updateFrustumBounds();

    // 6. Spheres Initialization
    const mobile = getWidth() < 768;
    const n = mobile ? 54 : 96;
    const sphereGeometry = register(new THREE.SphereGeometry(1, 40, 40));

    let balls: Ball[] = [];
    for (let i = 0; i < n; i++) {
      let radius = 0.33;
      const r = Math.random();
      if (r < 0.3) radius = 0.27 + Math.random() * 0.12;
      else if (r < 0.8) radius = 0.42 + Math.random() * 0.18;
      else radius = 0.66 + Math.random() * 0.21;

      const mass = Math.pow(radius, 3);
      const isGlass = Math.random() < 0.22;
      let role: 'pastel' | 'light' | 'medium' | 'deep' | 'glass' = 'medium';
      let mat: THREE.MeshPhysicalMaterial;
      let color: THREE.Color;

      if (isGlass) {
        mat = register(
          new THREE.MeshPhysicalMaterial({
            color: palette.glass,
            roughness: 0.08,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            transmission: 0.95,
            ior: 1.485,
            thickness: 2.2,
            specularColor: new THREE.Color('#ffffff'),
            specularIntensity: 1,
            attenuationColor: palette.pastel,
            attenuationDistance: 1,
            emissive: palette.glass,
            emissiveIntensity: 0.12,
            transparent: true,
          })
        );
        color = palette.glass;
        role = 'glass';
      } else {
        const cr = Math.random();
        let chosen = palette.medium;
        if (cr < 0.25) {
          chosen = palette.pastel;
          role = 'pastel';
        } else if (cr < 0.55) {
          chosen = palette.light;
          role = 'light';
        } else if (cr < 0.85) {
          chosen = palette.medium;
          role = 'medium';
        } else {
          chosen = palette.deep;
          role = 'deep';
        }

        mat = register(
          new THREE.MeshPhysicalMaterial({
            color: chosen,
            roughness: 0.44,
            metalness: 0,
            clearcoat: 0.24,
            clearcoatRoughness: 0.35,
            emissive: chosen,
            emissiveIntensity: 0.08,
            transparent: true,
          })
        );
        color = chosen;
      }

      const group = new THREE.Group();
      const mesh = new THREE.Mesh(sphereGeometry, mat);
      mesh.scale.setScalar(radius);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      scene.add(group);

      balls.push({
        id: i,
        radius,
        mass,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        meshGroup: group,
        sphere: mesh,
        material: mat,
        role,
        isGlass,
        visualScale: radius,
        color,
        restPosition: new THREE.Vector3(),
        shapeTarget: new THREE.Vector3(),
        angleY: Math.random() * Math.PI * 2,
        angleZ: 0.1 + Math.random() * 0.45,
      });
    }

    const meanRadius = balls.reduce((s, b) => s + b.radius, 0) / balls.length;

    // Heart Target Formation (Form Stage when scrolled)
    const inHeart = (x: number, y: number) => {
      const a = x * x + y * y - 1;
      return a * a * a - x * x * y * y * y <= 0;
    };

    let shapeScale = 1;
    const assignHeartTargets = () => {
      if (!balls.length) return;
      const S = Math.min(viewportWidth * 0.3, viewportHeight * 0.27);
      const baseCY = -viewportHeight * 0.03;
      shapeScale = Math.max(0.3, Math.min(1, (S * 0.45) / 2.3 / meanRadius));
      for (let i = 0; i < balls.length; i++) {
        let x = 0;
        let y = 0;
        let tries = 0;
        do {
          x = (Math.random() * 2 - 1) * 1.25;
          y = Math.random() * 2.55 - 1.4;
          tries++;
        } while (!inHeart(x, y) && tries < 60);
        balls[i].shapeTarget.set(x * S, (y + 0.12) * S + baseCY, (Math.random() - 0.5) * 0.35);
      }
    };
    assignHeartTargets();

    // Scatter Entrance Mechanism
    const scatterFar = (inward: boolean) => {
      const R = Math.max(viewportWidth, viewportHeight) * 1.5;
      for (const b of balls) {
        const a = Math.random() * Math.PI * 2;
        const px = Math.cos(a) * R * 1.25;
        const py = Math.sin(a) * R * 0.85;
        const pz = (Math.random() - 0.5) * 4;
        b.position.set(px, py, pz);
        b.meshGroup.position.copy(b.position);
        if (inward) {
          b.velocity
            .set(-px, -py, -pz)
            .normalize()
            .multiplyScalar(0.09 + Math.random() * 0.05);
        } else {
          b.velocity.set(0, 0, 0);
        }
      }
    };

    // 7. Physics & Gravity Simulation Parameters
    const params = {
      gravity: 0,
      rebound: -0.3,
      mouseRepelForce: 0.05,
      mouseRepelRadius: 4.4,
      damping: 0.91,
      centerAttractForce: 0.0035,
      bounciness: 0.02,
    };

    // Math utility helpers
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const smoothstep = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // Dynamic Cluster Center (Floating gracefully in the center of the viewport)
    const clusterCenter = new THREE.Vector3(0, 0.35, 0);

    // 8. Mouse & Pointer Tracking
    const mousePos = { x: 99, y: 99, isDown: false };
    const prevMouseWorld = new THREE.Vector3();
    const mouseProjVec = new THREE.Vector3();
    const mouseWorld3D = new THREE.Vector3();
    const diffVec = new THREE.Vector3();
    const collideDiff = new THREE.Vector3();
    const relVel = new THREE.Vector3();
    const deltaPos = new THREE.Vector3();
    const rotAxis = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onPointerDown = () => {
      mousePos.isDown = true;
    };
    const onPointerUp = () => {
      mousePos.isDown = false;
    };
    const onWindowBlur = () => {
      mousePos.isDown = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('blur', onWindowBlur);

    const updateMouse3D = () => {
      mouseProjVec.set(mousePos.x, mousePos.y, 0.5);
      mouseProjVec.unproject(camera);
      const dir = mouseProjVec.sub(camera.position).normalize();
      const distance = (clusterCenter.z - camera.position.z) / dir.z;
      mouseWorld3D.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    // 9. Visibility & Intersection Management
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

    // Initial scatter inward
    scatterFar(true);
    const startTime = performance.now() * 0.001;
    const entranceStart = startTime;

    // 10. Physics Simulation & Render Loop
    let animationFrameId: number;

    const simulateAndRender = () => {
      animationFrameId = requestAnimationFrame(simulateAndRender);
      if (!isVisible) return;

      const now = performance.now() * 0.001;
      const time = now - startTime;
      updateMouse3D();

      // Scroll Progress for Physics Morphing (Hero cluster -> Gravity drop -> Heart form -> Fly)
      const scrollY = window.scrollY || 0;
      const vh = window.innerHeight || 1;
      const progress = scrollY / vh;

      const heroF = 1 - smoothstep(0.2, 0.65, progress);
      const dropRaw = smoothstep(0.3, 0.75, progress);
      const flyF = smoothstep(1.35, 1.8, progress);
      const shapeF = smoothstep(0.7, 1.1, progress) * (1 - smoothstep(1.4, 1.8, progress));
      const dropF = dropRaw * (1 - smoothstep(0.75, 1.05, progress));

      const entranceT = easeOutCubic(clamp01((time - entranceStart) / 2.2));
      const attractionBoost = lerp(7.5, 1, entranceT);
      const interacting = Math.abs(mousePos.x) < 0.99 || Math.abs(mousePos.y) < 0.99;

      let mouseSpeed = interacting ? mouseWorld3D.distanceTo(prevMouseWorld) : 0;
      if (mouseSpeed > 3) mouseSpeed = 3;
      prevMouseWorld.copy(mouseWorld3D);

      let damping = 0.91;
      damping = lerp(damping, 0.992, dropF);
      damping = lerp(damping, 0.9, shapeF);
      damping = lerp(damping, 0.985, flyF);

      const clusterActive = Math.max(heroF, entranceT < 1 ? 1 : 0);

      // --- Per-ball forces ---
      for (const b of balls) {
        // Subtle organic float wave
        if (heroF > 0.01 && !prefersReducedMotion) {
          b.velocity.x += Math.sin(time * 0.4 + b.id * 1.5) * 0.0004 * b.radius * heroF;
          b.velocity.y += Math.cos(time * 0.5 + b.id * 1.2) * 0.0004 * b.radius * heroF;
          b.velocity.z += Math.sin(time * 0.35 + b.id) * 0.0001 * heroF;
        }

        // Center Gravity Field
        const cluster = params.centerAttractForce * attractionBoost * clusterActive;
        if (cluster > 0.00001) {
          b.velocity.x += (clusterCenter.x - b.position.x) * cluster * 0.38;
          b.velocity.y += (clusterCenter.y - b.position.y) * cluster * 1.85;
          b.velocity.z += (clusterCenter.z - b.position.z) * cluster * 1.8;
        }

        // Soft floor cushion in hero stage to keep bottom text area unobstructed
        if (heroF > 0.15 && b.position.y < -1.85) {
          b.velocity.y += (-1.85 - b.position.y) * 0.1 * heroF;
        }

        // Gravity Drop Stage
        if (dropF > 0.001) {
          b.velocity.y -= 0.011 * dropF;
        }

        // Heart Shape Stage
        if (shapeF > 0.001) {
          const k = 0.06 * shapeF;
          b.velocity.x += (b.shapeTarget.x - b.position.x) * k;
          b.velocity.y += (b.shapeTarget.y - b.position.y) * k;
          b.velocity.z += (b.shapeTarget.z - b.position.z) * k;
        }

        // Fly Through Stage
        if (flyF > 0.001) {
          const stagger = (b.id * 0.6180339887) % 1;
          const local = smoothstep(stagger * 0.55, stagger * 0.55 + 0.45, flyF);
          b.velocity.z += 0.05 * local;
          b.velocity.x += b.position.x * 0.006 * local;
          b.velocity.y += b.position.y * 0.006 * local;
        }

        // Interactive Cursor Repulsion
        if (interacting) {
          diffVec.subVectors(b.position, mouseWorld3D);
          const dist = diffVec.length();
          const down = mousePos.isDown;
          const rad = down ? params.mouseRepelRadius * 1.4 : params.mouseRepelRadius;
          const force = down ? params.mouseRepelForce * 1.7 : params.mouseRepelForce;
          if (dist < rad && dist > 0.0001) {
            const ratio = dist / rad;
            const sf = 1 - ratio * ratio * (3 - 2 * ratio);
            const push = sf * force * (1 + mouseSpeed * 3.2);
            diffVec.normalize();
            diffVec.z *= 0.12;
            diffVec.normalize();
            b.velocity.addScaledVector(diffVec, push);
          }
        }

        b.velocity.multiplyScalar(damping);
        b.position.addScaledVector(b.velocity, 1);

        b.material.opacity =
          flyF > 0.001
            ? 1 - smoothstep(camera.position.z - 2.6, camera.position.z - 0.3, b.position.z)
            : 1;

        const target = b.radius * (1 - (1 - shapeScale) * shapeF);
        b.visualScale += (target - b.visualScale) * 0.12;
        b.sphere.scale.setScalar(b.visualScale);
      }

      // --- 4 Sub-steps Verlet Collision Resolution ---
      const collideScale = 0.28 * (1 - 0.93 * shapeF) * (1 - flyF);
      for (let step = 0; step < 4; step++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i];
            const b = balls[j];
            collideDiff.subVectors(b.position, a.position);
            const dist = collideDiff.length();
            const min = a.visualScale + b.visualScale;
            if (dist < min && dist > 0.001) {
              const overlap = min - dist;
              collideDiff.multiplyScalar(1 / dist);
              const total = a.mass + b.mass;
              const r1 = b.mass / total;
              const r2 = a.mass / total;
              a.position.addScaledVector(collideDiff, -overlap * r1 * collideScale);
              b.position.addScaledVector(collideDiff, overlap * r2 * collideScale);
              relVel.subVectors(b.velocity, a.velocity);
              const along = relVel.dot(collideDiff);
              if (along < -0.0001) {
                const impulse = (-(1 + params.bounciness) * along) / (1 / a.mass + 1 / b.mass);
                a.velocity.addScaledVector(collideDiff, -impulse / a.mass);
                b.velocity.addScaledVector(collideDiff, impulse / b.mass);
              }
            }
          }
        }
      }

      // --- Viewport Bounds Containment & Physics Rolling ---
      const xBound = viewportWidth / 2 - 0.2;
      const topY = viewportHeight / 2 - 0.05;
      const floorY = -viewportHeight / 2 + 0.05;
      const zBound = 2.5;
      const restitution = 0.3 + 0.35 * dropF;
      const contain = flyF < 0.5;
      const zContain = flyF < 0.02;

      for (const b of balls) {
        const r = b.visualScale;
        if (contain) {
          if (b.position.x < -xBound - r) {
            b.position.x = -xBound - r;
            b.velocity.x *= params.rebound;
          } else if (b.position.x > xBound + r) {
            b.position.x = xBound + r;
            b.velocity.x *= params.rebound;
          }
          if (b.position.y - r < floorY) {
            b.position.y = floorY + r;
            if (b.velocity.y < 0) b.velocity.y = -b.velocity.y * restitution;
            if (dropF > 0.3) {
              b.velocity.x *= 0.86;
              b.velocity.z *= 0.86;
            }
          }
          const effectiveTopY = topY;
          if (b.position.y + r > effectiveTopY) {
            b.position.y = effectiveTopY - r;
            if (b.velocity.y > 0) b.velocity.y *= params.rebound;
          }
        }
        if (zContain) {
          if (b.position.z < -zBound) {
            b.position.z = -zBound;
            b.velocity.z *= params.rebound;
          } else if (b.position.z > zBound) {
            b.position.z = zBound;
            b.velocity.z *= params.rebound;
          }
        }

        // Realistic Rolling Rotation along velocity vector
        deltaPos.copy(b.position).sub(b.meshGroup.position);
        if (deltaPos.lengthSq() > 0.000001) {
          rotAxis.set(deltaPos.y, -deltaPos.x, 0).normalize();
          b.meshGroup.rotateOnWorldAxis(rotAxis, (deltaPos.length() / b.radius) * 0.95);
        }
        b.meshGroup.position.copy(b.position);
      }

      // Starfield gentle background drift
      starMesh.rotation.z = time * 0.004;

      renderer.render(scene, camera);
    };

    simulateAndRender();

    // 11. ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!camera || !renderer || !container) return;
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      updateFrustumBounds();
      assignHeartTargets();
    });
    resizeObserver.observe(container);

    // 12. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', onWindowBlur);
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
