/*
  Home page overture: a pinned 3D bottle that turns through three chapters
  (opening, heart, trail) as the visitor scrolls, lifts its cap, and finally
  faces forward while its label cycles through the whole collection.
*/
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCTS, productNumber, productUrl } from "../data/products";
import { canUseWebGL, createStage } from "./three/stage";
import { lenis, reducedMotion } from "./site";

gsap.registerPlugin(ScrollTrigger);

interface Pose { x: number; y: number; rotY: number; rotX: number; scale: number; cap: number }

const TURN = Math.PI * 2;
// hero, I. opening, II. heart, III. trail, the collection
const WIDE: Pose[] = [
  { x: 1.5, y: -0.06, rotY: -0.55, rotX: 0.07, scale: 1, cap: 0 },
  { x: 1.6, y: 0, rotY: 0.68, rotX: 0.02, scale: 1, cap: 0 },
  { x: -1.6, y: -0.24, rotY: 1.5, rotX: -0.05, scale: 1, cap: 1 },
  { x: 1.6, y: 0, rotY: TURN - 0.4, rotX: 0.05, scale: 1, cap: 0 },
  { x: 0, y: 0.02, rotY: TURN, rotX: 0, scale: 1.12, cap: 0 }
];
// Phones: a smaller bottle in the upper half, leaving the lower half for text.
const NARROW: Pose[] = [
  { x: 0, y: 0.92, rotY: -0.5, rotX: 0.07, scale: 0.56, cap: 0 },
  { x: 0, y: 0.92, rotY: 0.7, rotX: 0.02, scale: 0.56, cap: 0 },
  { x: 0, y: 0.66, rotY: 1.5, rotX: -0.04, scale: 0.52, cap: 1 },
  { x: 0, y: 0.92, rotY: TURN - 0.4, rotX: 0.05, scale: 0.56, cap: 0 },
  { x: 0, y: 0.95, rotY: TURN, rotX: 0, scale: 0.58, cap: 0 }
];

const section = document.querySelector<HTMLElement>("[data-overture]");
const canvas = document.querySelector<HTMLCanvasElement>("[data-overture-canvas]");

if (section && canvas) {
  if (!canUseWebGL()) {
    section.classList.add("no-webgl", "is-static");
  } else {
    start(section, canvas);
  }
}

