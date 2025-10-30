// src/sim/simulatedRace.ts
// Simulated racing engine for UX demos/testing using public "Next to Go" pre-race data.
// Provides deterministic (seedable) live ticks, positions, and final placings.
// No external deps. Designed for Vue/React/Svelte or plain TS integration.

/* ---------------------------------- Types --------------------------------- */

export type CategoryId =
	| '4a2788f8-e825-4d36-9894-efd4baf1cfae' // Horse
	| '9daef0d7-bf3c-4f50-921d-8e818c60fe61' // Greyhound
	| '161d9be2-e909-4326-8c2c-35ed71fb460b' // Harness
	| string;

// New interfaces for external factors
export interface WeatherConditions {
	type: 'sunny' | 'cloudy' | 'rainy' | 'windy';
	intensity: number; // 0-1 scale
}

export interface TrackCondition {
	type: 'good' | 'dead' | 'slow' | 'fast';
	quality: number; // 0-1 scale
}

export interface RunnerInput {
	id: string;
	number: number;
	name: string;
	decimalOdds?: number | null; // e.g. 2.8; if null/undefined/SP -> treated as missing
}

export interface RaceInput {
	id: string;
	meetingName: string;
	raceNumber: number;
	categoryId: CategoryId;
	advertisedStartMs?: number;
	runners: RunnerInput[];
	// New optional fields for external factors
	weather?: WeatherConditions;
	trackCondition?: TrackCondition;
}

export type SimStatus = 'pending' | 'running' | 'finished' | 'aborted';

export interface Tick {
	raceId: string;
	tElapsedMs: number;
	tTotalMs: number;
	progressByRunner: Record<string, number>; // 0..1 clamped
	order: string[]; // runner ids sorted by progress desc
	gaps: Record<string, number>; // leader progress - runner progress
	etaMs: number; // remaining time estimate (>=0)
	status: SimStatus;
}

export interface Result {
	raceId: string;
	placings: string[]; // ordered runner ids (1st..last)
	finishTimesMs: Record<string, number>;
	status: SimStatus; // 'finished'
	seed: number;
}

export interface SimulationController {
	start(): void;
	stop(): void;
	onTick(cb: (tick: Tick) => void): void;
	onFinish(cb: (res: Result) => void): void;
	getSeed(): number;
	getPlannedDurationMs(): number;
}

