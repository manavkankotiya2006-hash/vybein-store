/*
  A procedural model of the VYBEIN 50 ml flacon: square glass body with a thick
  base, golden juice, the printed front label, a turned gold collar and a clear
  square cap. Proportions are taken from the product photographs.
*/
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const BODY = { width: 1.5, height: 1.86, depth: 0.92, radius: 0.075, base: 0.26, shoulder: 0.12 };
const CAP = { width: 0.98, height: 0.6, depth: 0.8, gap: 0.16 };
const LABEL = { width: 1.06, aspect: 1177 / 900, centerY: 0.98 };
export const BOTTLE_HEIGHT = BODY.height + CAP.gap + CAP.height;

export interface Bottle {
  /** Rotate, move and scale this group. Its origin is the bottle's visual centre. */
  root: THREE.Group;
  /** 0 = cap closed, 1 = cap lifted clear of the collar. */
  setCapLift(amount: number): void;
  /** Show a label; with `reveal`, the new artwork rises over the old behind a gold edge. */
  setLabel(texture: THREE.Texture, reveal?: boolean): void;
  /** Advance the light sweep across the glass. */
  tick(time: number): void;
  dispose(): void;
}

function glassMaterial(thickness: number, reflections = 1.4, clearcoat = 0) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.015,
    transmission: 1,
    thickness,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat,
    clearcoatRoughness: 0.02,
    attenuationColor: new THREE.Color(0xfff1d6),
    attenuationDistance: 3.5,
    dispersion: 0.3,
    envMapIntensity: reflections
  });
}

