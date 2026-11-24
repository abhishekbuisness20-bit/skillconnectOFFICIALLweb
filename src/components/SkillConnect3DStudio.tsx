import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { isSearchCrawler } from '../utils/seoRouting';

type CameraPresetId = 'hero' | 'front' | 'top' | 'detail';
type MaterialFinishId = 'anodized' | 'titanium' | 'ceramic';

interface SkillConnect3DStudioProps {
  className?: string;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: 'Studio 3/4', pos: [4.2, 2.75, 5.2], target: [0, 1.35, 0] },
  front: { label: 'Emblem Front', pos: [0, 1.55, 6.2], target: [0, 1.45, 0] },
  top: { label: 'Orbital Plan', pos: [0.01, 6.4, 2.4], target: [0, 1.25, 0] },
  detail: { label: 'Conduit Core', pos: [2.25, 1.75, 2.85], target: [0, 1.45, 0] },
};

const FINISH_LABELS: Record<MaterialFinishId, string> = {
  anodized: 'Anodized',
  titanium: 'Titanium',
  ceramic: 'Ceramic',
};

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

function createGantryPylonGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.14, 0);
  shape.lineTo(0.14, 0);
  shape.lineTo(0.08, 1.42);
  shape.lineTo(-0.06, 1.42);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
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