/* --------------------------- Deterministic PRNG --------------------------- */
// Mulberry32 — tiny, decent statistical quality for UI sims.
function mulberry32(seed: number) {
	let t = seed >>> 0;
	return function rand(): number {
		t += 0x6D2B79F5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

// Gaussian via Box–Muller (clamped tails)
function gaussian(rand: () => number, mean = 0, std = 1): number {
	let u = 0, v = 0;
	// avoid 0
	while (u === 0) u = rand();
	while (v === 0) v = rand();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	return mean + std * z;
}

function clamp01(x: number): number {
	return x < 0 ? 0 : x > 1 ? 1 : x;
}

/* --------------------------- Category Durations --------------------------- */

const CATEGORY_BOUNDS: Record<string, { min: number; max: number }> = {
	// Plausible UI playback windows (milliseconds)
	'9daef0d7-bf3c-4f50-921d-8e818c60fe61': { min: 25000, max: 35000 },   // Greyhound
	'161d9be2-e909-4326-8c2c-35ed71fb460b': { min: 110000, max: 170000 }, // Harness
	'4a2788f8-e825-4d36-9894-efd4baf1cfae': { min: 55000, max: 105000 },  // Horse
	default: { min: 60000, max: 90000 }
};

function pickDurationMs(rand: () => number, categoryId: CategoryId): number {
	const cfg = CATEGORY_BOUNDS[categoryId] || CATEGORY_BOUNDS.default;
	const t = cfg.min + Math.floor(rand() * (cfg.max - cfg.min));
	// Add slight seeded wobble (±3%)
	const wobble = 1 + (rand() - 0.5) * 0.06;
	return Math.max(cfg.min, Math.min(cfg.max, Math.round(t * wobble)));
}

/* ----------------------- Odds → Probability Normaliser -------------------- */

function normaliseProbabilities(runners: RunnerInput[]): Map<string, number> {
	// Convert decimal odds to implied probabilities; handle missing odds as uniform.
	const probs = new Map<string, number>();
	let anyOdds = false;
	for (const r of runners) {
		if (r.decimalOdds && r.decimalOdds > 1.01) {
			probs.set(r.id, 1 / r.decimalOdds);
			anyOdds = true;
		}
	}
	if (!anyOdds) {
		const p = 1 / runners.length;
		for (const r of runners) probs.set(r.id, p);
		return probs;
	}
	let sum = 0;
	for (const r of runners) {
		const p = probs.get(r.id);
		if (p) sum += p;
	}
	// Remove overround: scale so they sum to 1 across runners with odds
	for (const r of runners) {
		if (probs.has(r.id)) probs.set(r.id, (probs.get(r.id)! / sum));
	}
	// For runners missing odds, give them the smallest observed probability share
	const minP = Math.min(...Array.from(probs.values()));
	for (const r of runners) {
		if (!probs.has(r.id)) probs.set(r.id, minP * 0.9);
	}
	// Re-normalise
	let s2 = 0;
	probs.forEach(v => { s2 += v; });
	probs.forEach((v, k) => probs.set(k, v / s2));
	return probs;
}

/* ---------------------------- Pace Curve Helpers -------------------------- */

// Smooth acceleration → cruise → final kick. Returns progress [0..1] at time fraction u.
// Enhanced with more realistic horse/greyhound/harness movement patterns
function paceCurve(u: number, accel = 0.3, kick = 0.2, stamina = 1.0): number {
	// Three-piece cubic Bezier-ish easing with stamina factor
	if (u <= accel) {
		const x = u / accel; // early acceleration
		return (x * x) / 2 * accel;
	}
	if (u >= 1 - kick) {
		const x = (u - (1 - kick)) / kick; // late kick
		// Stamina affects the final kick - tired runners have weaker final push
		const kickStrength = Math.max(0.3, kick * stamina);
		return 1 - (1 - kickStrength) * (1 - (1 - (1 - x) * (1 - x)) / 2);
	}
	// Mid race: near-linear with slight smoothing, but stamina affects consistency
	const midSpan = 1 - accel - kick;
	const x = (u - accel) / midSpan;
	// Stamina affects mid-race consistency - tired runners have more variation
	const consistency = Math.min(1, stamina * 1.2);
	const variation = (1 - consistency) * 0.05 * (Math.sin(u * 20) + Math.cos(u * 15));
	return accel / 2 + x * midSpan + variation;
}

/* ------------------------------- Simulation ------------------------------- */

export function createRaceSimulation(input: RaceInput, seed = Date.now() >>> 0, tickMs = 200): SimulationController {
	if (!input.runners || input.runners.length === 0) {
		throw new Error('Simulation requires at least one runner');
	}

	// Seeded RNG
	const rand = mulberry32(seed);

	// Probabilities from odds
	const pMap = normaliseProbabilities(input.runners); // id -> p

	// Planned duration for this playback
	const tTotalMs = pickDurationMs(rand, input.categoryId);

	// External factors
	const weather = input.weather || { type: 'sunny', intensity: 0 };
	const trackCondition = input.trackCondition || { type: 'good', quality: 1 };

	// Weather impact factors
	let weatherSpeedFactor = 1.0;
	let weatherStaminaFactor = 1.0;
	
	switch (weather.type) {
		case 'rainy':
			weatherSpeedFactor = 0.9 - (weather.intensity * 0.1); // Slower in rain
			weatherStaminaFactor = 0.95 - (weather.intensity * 0.05); // More tiring
			break;
		case 'windy':
			weatherSpeedFactor = 0.95 - (weather.intensity * 0.05); // Slightly slower
			weatherStaminaFactor = 0.97 - (weather.intensity * 0.03); // Slightly more tiring
			break;
		case 'cloudy':
			weatherSpeedFactor = 0.98; // Slight slowdown
			weatherStaminaFactor = 0.99; // Slight stamina impact
			break;
		default: // sunny
			weatherSpeedFactor = 1.0; // No impact
			weatherStaminaFactor = 1.0; // No impact
	}

	// Track condition impact factors
	let trackSpeedFactor = 1.0;
	let trackStaminaFactor = 1.0;
	
	switch (trackCondition.type) {
		case 'slow':
			trackSpeedFactor = 0.85; // Much slower
			trackStaminaFactor = 0.9; // More tiring
			break;
		case 'dead':
			trackSpeedFactor = 0.92; // Slower
			trackStaminaFactor = 0.95; // More tiring
			break;
		case 'fast':
			trackSpeedFactor = 1.08; // Faster
			trackStaminaFactor = 1.02; // Less tiring
			break;
		default: // good
			trackSpeedFactor = 1.0; // Normal
			trackStaminaFactor = 1.0; // Normal
	}

	// Combined environmental factors
	const environmentalSpeedFactor = weatherSpeedFactor * trackSpeedFactor;
	const environmentalStaminaFactor = weatherStaminaFactor * trackStaminaFactor;

	// Allocate target finish offsets: favourites slightly shorter, outsiders longer.
	// We derive per-runner "strength" s in (0,1): s = (p - pMin)/(pMax - pMin), then map to time bias.
	const probs = input.runners.map(r => pMap.get(r.id)!);
	const pMin = Math.min(...probs);
	const pMax = Math.max(...probs);

	const finishTimeMs: Record<string, number> = {};
	for (const r of input.runners) {
		const p = pMap.get(r.id)!;
		const s = pMax === pMin ? 0.5 : (p - pMin) / (pMax - pMin); // 0..1
		// Bias factor: favourites (s→1) finish ~7–12% faster on average; outsiders slower.
		const bias = 1 - (0.12 * s) + (0.06 * (1 - s));
		// Random noise scaled by inverse strength (outsiders more volatile)
		const noise = gaussian(rand, 0, 0.025 + (0.035 * (1 - s)));
		// Clamp bias+noise to reasonable band
		const mult = Math.min(1.18, Math.max(0.82, bias * (1 + noise)));
		// Apply environmental factors to finish times
		finishTimeMs[r.id] = Math.round(tTotalMs * mult / environmentalSpeedFactor);
	}

	// Pace parameters per runner
	const paceParams: Record<string, { accel: number; kick: number; jitter: number; stamina: number }> = {};
	for (const r of input.runners) {
		const p = pMap.get(r.id)!;
		const s = pMax === pMin ? 0.5 : (p - pMin) / (pMax - pMin);
		const accel = 0.22 + 0.10 * s + (rand() - 0.5) * 0.04; // favourites jump well
		const kick = 0.16 + 0.08 * s + (rand() - 0.5) * 0.04;  // favourites stronger late
		const jitter = 0.006 + (1 - s) * 0.012; // outsiders wobble more
		// Stamina factor - favourites have better stamina, adjusted by environmental factors
		const stamina = clamp01((0.8 + 0.2 * s + (rand() - 0.5) * 0.1) * environmentalStaminaFactor);
		paceParams[r.id] = { accel: clamp01(accel), kick: clamp01(kick), jitter, stamina: clamp01(stamina) };
	}

	// State
	let status: SimStatus = 'pending';
	let tStart = 0;
	let tElapsed = 0;
	let timer: number | null = null;
	const tickHandlers: Array<(t: Tick) => void> = [];
	const finishHandlers: Array<(r: Result) => void> = [];

	function computeProgress(runnerId: string, elapsed: number): number {
		const total = finishTimeMs[runnerId];
		const u = clamp01(elapsed / total);
		const { accel, kick, jitter, stamina } = paceParams[runnerId];
		let base = paceCurve(u, accel, kick, stamina);
		// Add small seeded jitter (stationary mean, bounded)
		const j = (gaussian(rand, 0, jitter) * (1 - u)); // less jitter near finish
		// Add fatigue factor - runners slow down as race progresses, adjusted by environmental factors
		const fatigue = Math.max(0.7, 1 - (u * 0.3 * environmentalStaminaFactor)); // Up to 30% slower at end
		return clamp01((base + j) * fatigue);
	}

	function emitTick(): void {
		tElapsed = Date.now() - tStart;
		const progressByRunner: Record<string, number> = {};
		for (const r of input.runners) {
			progressByRunner[r.id] = computeProgress(r.id, tElapsed);
		}
		// Order by progress desc; break ties by lower finish time (faster horse) then number
		const order = [...input.runners]
			.sort((a, b) => {
				const pa = progressByRunner[a.id];
				const pb = progressByRunner[b.id];
				if (pb !== pa) return pb - pa;
				const fa = finishTimeMs[a.id];
				const fb = finishTimeMs[b.id];
				if (fa !== fb) return fa - fb;
				return a.number - b.number;
			})
			.map(r => r.id);

		const leaderProgress = progressByRunner[order[0]];
		const gaps: Record<string, number> = {};
		for (const id of Object.keys(progressByRunner)) {
			gaps[id] = Math.max(0, leaderProgress - progressByRunner[id]);
		}

		const etaMs = Math.max(0, Math.max(...Object.keys(finishTimeMs).map(id => finishTimeMs[id])) - tElapsed);

		const tick: Tick = {
			raceId: input.id,
			tElapsedMs: Math.min(tElapsed, tTotalMs),
			tTotalMs,
			progressByRunner,
			order,
			gaps,
			etaMs,
			status
		};

		for (const h of tickHandlers) h(tick);

		// End condition: everyone >= 1 or elapsed beyond max planned + safety buffer
		const allDone = Object.values(progressByRunner).every(v => v >= 0.999);
		const overtime = tElapsed > Math.max(...Object.values(finishTimeMs)) + 1000;
		if (allDone || overtime) finalize();
	}

	function finalize(): void {
		if (timer != null) {
			clearInterval(timer);
			timer = null;
		}
		status = 'finished';
		// Build placings by simulated finish time with tiny tie-break using last progress tick
		const order = Object.keys(finishTimeMs).sort((a, b) => finishTimeMs[a] - finishTimeMs[b]);
		const res: Result = {
			raceId: input.id,
			placings: order,
			finishTimesMs: { ...finishTimeMs },
			status,
			seed
		};
		for (const h of finishHandlers) h(res);
	}

	return {
		start() {
			if (status !== 'pending') return;
			status = 'running';
			tStart = Date.now();
			tElapsed = 0;
			timer = setInterval(emitTick, Math.max(50, tickMs)) as unknown as number;
			// Emit first tick instantly for snappy UI
			emitTick();
		},
		stop() {
			if (timer != null) {
				clearInterval(timer);
				timer = null;
			}
			if (status === 'running') status = 'aborted';
		},
		onTick(cb: (tick: Tick) => void) {
			tickHandlers.push(cb);
		},
		onFinish(cb: (res: Result) => void) {
			finishHandlers.push(cb);
		},
		getSeed() { return seed; },
		getPlannedDurationMs() { return tTotalMs; }
	};
}

/* ------------------------------- Usage Notes ------------------------------ */
/*
Example wiring (Vue 3 / Pinia sketch):

const sim = createRaceSimulation({
  id: 'SIM_WARRAGUL_R12',
  meetingName: 'Warragul',
  raceNumber: 12,
  categoryId: '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
  runners: [
	{ id: 'r1', number: 1, name: 'Got Immunity', decimalOdds: 2.4 },
	{ id: 'r2', number: 2, name: 'She\'s Our Art', decimalOdds: 3.4 },
	{ id: 'r3', number: 3, name: 'Disco Gizmo', decimalOdds: 6.0 },
	{ id: 'r4', number: 4, name: 'Rumour Not Fact', decimalOdds: 11.0 },
	{ id: 'r5', number: 5, name: 'Daintree Granite', decimalOdds: 13.0 }
  ]
}, 123456, 200);

sim.onTick(t => {
  // Update UI with t.progressByRunner[runnerId] (0..1) and t.order/gaps.
});

sim.onFinish(res => {
  // Show placings, times, confetti, etc.
});

sim.start();

*/