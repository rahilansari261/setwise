import { IDEAL, progressToIdeal, STAGES, stageOf, torso } from "../lib/vtaper";

const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => 1 - (1 - t) ** 3;

/** Runs `step(0→1)` over `ms`, after `delay`. */
function tween(ms: number, delay: number, step: (t: number) => void) {
	const start = performance.now() + delay;
	const frame = (now: number) => {
		const t = Math.min(1, Math.max(0, (now - start) / ms));
		step(ease(t));
		if (t < 1) requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}

// Numbers count up to the value already in the HTML (so they read correctly without script).
if (motionOK) {
	for (const el of document.querySelectorAll<HTMLElement>("[data-count-from]")) {
		const to = Number.parseFloat(el.textContent ?? "0");
		const from = Number.parseFloat(el.dataset.countFrom ?? "0");
		const decimals = Number(el.dataset.decimals ?? 0);
		const delay = Number(el.dataset.delay ?? 500);
		el.textContent = from.toFixed(decimals);
		tween(1400, delay, (t) => {
			el.textContent = (from + (to - from) * t).toFixed(decimals);
		});
	}
	// The hero torso widens from a plain build to the user's V.
	for (const path of document.querySelectorAll<SVGPathElement>("[data-morph-to]")) {
		const to = Number(path.dataset.morphTo);
		const from = Number(path.dataset.morphFrom ?? 1.2);
		tween(1600, 500, (t) => path.setAttribute("d", torso(from + (to - from) * t)));
	}
}

// A slight 3D tilt on the phone that follows the pointer.
const finePointer = window.matchMedia("(pointer: fine)").matches;
if (motionOK && finePointer) {
	for (const el of document.querySelectorAll<HTMLElement>(".tilt")) {
		const box = el.parentElement ?? el;
		box.addEventListener("pointermove", (e) => {
			const r = box.getBoundingClientRect();
			const x = (e.clientX - r.left) / r.width - 0.5;
			const y = (e.clientY - r.top) / r.height - 0.5;
			el.style.setProperty("--ry", `${x * 10}deg`);
			el.style.setProperty("--rx", `${-y * 8}deg`);
		});
		box.addEventListener("pointerleave", () => {
			el.style.setProperty("--ry", "0deg");
			el.style.setProperty("--rx", "0deg");
		});
	}
}

// Spotlight that follows the cursor across the feature grid.
for (const el of document.querySelectorAll<HTMLElement>(".spot")) {
	el.addEventListener("pointermove", (e) => {
		const r = el.getBoundingClientRect();
		el.style.setProperty("--mx", `${e.clientX - r.left}px`);
		el.style.setProperty("--my", `${e.clientY - r.top}px`);
	});
}

// Shoulder-to-waist calculator.
const sh = document.querySelector<HTMLInputElement>("#calc-shoulders");
const wa = document.querySelector<HTMLInputElement>("#calc-waist");
if (sh && wa) {
	const out = {
		ratio: document.querySelector<HTMLElement>("#calc-ratio"),
		stage: document.querySelector<HTMLElement>("#calc-stage"),
		sh: document.querySelector<HTMLElement>("#calc-shoulders-val"),
		wa: document.querySelector<HTMLElement>("#calc-waist-val"),
		advice: document.querySelector<HTMLElement>("#calc-advice"),
		bar: document.querySelector<HTMLElement>("#calc-bar"),
		body: document.querySelector<SVGPathElement>("#calc-torso"),
		chips: document.querySelectorAll<HTMLElement>("[data-stage]"),
	};
	let shown = 0;
	const fill = (el: HTMLInputElement) => {
		const min = Number(el.min);
		const max = Number(el.max);
		el.style.setProperty("--fill", `${((Number(el.value) - min) / (max - min)) * 100}%`);
	};
	const update = () => {
		const s = Number(sh.value);
		const w = Number(wa.value);
		const ratio = s / w;
		const stage = stageOf(ratio);
		fill(sh);
		fill(wa);
		if (out.sh) out.sh.textContent = `${s} cm`;
		if (out.wa) out.wa.textContent = `${w} cm`;
		if (out.stage) out.stage.textContent = stage.name;
		if (out.bar) out.bar.style.width = `${progressToIdeal(ratio) * 100}%`;
		for (const chip of out.chips) chip.dataset.on = String(chip.dataset.stage === stage.name);
		if (out.advice) {
			const cut = Math.max(0, w - s / IDEAL);
			const add = Math.max(0, w * IDEAL - s);
			out.advice.textContent =
				cut < 0.5
					? "That's the golden ratio. Hold it while you add size."
					: `To reach ${IDEAL}: waist down ${cut.toFixed(1)} cm, or shoulders up ${add.toFixed(1)} cm — usually a bit of both.`;
		}
		// Ease the number and the drawing toward the new ratio instead of jumping.
		const from = shown || ratio;
		tween(motionOK ? 260 : 0, 0, (t) => {
			const r = from + (ratio - from) * t;
			shown = r;
			if (out.ratio) out.ratio.textContent = r.toFixed(2);
			out.body?.setAttribute("d", torso(r));
		});
	};
	sh.addEventListener("input", update);
	wa.addEventListener("input", update);
	update();
}

export { STAGES };