/*
  Perfume seen through thick glass: a deep amber core that brightens toward
  the edges, with a light line where the surface meets the shoulder.
*/
function juiceMaterial(height: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      deep: { value: new THREE.Color(0x8f4a0c) },
      bright: { value: new THREE.Color(0xf0b84e) },
      rim: { value: new THREE.Color(0xffe3a6) },
      height: { value: height }
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying float vHeight;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-viewPosition.xyz);
        vHeight = position.y;
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 deep;
      uniform vec3 bright;
      uniform vec3 rim;
      uniform float height;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying float vHeight;
      void main() {
        float facing = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
        float level = clamp(vHeight / height + 0.5, 0.0, 1.0);
        vec3 colour = mix(bright, deep, pow(facing, 1.4) * 0.62 + (1.0 - level) * 0.18);
        colour = mix(colour, rim, pow(1.0 - facing, 3.0) * 0.55);
        colour += rim * smoothstep(0.9, 1.0, level) * 0.22;
        gl_FragColor = vec4(colour, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

// Rounded-rectangle mask for the back of the label, seen through the glass.
function labelMask() {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = Math.round(180 * LABEL.aspect);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.beginPath();
  context.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 7);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/*
  A band of light that glides diagonally across the front glass every few
  seconds, the way a bottle catches a studio light as it turns.
*/
function glintMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { sweep: { value: -1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float sweep;
      varying vec2 vUv;
      void main() {
        float offset = abs(vUv.x * 0.8 + vUv.y * 0.6 - sweep);
        float band = (1.0 - smoothstep(0.0, 0.18, offset)) * 0.22 + (1.0 - smoothstep(0.0, 0.03, offset)) * 0.5;
        vec2 edge = min(vUv, 1.0 - vUv);
        band *= smoothstep(0.0, 0.04, min(edge.x, edge.y));
        gl_FragColor = vec4(vec3(1.0, 0.94, 0.82) * band, 1.0);
      }`
  });
}

/*
  The printed label. Unlit so the artwork keeps its true colours in a dark
  scene, softly shaded toward the edges as it turns away. It can reveal a new
  label over the old one, led by a glowing gold line.
*/
function labelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      from: { value: null as THREE.Texture | null },
      to: { value: null as THREE.Texture | null },
      progress: { value: 1 },
      gold: { value: new THREE.Color(0xffc861) }
    },
    // Transparent keeps the label out of the glass's refraction pass: it is
    // printed on the outside, so it should never ghost through the bottle.
    transparent: true,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vFacing;
      void main() {
        vUv = uv;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vFacing = clamp(dot(normalize(normalMatrix * normal), normalize(-viewPosition.xyz)), 0.0, 1.0);
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec3 gold;
      varying vec2 vUv;
      varying float vFacing;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec4 next = texture2D(to, vUv);
        vec4 previous = texture2D(from, vUv);
        // A slightly uneven edge travels from the bottom of the label to the top.
        float edge = vUv.y * 0.9 + vUv.x * 0.1 + (hash(floor(vUv * 48.0)) - 0.5) * 0.025;
        float front = progress * 1.12 - 0.06;
        float shown = 1.0 - smoothstep(front - 0.012, front + 0.012, edge);
        vec4 artwork = mix(previous, next, shown);
        if (artwork.a < 0.5) discard;
        vec3 colour = artwork.rgb * (0.8 + 0.22 * vFacing);
        // A bright gold seam leads the reveal, with a soft glow trailing below it.
        float revealing = step(0.001, progress) * step(progress, 0.999);
        float seam = 1.0 - smoothstep(0.0, 0.03, abs(edge - front));
        float trail = (1.0 - smoothstep(0.0, 0.22, front - edge)) * step(edge, front);
        colour += gold * (seam * 2.6 + trail * 0.35) * revealing;
        gl_FragColor = vec4(colour, 1.0);
        #include <colorspace_fragment>
      }`
  });
}

const SWEEP_PERIOD = 7;
const REVEAL_SECONDS = 1.1;

export function createBottle(): Bottle {
  const root = new THREE.Group();
  const model = new THREE.Group();
  model.position.y = -BOTTLE_HEIGHT / 2;
  root.add(model);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T) => (disposables.push(item), item);

  const bodyGlass = track(glassMaterial(1.1));
  // The cap is mostly seen against the dark backdrop, so it leans on reflections.
  const capGlass = track(glassMaterial(0.55, 2.2, 0.6));
  const gold = track(new THREE.MeshPhysicalMaterial({
    color: 0xe2b965,
    metalness: 1,
    roughness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.6
  }));
  const juiceHeight = BODY.height - BODY.base - BODY.shoulder;
  const juice = track(juiceMaterial(juiceHeight));

  // Glass body, resting on y = 0.
  const body = new THREE.Mesh(
    track(new RoundedBoxGeometry(BODY.width, BODY.height, BODY.depth, 6, BODY.radius)),
    bodyGlass
  );
  body.position.y = BODY.height / 2;
  model.add(body);

  // Juice fills the cavity above the heavy glass base.
  const liquid = new THREE.Mesh(
    track(new RoundedBoxGeometry(BODY.width - 0.2, juiceHeight, BODY.depth - 0.2, 4, 0.05)),
    juice
  );
  liquid.position.y = BODY.base + juiceHeight / 2;
  model.add(liquid);

  // Front label, printed on the outside of the glass.
  const labelGeometry = track(new THREE.PlaneGeometry(LABEL.width, LABEL.width * LABEL.aspect));
  const labelFront = track(labelMaterial());
  let revealStart = -1;
  const label = new THREE.Mesh(labelGeometry, labelFront);
  label.position.set(0, LABEL.centerY, BODY.depth / 2 + 0.004);
  model.add(label);

  const labelBack = new THREE.Mesh(
    labelGeometry,
    track(new THREE.MeshStandardMaterial({ color: 0xefe8db, roughness: 0.8, alphaMap: track(labelMask()), alphaTest: 0.5 }))
  );
  labelBack.position.copy(label.position).setZ(BODY.depth / 2 + 0.002);
  labelBack.rotation.y = Math.PI;
  model.add(labelBack);

  // The light sweep sits on the front glass, just behind the label so the paper never shines.
  const glint = track(glintMaterial());
  const sweep = new THREE.Mesh(track(new THREE.PlaneGeometry(BODY.width - 0.06, BODY.height - 0.06)), glint);
  sweep.position.set(0, BODY.height / 2, BODY.depth / 2 + 0.0015);
  model.add(sweep);

  // Turned gold collar: a wide ferrule on the shoulder rising into a slimmer neck.
  const collarProfile = [
    [0, 0], [0.37, 0], [0.37, 0.045], [0.33, 0.07], [0.315, 0.09], [0.315, 0.15],
    [0.3, 0.16], [0.225, 0.175], [0.225, 0.3], [0.235, 0.31], [0.235, 0.335], [0.225, 0.345],
    [0.225, 0.56], [0.19, 0.6], [0.075, 0.6], [0.075, 0.66], [0, 0.66]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const collar = new THREE.Mesh(track(new THREE.LatheGeometry(collarProfile, 72)), gold);
  collar.position.y = BODY.height;
  model.add(collar);

  // Clear square cap.
  const cap = new THREE.Group();
  const capRest = BODY.height + CAP.gap + CAP.height / 2;
  cap.position.y = capRest;
  const capMesh = new THREE.Mesh(
    track(new RoundedBoxGeometry(CAP.width, CAP.height, CAP.depth, 5, 0.06)),
    capGlass
  );
  cap.add(capMesh);
  model.add(cap);

  return {
    root,
    setCapLift(amount) {
      const lift = THREE.MathUtils.clamp(amount, 0, 1);
      cap.position.y = capRest + lift * 0.62;
      cap.rotation.y = lift * 0.38;
      cap.rotation.z = lift * -0.06;
    },
    setLabel(texture, reveal = false) {
      const uniforms = labelFront.uniforms;
      if (uniforms.to.value === texture) return;
      if (!reveal || !uniforms.to.value) {
        uniforms.from.value = uniforms.to.value = texture;
        uniforms.progress.value = 1;
        revealStart = -1;
        return;
      }
      // Whatever is showing now becomes the label being covered.
      uniforms.from.value = uniforms.progress.value < 0.5 ? uniforms.from.value : uniforms.to.value;
      uniforms.to.value = texture;
      uniforms.progress.value = 0;
      revealStart = performance.now() / 1000;
    },
    tick(time) {
      if (revealStart >= 0) {
        const progress = Math.min(1, (performance.now() / 1000 - revealStart) / REVEAL_SECONDS);
        labelFront.uniforms.progress.value = THREE.MathUtils.smootherstep(progress, 0, 1);
        if (progress === 1) {
          labelFront.uniforms.from.value = labelFront.uniforms.to.value;
          revealStart = -1;
        }
      }
      // Glide across in the first third of each period, then rest off the glass.
      const phase = (time % SWEEP_PERIOD) / SWEEP_PERIOD;
      glint.uniforms.sweep.value = -0.3 + THREE.MathUtils.smootherstep(phase, 0, 0.32) * 1.9;
    },
    dispose() {
      disposables.forEach((item) => item.dispose());
    }
  };
}
