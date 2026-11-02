/*
  Product page viewer: the 3D flacon wearing this perfume's label. Visitors
  can drag (or use arrow keys) to turn it, lift the cap, or switch to the
  photograph. It turns slowly on its own until someone takes hold of it.
*/
import { gsap } from "gsap";
import { canUseWebGL, createStage } from "./three/stage";
import { reducedMotion } from "./site";

const viewer = document.querySelector<HTMLElement>("[data-viewer]");
const canvas = viewer?.querySelector<HTMLCanvasElement>("canvas");

if (viewer && canvas) {
  if (canUseWebGL()) start(viewer, canvas);
  else viewer.classList.add("no-webgl", "show-photo");
}

function start(viewer: HTMLElement, canvas: HTMLCanvasElement) {
  const stage = createStage({ canvas, background: "#0c0a08", glow: "#6e4c25", dust: 60 });
  const { bottle } = stage;
  stage.showLabel(viewer.dataset.code || "").then(() => viewer.classList.add("is-ready"));

  const spin = { angle: -0.45, velocity: 0, tilt: 0.06, cap: 0 };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleSince = performance.now();

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    viewer.classList.add("is-dragging", "has-interacted");
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    spin.velocity = dx * 0.012;
    spin.angle += spin.velocity;
    spin.tilt = Math.max(-0.35, Math.min(0.35, spin.tilt + dy * 0.004));
  });
  const release = () => {
    dragging = false;
    idleSince = performance.now();
    viewer.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    gsap.to(spin, { angle: spin.angle + (event.key === "ArrowRight" ? 0.6 : -0.6), duration: 0.6, ease: "power2.out" });
    idleSince = performance.now();
    viewer.classList.add("has-interacted");
  });

  stage.onFrame((time, delta) => {
    if (!dragging) {
      // Inertia after a flick, then a slow turn once the visitor lets go for a while.
      spin.velocity *= Math.pow(0.04, delta);
      spin.angle += spin.velocity;
      if (!reducedMotion && performance.now() - idleSince > 2600) spin.angle += delta * 0.32;
      spin.tilt += (0.06 - spin.tilt) * (1 - Math.exp(-delta * 1.5));
    }
    bottle.root.position.y = reducedMotion ? 0 : Math.sin(time * 0.9) * 0.03 - 0.04;
    bottle.root.rotation.set(spin.tilt, spin.angle, 0);
    bottle.setCapLift(spin.cap);
  });

  const capButton = viewer.querySelector<HTMLButtonElement>("[data-viewer-cap]");
  capButton?.addEventListener("click", () => {
    const open = capButton.getAttribute("aria-pressed") !== "true";
    capButton.setAttribute("aria-pressed", String(open));
    capButton.textContent = open ? "Close the cap" : "Lift the cap";
    gsap.to(spin, { cap: open ? 1 : 0, duration: reducedMotion ? 0 : 1.1, ease: "power3.inOut" });
  });

  const modeButtons = viewer.querySelectorAll<HTMLButtonElement>("[data-viewer-mode]");
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const photo = button.dataset.viewerMode === "photo";
      viewer.classList.toggle("show-photo", photo);
      modeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    });
  });
}