function start(section: HTMLElement, canvas: HTMLCanvasElement) {
  const narrowQuery = window.matchMedia("(max-width: 900px), (orientation: portrait)");
  const poses = () => (narrowQuery.matches ? NARROW : WIDE);
  const stage = createStage({ canvas, background: "#0c0a08", glow: "#7d5629", dust: narrowQuery.matches ? 70 : 140, still: reducedMotion });
  const { bottle } = stage;
  const state: Pose & { label: number } = { ...poses()[0], label: 0 };

  stage.showLabel(PRODUCTS[0].code).then(() => section.classList.add("is-ready"));
  // Fetch the other seven labels once the first frame is on screen.
  const preload = () => PRODUCTS.forEach((product) => stage.loadLabel(product.code));
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(preload, { timeout: 2500 });
  else setTimeout(preload, 1500);

  // A soft pointer parallax adds life without competing with the scroll.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Visitors can take hold of the bottle and spin it. Once let go, it keeps
  // its momentum for a moment, then settles back into the scroll story.
  const spin = { offset: 0, tilt: 0, velocity: 0, dragging: false, lastX: 0, lastY: 0, releasedAt: 0 };
  const dragHint = section.querySelector<HTMLElement>("[data-drag-hint]");
  canvas.addEventListener("pointerdown", (event) => {
    spin.dragging = true;
    spin.lastX = event.clientX;
    spin.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    section.classList.add("is-grabbing");
    dragHint?.classList.add("is-done");
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!spin.dragging) return;
    spin.velocity = (event.clientX - spin.lastX) * 0.011;
    spin.offset += spin.velocity;
    spin.tilt = Math.max(-0.3, Math.min(0.3, spin.tilt + (event.clientY - spin.lastY) * 0.004));
    spin.lastX = event.clientX;
    spin.lastY = event.clientY;
  });
  const release = () => {
    if (!spin.dragging) return;
    spin.dragging = false;
    spin.releasedAt = performance.now();
    section.classList.remove("is-grabbing");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  function applyPose(time = 0) {
    const float = reducedMotion ? 0 : Math.sin(time * 0.9) * 0.035;
    const sway = reducedMotion ? 0 : Math.sin(time * 0.35) * 0.05;
    bottle.root.position.set(state.x, state.y + float, 0);
    bottle.root.rotation.set(state.rotX + spin.tilt + pointer.y * 0.06, state.rotY + spin.offset + sway + pointer.x * 0.12, 0);
    bottle.root.scale.setScalar(state.scale);
    bottle.setCapLift(state.cap);
  }
  stage.onFrame((time, delta) => {
    const ease = 1 - Math.exp(-delta * 3);
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;
    if (!spin.dragging) {
      spin.offset += spin.velocity;
      spin.velocity *= Math.pow(0.03, delta);
      if (performance.now() - spin.releasedAt > 1400) {
        // Settle on the nearest full turn so a big spin never unwinds backwards.
        const settle = 1 - Math.exp(-delta * 1.8);
        spin.offset += (Math.round(spin.offset / TURN) * TURN - spin.offset) * settle;
        spin.tilt -= spin.tilt * settle;
      }
    }
    applyPose(time);
  });
  applyPose();

  if (reducedMotion) {
    section.classList.add("is-static");
    return;
  }

  /* ---------- Collection cycle ---------- */
  const cycleNumber = section.querySelector<HTMLElement>("[data-cycle-no]");
  const cycleName = section.querySelector<HTMLAnchorElement>("[data-cycle-name]");
  const cycleInspired = section.querySelector<HTMLElement>("[data-cycle-inspired]");
  const cycleDots = section.querySelectorAll<HTMLElement>("[data-cycle-dot]");
  const cycleText = [cycleNumber, cycleName, cycleInspired].filter(Boolean);
  let shownLabel = 0;
  function showProduct(index: number) {
    if (index === shownLabel) return;
    shownLabel = index;
    const product = PRODUCTS[index];
    stage.showLabel(product.code, true);
    gsap.fromTo(cycleText, { autoAlpha: 0, y: 16, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.06, ease: "power3.out", overwrite: true });
    if (cycleNumber) cycleNumber.textContent = `No. ${productNumber(product)}`;
    if (cycleName) {
      cycleName.textContent = product.code;
      cycleName.href = productUrl(product);
    }
    if (cycleInspired) cycleInspired.textContent = `Inspired by ${product.inspiredBy}`;
    cycleDots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  }

  /* ---------- Scroll timeline ---------- */
  const panels = [...section.querySelectorAll<HTMLElement>("[data-panel]")];
  const chapters = section.querySelectorAll<HTMLElement>("[data-chapter-mark]");
  const progressBar = section.querySelector<HTMLElement>("[data-overture-progress]");
  const scrollCue = section.querySelector<HTMLElement>("[data-scroll-cue]");
  lenis?.on("scroll", ScrollTrigger.update);

  const media = gsap.matchMedia();
  media.add({ narrow: "(max-width: 900px), (orientation: portrait)", wide: "(min-width: 901px) and (orientation: landscape)" }, () => {
    const pose = poses();
    Object.assign(state, pose[0]);
    const timeline = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
        onUpdate(self) {
          if (progressBar) progressBar.style.transform = `scaleY(${self.progress})`;
          const time = self.progress * timeline.duration();
          const chapter = [1.2, 3.6, 6.1, 8.5].filter((boundary) => time >= boundary).length;
          chapters.forEach((mark, index) => mark.classList.toggle("is-active", index === chapter));
        }
      }
    });

    const panelIn = (index: number, at: number) => timeline.fromTo(panels[index], { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }, at);
    const panelOut = (index: number, at: number) => timeline.to(panels[index], { autoAlpha: 0, y: -46, duration: 0.45, ease: "power2.in" }, at);
    const move = (index: number, at: number, duration = 1.3) => timeline.to(state, { ...pose[index], duration }, at);

    timeline.to([scrollCue, dragHint], { autoAlpha: 0, duration: 0.3 }, 0.2);
    panelOut(0, 0.7);
    move(1, 0.8);
    panelIn(1, 1.6);
    panelOut(1, 3.0);
    move(2, 3.0, 1.5);
    panelIn(2, 4.2);
    panelOut(2, 5.6);
    move(3, 5.6, 1.5);
    panelIn(3, 6.9);
    panelOut(3, 8.0);
    move(4, 8.0, 1.1);
    panelIn(4, 8.8);
    timeline.to(state, {
      label: PRODUCTS.length - 0.001,
      duration: 3.6,
      ease: "none",
      onUpdate: () => showProduct(Math.floor(state.label))
    }, 9.1);
    timeline.to({}, { duration: 0.5 }, 12.7);

    return () => {
      state.label = 0;
      showProduct(0);
    };
  });
}
