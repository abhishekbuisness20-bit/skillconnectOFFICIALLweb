import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { isSearchCrawler } from '../utils/seoRouting';

interface SkillConnect3DLogoProps {
  className?: string;
  compact?: boolean;
}

function createInterlockingArcGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, -0.78);
  shape.bezierCurveTo(-0.98, -0.56, -1.06, 0.14, -0.52, 0.36);
  shape.bezierCurveTo(-0.18, 0.48, 0.08, 0.34, 0.22, 0.18);
  shape.bezierCurveTo(-0.08, 0.06, -0.34, -0.14, -0.26, -0.36);
  shape.bezierCurveTo(-0.18, -0.54, 0.14, -0.54, 0.46, -0.44);
  shape.bezierCurveTo(0.24, -0.78, -0.16, -0.96, -0.55, -0.78);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 5,
    curveSegments: 28,
  });
  geo.center();
  return geo;
}

function createSplitRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0.0, '#00D2FF');
    grad.addColorStop(0.45, '#0EA5E9');
    grad.addColorStop(0.55, '#84CC16');
    grad.addColorStop(1.0, '#00D2FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function SkillConnect3DLogo({ className = '', compact = false }: SkillConnect3DLogoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isSearchCrawler()) return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (useStaticFallback) return;
    const container = mountRef.current;
    if (!container) return;

    let isSoftwareGl = false;
    let hasWebGL = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (gl) {
        hasWebGL = true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch {
      hasWebGL = false;
    }

    if (!hasWebGL) {
      setUseStaticFallback(true);
      return;
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.1, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x050814, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x84cc16, 1.4);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const emblemGroup = new THREE.Group();
    scene.add(emblemGroup);

    // 1. Outer orbital ring with cyan-to-lime gradient texture
    const ringTexture = createSplitRingTexture();
    ringTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const ringGeo = new THREE.TorusGeometry(1.75, 0.075, 24, 96);
    const ringMat = new THREE.MeshPhysicalMaterial({
      map: ringTexture,
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color('#0ea5e9'),
      emissiveIntensity: 0.22,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    emblemGroup.add(ringMesh);

    // 2. Left Cyan Person Figure (Head + Interlocking Arc)
    const cyanMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#00C8FF'),
      metalness: 0.65,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.18,
    });

    const headGeo = new THREE.SphereGeometry(0.28, 32, 32);
    const leftHead = new THREE.Mesh(headGeo, cyanMat);
    leftHead.position.set(-0.56, 0.66, 0.05);
    emblemGroup.add(leftHead);

    const arcGeo = createInterlockingArcGeometry();
    const leftBody = new THREE.Mesh(arcGeo, cyanMat);
    leftBody.position.set(-0.32, -0.24, 0.04);
    leftBody.scale.set(1.02, 1.02, 1);
    emblemGroup.add(leftBody);

    // 3. Right Lime-Green Person Figure (Head + Mirrored Interlocking Arc)
    const limeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#84CC16'),
      metalness: 0.65,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      emissive: new THREE.Color('#65a30d'),
      emissiveIntensity: 0.18,
    });

    const rightHead = new THREE.Mesh(headGeo, limeMat);
    rightHead.position.set(0.56, 0.56, -0.04);
    emblemGroup.add(rightHead);

    const rightBody = new THREE.Mesh(arcGeo, limeMat);
    rightBody.position.set(0.32, -0.24, -0.04);
    rightBody.rotation.z = Math.PI;
    rightBody.scale.set(1.02, 1.02, 1);
    emblemGroup.add(rightBody);

    // 4. Subtle inner titanium orbital accent ring
    const innerRingGeo = new THREE.TorusGeometry(1.98, 0.018, 12, 80);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38bdf8'),
      metalness: 0.9,
      roughness: 0.25,
      transparent: true,
      opacity: 0.45,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI * 0.14;
    emblemGroup.add(innerRing);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += delta;

      const targetRotY = pointerRef.current.active
        ? pointerRef.current.x * 0.45
        : Math.sin(elapsed * 0.7) * 0.24;
      const targetRotX = pointerRef.current.active
        ? -pointerRef.current.y * 0.3
        : Math.cos(elapsed * 0.55) * 0.12;

      emblemGroup.rotation.y = THREE.MathUtils.damp(emblemGroup.rotation.y, targetRotY, 4.2, delta);
      emblemGroup.rotation.x = THREE.MathUtils.damp(emblemGroup.rotation.x, targetRotX, 4.2, delta);
      emblemGroup.position.y = Math.sin(elapsed * 1.4) * 0.07;
      innerRing.rotation.z = elapsed * 0.35;

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      ringGeo.dispose();
      ringMat.dispose();
      ringTexture.dispose();
      headGeo.dispose();
      arcGeo.dispose();
      cyanMat.dispose();
      limeMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [useStaticFallback]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      active: true,
    };
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
  };

  if (useStaticFallback) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full bg-[#070B1E] border border-cyan-500/20 ${
          compact ? 'p-1.5' : 'p-6'
        } ${className}`}
      >
        <img
          src="/favicon.png"
          alt="SkillConnect Official Brand Emblem"
          referrerPolicy="no-referrer"
          className={`${
            compact ? 'w-20 h-20' : 'w-56 h-56 sm:w-64 sm:h-64'
          } rounded-full object-cover`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="Interactive 3D SkillConnect Official Brand Emblem"
      role="img"
    >
      <div
        className="absolute inset-4 rounded-full bg-radial from-cyan-500/15 via-lime-500/5 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        ref={mountRef}
        className={`${
          compact ? 'w-24 h-24' : 'w-72 h-72 sm:w-88 sm:h-88'
        } cursor-grab active:cursor-grabbing`}
      />
    </div>
  );
}