function createStudioFloorTextures(): {
  albedo: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');
  if (cCtx) {
    cCtx.fillStyle = '#070c1c';
    cCtx.fillRect(0, 0, size, size);

    cCtx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    cCtx.lineWidth = 1;
    const step = 64;
    for (let i = 0; i <= size; i += step) {
      cCtx.beginPath();
      cCtx.moveTo(i, 0);
      cCtx.lineTo(i, size);
      cCtx.stroke();
      cCtx.beginPath();
      cCtx.moveTo(0, i);
      cCtx.lineTo(size, i);
      cCtx.stroke();
    }

    cCtx.strokeStyle = 'rgba(132, 204, 22, 0.08)';
    cCtx.beginPath();
    cCtx.moveTo(0, 0);
    cCtx.lineTo(size, 0);
    cCtx.stroke();
  }

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');
  if (rCtx) {
    rCtx.fillStyle = '#b8b8b8';
    rCtx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const v = 165 + ((x * 13 + y * 31) % 38);
        rCtx.fillStyle = `rgb(${v},${v},${v})`;
        rCtx.fillRect(x, y, 4, 4);
      }
    }
  }

  const albedo = new THREE.CanvasTexture(colorCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(6, 6);

  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(6, 6);

  return { albedo, roughness };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function SkillConnect3DStudio({ className = '' }: SkillConnect3DStudioProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<CameraPresetId>('hero');
  const [finish, setFinish] = useState<MaterialFinishId>('anodized');
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const presetRef = useRef<CameraPresetId>('hero');
  const finishRef = useRef<MaterialFinishId>('anodized');
  const explodedRef = useRef(false);
  const autoRotateRef = useRef(true);
  const presetTriggerRef = useRef(true);

  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isSearchCrawler()) return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    presetRef.current = preset;
    presetTriggerRef.current = true;
  }, [preset]);

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

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

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050814');
    scene.fog = new THREE.FogExp2('#050814', 0.055);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.4;
    controls.maxDistance = 11.5;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.05;

    const handleUserInteract = () => {
      presetTriggerRef.current = false;
    };
    controls.addEventListener('start', handleUserInteract);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // Studio Lighting: Cool Hemisphere + Warm Key with Tight Shadow Frustum + Lime Rim
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x091024, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff2dc, 2.4);
    keyLight.position.set(4.5, 6.8, 5.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isSoftwareGl ? 512 : 1024, isSoftwareGl ? 512 : 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -4.2;
    keyLight.shadow.camera.right = 4.2;
    keyLight.shadow.camera.top = 4.2;
    keyLight.shadow.camera.bottom = -4.2;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x84cc16, 1.35);
    rimLight.position.set(-4.8, 2.2, -3.5);
    scene.add(rimLight);

    // Procedural Ground Disc + Contact Shadow
    const { albedo: floorAlbedo, roughness: floorRoughness } = createStudioFloorTextures();
    floorAlbedo.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorGeo = new THREE.CircleGeometry(14, 72);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorAlbedo,
      roughnessMap: floorRoughness,
      bumpMap: floorRoughness,
      bumpScale: 0.012,
      roughness: 0.82,
      metalness: 0.16,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const contactTex = createContactShadowTexture();
    const contactGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const contactShadow = new THREE.Mesh(contactGeo, contactMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.004;
    scene.add(contactShadow);

    // Root Composite Hero Assembly (Bottom-Center Ground Pivot at y = 0)
    const rootAssembly = new THREE.Group();
    scene.add(rootAssembly);

    // Materials
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.72,
      roughness: 0.34,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#334155'),
      metalness: 0.88,
      roughness: 0.24,
    });
    const ringTex = createSplitRingTexture();
    ringTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const ringMat = new THREE.MeshPhysicalMaterial({
      map: ringTex,
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color('#0ea5e9'),
      emissiveIntensity: 0.2,
    });
    const cyanMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#00C8FF'),
      metalness: 0.65,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.16,
    });
    const limeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#84CC16'),
      metalness: 0.65,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
      emissive: new THREE.Color('#65a30d'),
      emissiveIntensity: 0.16,
    });
    const conduitMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'),
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.85,
      emissive: new THREE.Color('#0ea5e9'),
      emissiveIntensity: 0.28,
    });
    const reticleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#94a3b8'),
      metalness: 0.9,
      roughness: 0.22,
    });

    // Part 1 & 2: Grounded Pedestal + Chamfer Trim Collar
    const pedestalGeo = new THREE.CylinderGeometry(1.48, 1.72, 0.22, 8);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = 0.11;
    pedestalMesh.castShadow = true;
    pedestalMesh.receiveShadow = true;
    rootAssembly.add(pedestalMesh);

    const baseTrimGeo = new THREE.TorusGeometry(1.52, 0.042, 16, 48);
    const baseTrimMesh = new THREE.Mesh(baseTrimGeo, collarMat);
    baseTrimMesh.rotation.x = Math.PI / 2;
    baseTrimMesh.position.y = 0.22;
    baseTrimMesh.castShadow = true;
    rootAssembly.add(baseTrimMesh);

    // Part 3 & 4: Dual Structural Gantry Pylons
    const pylonGeo = createGantryPylonGeometry();
    const leftPylon = new THREE.Mesh(pylonGeo, collarMat);
    leftPylon.position.set(-1.32, 0.9, 0);
    leftPylon.rotation.z = -0.14;
    leftPylon.castShadow = true;
    rootAssembly.add(leftPylon);

    const rightPylon = new THREE.Mesh(pylonGeo, collarMat);
    rightPylon.position.set(1.32, 0.9, 0);
    rightPylon.rotation.z = 0.14;
    rightPylon.rotation.y = Math.PI;
    rightPylon.castShadow = true;
    rootAssembly.add(rightPylon);

    // Core Emblem Sub-Group centered at y = 1.68
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 1.68, 0);
    rootAssembly.add(coreGroup);

    // Part 5: Outer Split-Spectrum Ring
    const outerRingGeo = new THREE.TorusGeometry(1.46, 0.062, 24, 96);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.castShadow = true;
    coreGroup.add(outerRing);

    // Part 6: Tilted Telemetry Reticle Ring
    const reticleGeo = new THREE.TorusGeometry(1.68, 0.018, 12, 96);
    const reticleRing = new THREE.Mesh(reticleGeo, reticleMat);
    reticleRing.rotation.x = Math.PI * 0.2;
    coreGroup.add(reticleRing);

    // Part 7 & 8: Left Cyan Figure Group (Head + Shoulder Collar + Extruded Arc)
    const leftFigureGroup = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const arcGeo = createInterlockingArcGeometry();
    const shoulderRingGeo = new THREE.TorusGeometry(0.18, 0.022, 12, 32);

    const leftHead = new THREE.Mesh(headGeo, cyanMat);
    leftHead.position.set(-0.48, 0.56, 0.05);
    leftHead.castShadow = true;
    leftFigureGroup.add(leftHead);

    const leftCollar = new THREE.Mesh(shoulderRingGeo, reticleMat);
    leftCollar.position.set(-0.48, 0.34, 0.05);
    leftCollar.rotation.x = Math.PI / 2;
    leftFigureGroup.add(leftCollar);

    const leftBody = new THREE.Mesh(arcGeo, cyanMat);
    leftBody.position.set(-0.27, -0.2, 0.04);
    leftBody.scale.set(0.86, 0.86, 0.86);
    leftBody.castShadow = true;
    leftFigureGroup.add(leftBody);
    coreGroup.add(leftFigureGroup);

    // Part 9: Right Lime Figure Group
    const rightFigureGroup = new THREE.Group();
    const rightHead = new THREE.Mesh(headGeo, limeMat);
    rightHead.position.set(0.48, 0.48, -0.05);
    rightHead.castShadow = true;
    rightFigureGroup.add(rightHead);

    const rightCollar = new THREE.Mesh(shoulderRingGeo, reticleMat);
    rightCollar.position.set(0.48, 0.26, -0.05);
    rightCollar.rotation.x = Math.PI / 2;
    rightFigureGroup.add(rightCollar);

    const rightBody = new THREE.Mesh(arcGeo, limeMat);
    rightBody.position.set(0.27, -0.2, -0.04);
    rightBody.rotation.z = Math.PI;
    rightBody.scale.set(0.86, 0.86, 0.86);
    rightBody.castShadow = true;
    rightFigureGroup.add(rightBody);
    coreGroup.add(rightFigureGroup);

    // Part 10: Dual Helical Skill-Transfer Conduits (TubeGeometry)
    const conduitCurveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.48, 0.34, 0.08),
      new THREE.Vector3(-0.18, 0.72, 0.34),
      new THREE.Vector3(0.18, 0.68, -0.32),
      new THREE.Vector3(0.48, 0.26, -0.08),
    ]);
    const conduitGeoA = new THREE.TubeGeometry(conduitCurveA, 48, 0.022, 12, false);
    const conduitMeshA = new THREE.Mesh(conduitGeoA, conduitMat);
    coreGroup.add(conduitMeshA);

    const conduitCurveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.42, -0.42, 0.14),
      new THREE.Vector3(0, -0.78, -0.28),
      new THREE.Vector3(0.42, -0.42, -0.14),
    ]);
    const conduitGeoB = new THREE.TubeGeometry(conduitCurveB, 40, 0.018, 12, false);
    const conduitMeshB = new THREE.Mesh(conduitGeoB, conduitMat);
    coreGroup.add(conduitMeshB);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pre-allocated scratch vectors (zero per-frame allocations)
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    let activeFinish: MaterialFinishId = 'anodized';

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function applyMaterialFinish(mode: MaterialFinishId) {
      if (mode === 'anodized') {
        cyanMat.metalness = 0.65;
        cyanMat.roughness = 0.2;
        cyanMat.clearcoat = 0.9;
        limeMat.metalness = 0.65;
        limeMat.roughness = 0.22;
        limeMat.clearcoat = 0.9;
        ringMat.metalness = 0.78;
        ringMat.roughness = 0.18;
      } else if (mode === 'titanium') {
        cyanMat.metalness = 0.94;
        cyanMat.roughness = 0.14;
        cyanMat.clearcoat = 0.4;
        limeMat.metalness = 0.94;
        limeMat.roughness = 0.14;
        limeMat.clearcoat = 0.4;
        ringMat.metalness = 0.96;
        ringMat.roughness = 0.12;
      } else {
        cyanMat.metalness = 0.12;
        cyanMat.roughness = 0.56;
        cyanMat.clearcoat = 0.25;
        limeMat.metalness = 0.12;
        limeMat.roughness = 0.56;
        limeMat.clearcoat = 0.25;
        ringMat.metalness = 0.2;
        ringMat.roughness = 0.48;
      }
    }

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

      if (finishRef.current !== activeFinish) {
        activeFinish = finishRef.current;
        applyMaterialFinish(activeFinish);
      }

      controls.autoRotate = autoRotateRef.current && !presetTriggerRef.current;

      if (presetTriggerRef.current) {
        const cfg = CAMERA_PRESETS[presetRef.current];
        desiredCamPos.set(...cfg.pos);
        desiredTarget.set(...cfg.target);
        const alpha = 1 - Math.exp(-4.5 * delta);
        camera.position.lerp(desiredCamPos, alpha);
        controls.target.lerp(desiredTarget, alpha);
        if (camera.position.distanceTo(desiredCamPos) < 0.03) {
          presetTriggerRef.current = false;
        }
      }

      // Smooth damped Exploded vs Assembled inspection offsets
      const explodeFactor = explodedRef.current ? 1 : 0;
      leftFigureGroup.position.x = THREE.MathUtils.damp(
        leftFigureGroup.position.x,
        -0.55 * explodeFactor,
        5,
        delta
      );
      leftFigureGroup.position.z = THREE.MathUtils.damp(
        leftFigureGroup.position.z,
        0.35 * explodeFactor,
        5,
        delta
      );
      rightFigureGroup.position.x = THREE.MathUtils.damp(
        rightFigureGroup.position.x,
        0.55 * explodeFactor,
        5,
        delta
      );
      rightFigureGroup.position.z = THREE.MathUtils.damp(
        rightFigureGroup.position.z,
        -0.35 * explodeFactor,
        5,
        delta
      );
      outerRing.position.z = THREE.MathUtils.damp(
        outerRing.position.z,
        -0.38 * explodeFactor,
        5,
        delta
      );
      reticleRing.position.z = THREE.MathUtils.damp(
        reticleRing.position.z,
        0.42 * explodeFactor,
        5,
        delta
      );
      leftPylon.position.x = THREE.MathUtils.damp(
        leftPylon.position.x,
        -1.32 - 0.35 * explodeFactor,
        5,
        delta
      );
      rightPylon.position.x = THREE.MathUtils.damp(
        rightPylon.position.x,
        1.32 + 0.35 * explodeFactor,
        5,
        delta
      );

      // Gentle core hover & telemetry rotation
      coreGroup.position.y = 1.68 + Math.sin(elapsed * 1.35) * 0.045;
      reticleRing.rotation.z = elapsed * 0.28;
      reticleRing.rotation.y = Math.sin(elapsed * 0.4) * 0.18;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleUserInteract);
      controls.dispose();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);

      [
        floorGeo,
        contactGeo,
        pedestalGeo,
        baseTrimGeo,
        pylonGeo,
        outerRingGeo,
        reticleGeo,
        headGeo,
        arcGeo,
        shoulderRingGeo,
        conduitGeoA,
        conduitGeoB,
      ].forEach((g) => g.dispose());

      [
        floorMat,
        contactMat,
        pedestalMat,
        collarMat,
        ringMat,
        cyanMat,
        limeMat,
        conduitMat,
        reticleMat,
      ].forEach((m) => m.dispose());

      [floorAlbedo, floorRoughness, contactTex, ringTex].forEach((t) => t.dispose());
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [useStaticFallback, isFullscreen]);

  if (useStaticFallback) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-[#050814] p-10 flex flex-col items-center justify-center gap-4 ${className}`}>
        <img
          src="/favicon.png"
          alt="SkillConnect Official 3D Showcase Emblem"
          referrerPolicy="no-referrer"
          className="w-56 h-56 rounded-full object-cover border border-cyan-500/30"
        />
        <p className="text-sm text-slate-300 text-center max-w-md">
          SkillConnect Official Talent &amp; Exchange Core · Interactive WebGL Studio falls back cleanly on reduced-motion or crawler environments.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#050814] overflow-hidden'
          : `relative w-full h-[72vh] min-h-[520px] rounded-2xl border border-white/10 bg-[#050814] overflow-hidden ${className}`
      }
    >
      {/* Full-Bleed WebGL Viewport */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive Three.js SkillConnect 3D Studio"
      />

      {/* Minimal Top-Right Fullscreen Toggle (No telemetry/FPS overlay, no backdrop-filter over canvas) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          aria-label={isFullscreen ? 'Exit fullscreen 3D studio' : 'Enter fullscreen 3D studio'}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#070B1E]/95 border border-white/15 text-xs font-semibold text-slate-200 hover:border-cyan-400/50 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Viewport'}</span>
        </button>
      </div>

      {/* Collapsible Floating Bottom Control Dock (Solid/RGBA dark surface, NO backdrop-filter) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-4xl">
        <div className="rounded-xl bg-[#070B1E]/95 border border-white/15 shadow-2xl px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">3D Emblem Studio</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Drag to orbit · Scroll to zoom
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              aria-expanded={!dockCollapsed}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
              {dockCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {!dockCollapsed && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              {/* Camera Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      presetTriggerRef.current = true;
                      setPreset(id);
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      preset === id
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-[#050814] border border-white/10 text-slate-300 hover:border-cyan-400/40'
                    }`}
                  >
                    {CAMERA_PRESETS[id].label}
                  </button>
                ))}
              </div>

              {/* Material Finish + Explode + Auto-Rotate */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-md border border-white/10 bg-[#050814] p-0.5">
                  {(Object.keys(FINISH_LABELS) as MaterialFinishId[]).map((fId) => (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => setFinish(fId)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        finish === fId
                          ? 'bg-lime-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {FINISH_LABELS[fId]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setExploded((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                    exploded
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-[#050814] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{exploded ? 'Assemble' : 'Explode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRotate((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#050814] border border-white/10 text-slate-300 hover:border-white/25 cursor-pointer"
                >
                  {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{autoRotate ? 'Pause' : 'Orbit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExploded(false);
                    setFinish('anodized');
                    setAutoRotate(true);
                    presetTriggerRef.current = true;
                    setPreset('hero');
                  }}
                  aria-label="Reset 3D camera and state"
                  className="inline-flex items-center justify-center p-1.5 rounded-md bg-[#050814] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
