/*
  Shared WebGL stage for the bottle: renderer, studio lighting, a softly lit
  backdrop the glass can refract, drifting gold dust, label loading, and a
  render loop that only runs while the canvas is on screen.
*/
import * as THREE from "three";
import { createBottle } from "./bottle";

export interface StageOptions {
  canvas: HTMLCanvasElement;
  /** Must match the CSS background behind the canvas so the edges disappear. */
  background: string;
  glow: string;
  dust?: number;
  /** Render single frames on demand instead of animating (reduced motion). */
  still?: boolean;
}

export type FrameCallback = (time: number, delta: number) => void;

export function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// A dithered spotlight glow; the noise stops banding in dark gradients.
// The canvas maps to the 64 x 32 unit backdrop at 32 px per unit.
function glowTexture(background: string, glow: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const glowColour = new THREE.Color(glow);
  const rgba = (alpha: number) => `rgba(${glowColour.r * 255},${glowColour.g * 255},${glowColour.b * 255},${alpha})`;
  const gradient = context.createRadialGradient(1024, 512, 0, 1024, 512, 230);
  gradient.addColorStop(0, rgba(1));
  gradient.addColorStop(0.28, rgba(0.62));
  gradient.addColorStop(0.62, rgba(0.16));
  gradient.addColorStop(1, rgba(0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 3;
    pixels.data[i] += noise;
    pixels.data[i + 1] += noise;
    pixels.data[i + 2] += noise;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function dotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,236,196,1)");
  gradient.addColorStop(0.35, "rgba(232,196,128,.55)");
  gradient.addColorStop(1, "rgba(232,196,128,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/*
  A virtual photo studio for reflections: tall strip lights either side give
  the crisp vertical streaks seen in product photography, with a small
  softbox overhead and a warm rim behind. Everything else stays dark, so the
  glass reads as clear and the juice keeps its colour.
*/
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x0b0907);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.Material[] = [];
  const light = (colour: number, intensity: number, [width, height]: number[], [x, y, z]: number[]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(intensity), side: THREE.DoubleSide });
    materials.push(material);
    const panel = new THREE.Mesh(geometry, material);
    panel.scale.set(width, height, 1);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  };
  light(0xfff4e6, 10, [0.32, 7], [-3.2, 0.5, 3.2]);
  light(0xffe6c2, 7, [0.26, 7], [3.6, 0.5, 2.4]);
  light(0xffd49a, 4, [0.5, 6], [-3, 0, -3.5]);
  light(0xffffff, 2.2, [2.4, 1.4], [0, 5.5, 1]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(studio, 0.02).texture;
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return texture;
}

export function createStage({ canvas, background, glow, dust = 140, still = false }: StageOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const environment = studioEnvironment(renderer);
  scene.environment = environment;
  scene.environmentIntensity = 1;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const key = new THREE.DirectionalLight(0xffe4bd, 2.4);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffc27a, 2.2);
  rim.position.set(4, 2, -4);
  scene.add(key, rim);

  // Backdrop the glass refracts; it trails the bottle so the glow stays behind it.
  const backdropTexture = glowTexture(background, glow);
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 32),
    new THREE.MeshBasicMaterial({ map: backdropTexture, toneMapped: false })
  );
  backdrop.position.z = -7;
  scene.add(backdrop);

  const bottle = createBottle();
  scene.add(bottle.root);

  // Gold dust, drifting slowly upward around the bottle.
  const dustTexture = dotTexture();
  const dustPositions = new Float32Array(dust * 3);
  const dustSpeeds = new Float32Array(dust);
  for (let i = 0; i < dust; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 9;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    dustSpeeds[i] = 0.04 + Math.random() * 0.1;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    size: 0.05,
    map: dustTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const dustCloud = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dustCloud);

  // Label textures load once and are reused; the latest request always wins.
  const loader = new THREE.TextureLoader();
  const labels = new Map<string, Promise<THREE.Texture>>();
  let requestedLabel = "";
  function loadLabel(code: string) {
    if (!labels.has(code)) {
      labels.set(code, loader.loadAsync(`/textures/labels/${code}.webp`).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      }));
    }
    return labels.get(code)!;
  }
  async function showLabel(code: string, reveal = false) {
    requestedLabel = code;
    const texture = await loadLabel(code);
    if (requestedLabel !== code) return;
    bottle.setLabel(texture, reveal && !still);
    if (still) draw();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (still) draw();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  function draw() {
    // Scale by depth so the glow lands directly behind the bottle on screen.
    const depth = (camera.position.z - backdrop.position.z) / camera.position.z;
    backdrop.position.x = bottle.root.position.x * depth;
    backdrop.position.y = bottle.root.position.y * depth;
    renderer.render(scene, camera);
  }

  const callbacks: FrameCallback[] = [];
  let frame = 0;
  let last = 0;
  let visible = false;
  let slowFrames = 0;
  let sampledFrames = 0;

  function render(now: number) {
    frame = requestAnimationFrame(render);
    const delta = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const time = now / 1000;

    for (let i = 0; i < dust; i++) {
      const y = i * 3 + 1;
      dustPositions[y] += dustSpeeds[i] * delta;
      if (dustPositions[y] > 3) dustPositions[y] = -3;
    }
    dustGeometry.attributes.position.needsUpdate = true;
    dustCloud.rotation.y = time * 0.015;

    bottle.tick(time);
    callbacks.forEach((callback) => callback(time, delta));
    draw();

    // Step the resolution down on devices that cannot keep up.
    sampledFrames++;
    if (delta > 0.024) slowFrames++;
    if (sampledFrames === 90) {
      if (slowFrames > 45 && pixelRatio > 1) {
        pixelRatio = Math.max(1, pixelRatio - 0.5);
        renderer.setPixelRatio(pixelRatio);
        resize();
      }
      sampledFrames = slowFrames = 0;
    }
  }

  function start() {
    if (still) return draw();
    if (frame || !visible) return;
    last = 0;
    frame = requestAnimationFrame(render);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  visibility.observe(canvas);

  return {
    scene,
    camera,
    renderer,
    bottle,
    showLabel,
    loadLabel,
    onFrame(callback: FrameCallback) {
      callbacks.push(callback);
    },
    /** Render a single frame, e.g. for reduced-motion visitors. */
    renderOnce() {
      draw();
    },
    setDust(opacity: number) {
      dustMaterial.opacity = opacity;
    },
    dispose() {
      stop();
      visibility.disconnect();
      resizeObserver.disconnect();
      bottle.dispose();
      [backdropTexture, dustTexture, environment].forEach((item) => item.dispose());
      labels.forEach((texture) => texture.then((item) => item.dispose()));
      renderer.dispose();
    }
  };
}

export type Stage = ReturnType<typeof createStage>;
