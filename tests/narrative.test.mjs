// Phase 05-01 (STORY-04/STORY-05): pure-module contract for buildNarrative(data).
// These assertions go GREEN this plan — js/ui/narrative.js is the deliverable.
// No DOM, no d3: buildNarrative is a pure data->step-list function imported in Node.

import test from "node:test";
import assert from "node:assert/strict";
import { buildNarrative, createHeroController } from "../js/ui/narrative.js";

// A tiny fake dataset. Two layers (y=0 dominant with 3 nodes, y=1 with 1),
// two bottlenecks (bn:true), and a clear highest-marketcap-and-bn node (BBB).
function fixtureA() {
  return {
    meta: { count: 4, source: "companiesmarketcap.com" },
    layers: { "0": "Semiconductors & Components", "1": "Software & Platforms" },
    nodes: [
      { symbol: "AAA", company: "Alpha", marketcap: 1_000_000_000_000, rank: 3, bn: true, y: 0 },
      { symbol: "BBB", company: "Beta", marketcap: 3_000_000_000_000, rank: 1, bn: true, y: 0 },
      { symbol: "CCC", company: "Gamma", marketcap: 2_000_000_000_000, rank: 2, bn: false, y: 0 },
      { symbol: "DDD", company: "Delta", marketcap: 500_000_000_000, rank: 4, bn: false, y: 1 },
    ],
  };
}

// A DIFFERENT dataset: different combined cap, different bn count, different count.
function fixtureB() {
  return {
    meta: { count: 2, source: "companiesmarketcap.com" },
    layers: { "5": "Healthcare & Life Sciences", "1": "Software & Platforms" },
    nodes: [
      { symbol: "ZZZ", company: "Zeta", marketcap: 7_000_000_000_000, rank: 1, bn: true, y: 5 },
      { symbol: "YYY", company: "Yotta", marketcap: 1_000_000_000_000, rank: 2, bn: false, y: 1 },
    ],
  };
}

function spyControls() {
  const calls = [];
  return {
    calls,
    openGlobal: () => calls.push({ name: "openGlobal", args: [] }),
    openProfile: (symbol) => calls.push({ name: "openProfile", args: [symbol] }),
    highlightBy: (fn) => calls.push({ name: "highlightBy", args: [fn] }),
    resetHighlight: () => calls.push({ name: "resetHighlight", args: [] }),
  };
}

test("buildNarrative returns 4 steps ordered market -> concentration -> risk -> opportunity", () => {
  const steps = buildNarrative(fixtureA());
  assert.equal(steps.length, 4, "expected exactly 4 steps");
  assert.deepEqual(
    steps.map((s) => s.id),
    ["market", "concentration", "risk", "opportunity"],
    "step ids must be in narrative order",
  );
});

test("every step has a non-empty title, non-empty caption, and a function apply", () => {
  for (const s of buildNarrative(fixtureA())) {
    assert.equal(typeof s.title, "string", `${s.id} title must be a string`);
    assert.ok(s.title.trim().length > 0, `${s.id} title must be non-empty`);
    assert.equal(typeof s.caption, "string", `${s.id} caption must be a string`);
    assert.ok(s.caption.trim().length > 0, `${s.id} caption must be non-empty`);
    assert.equal(typeof s.apply, "function", `${s.id} apply must be a function`);
  }
});

test("each step.apply calls the correct injected control", () => {
  const [market, concentration, risk, opportunity] = buildNarrative(fixtureA());

  const c1 = spyControls();
  market.apply(c1);
  assert.deepEqual(c1.calls.map((x) => x.name), ["openGlobal"], "market -> openGlobal");

  const c2 = spyControls();
  concentration.apply(c2);
  assert.deepEqual(c2.calls.map((x) => x.name), ["highlightBy"], "concentration -> highlightBy");

  const c3 = spyControls();
  risk.apply(c3);
  assert.deepEqual(c3.calls.map((x) => x.name), ["highlightBy"], "risk -> highlightBy");

  const c4 = spyControls();
  opportunity.apply(c4);
  assert.deepEqual(c4.calls.map((x) => x.name), ["openProfile"], "opportunity -> openProfile");
  // The opportunity symbol must be the highest-marketcap node that is also bn (BBB),
  // NOT the global highest (BBB happens to be both here) and NOT a literal.
  assert.equal(c4.calls[0].args[0], "BBB", "opportunity must open the top-cap bottleneck symbol");
});

test("risk.apply predicate selects exactly the bn nodes", () => {
  const [, , risk] = buildNarrative(fixtureA());
  const c = spyControls();
  risk.apply(c);
  const predicate = c.calls[0].args[0];
  assert.equal(typeof predicate, "function", "highlightBy must receive a predicate fn");
  assert.equal(predicate({ bn: true }), true);
  assert.equal(predicate({ bn: false }), false);
});

test("concentration.apply predicate selects the dominant layer index", () => {
  const [, concentration] = buildNarrative(fixtureA());
  const c = spyControls();
  concentration.apply(c);
  const predicate = c.calls[0].args[0];
  assert.equal(typeof predicate, "function", "highlightBy must receive a predicate fn");
  // Dominant layer in fixtureA is y=0 (3 nodes).
  assert.equal(predicate({ y: 0 }), true);
  assert.equal(predicate({ y: 1 }), false);
});

test("captions are computed from the data fixture, not hardcoded literals", () => {
  const a = buildNarrative(fixtureA());
  const b = buildNarrative(fixtureB());

  const marketA = a[0].caption;
  const marketB = b[0].caption;
  const riskA = a[2].caption;
  const riskB = b[2].caption;

  // Different fixtures (different combined cap + count + bn counts) MUST yield
  // different captions — proves recomputation, not a constant string.
  assert.notEqual(marketA, marketB, "market caption must differ across fixtures");
  assert.notEqual(riskA, riskB, "risk caption must differ across fixtures");

  // The market caption must contain the fixture-derived combined cap and meta.count.
  // fixtureA: (1+3+2+0.5)T = 6.5T -> "6.5", count 4.
  assert.match(marketA, /6\.5/, "market caption must contain fixtureA combined cap (6.5T)");
  assert.match(marketA, /\b4\b/, "market caption must contain fixtureA meta.count (4)");
  // fixtureB: (7+1)T = 8.0T -> "8.0", count 2.
  assert.match(marketB, /8\.0/, "market caption must contain fixtureB combined cap (8.0T)");
  assert.match(marketB, /\b2\b/, "market caption must contain fixtureB meta.count (2)");

  // Risk caption reflects the bn count of each fixture (A: 2 bn, B: 1 bn).
  assert.match(riskA, /\b2\b/, "risk caption must contain fixtureA bn count (2)");
  assert.match(riskB, /\b1\b/, "risk caption must contain fixtureB bn count (1)");
});

test("opportunity prefers the highest-marketcap bottleneck, falling back to top cap when none flagged", () => {
  // No bn nodes flagged -> falls back to global highest marketcap (PQR).
  const data = {
    meta: { count: 2, source: "companiesmarketcap.com" },
    layers: { "0": "Semiconductors & Components" },
    nodes: [
      { symbol: "PQR", company: "Pqr", marketcap: 5_000_000_000_000, rank: 1, bn: false, y: 0 },
      { symbol: "STU", company: "Stu", marketcap: 2_000_000_000_000, rank: 2, bn: false, y: 0 },
    ],
  };
  const opportunity = buildNarrative(data)[3];
  const c = spyControls();
  opportunity.apply(c);
  assert.equal(c.calls[0].args[0], "PQR", "fallback to highest-marketcap overall when no bn node");
});

// ---------------------------------------------------------------------------
// createHeroController — autoplay/stepper state machine (Plan 02, STORY-02).
// Every side-effect is injected: fake timers/storage/reducedMotion/controls/render.
// These run DOM-free in Node — no real timers, no window, no document.
// ---------------------------------------------------------------------------

// A fake `timers` object: setTimeout records the callback (does NOT fire it),
// returns an incrementing id; fireTimer() invokes the LAST recorded callback
// (mirrors the chained scheduleNext re-arm); clearTimeout marks an id cleared.
function fakeTimers() {
  let nextId = 0;
  const scheduled = []; // { id, fn, delay, cleared }
  return {
    scheduled,
    setTimeout(fn, delay) {
      const id = ++nextId;
      scheduled.push({ id, fn, delay, cleared: false });
      return id;
    },
    clearTimeout(id) {
      const entry = scheduled.find((s) => s.id === id);
      if (entry) entry.cleared = true;
    },
    // Number of setTimeout calls made so far.
    get scheduledCount() {
      return scheduled.length;
    },
    // The most recently scheduled (live) callback.
    last() {
      return scheduled[scheduled.length - 1];
    },
    // Fire the last scheduled callback if it hasn't been cleared.
    fireTimer() {
      const entry = this.last();
      if (entry && !entry.cleared) entry.fn();
    },
  };
}

// A fake `storage`: in-memory map + a writes log of [key, value] tuples.
function fakeStorage(initial = {}) {
  const map = { ...initial };
  const writes = [];
  return {
    map,
    writes,
    read: (key) => (key in map ? map[key] : null),
    write: (key, value) => {
      map[key] = value;
      writes.push([key, value]);
    },
  };
}

// A fake `render`: records every (step, index, total) tuple it receives.
function fakeRender() {
  const calls = [];
  const fn = (step, index, total) => calls.push({ step, index, total });
  fn.calls = calls;
  return fn;
}

// Build a controller wired to deterministic fakes. reducedMotion defaults false.
function makeController({ reduced = false, storageInit = {} } = {}) {
  const steps = buildNarrative(fixtureA());
  const controls = spyControls();
  const storage = fakeStorage(storageInit);
  const timers = fakeTimers();
  const render = fakeRender();
  const reducedMotion = () => reduced;
  const ctrl = createHeroController({ steps, controls, storage, reducedMotion, timers, render });
  return { ctrl, steps, controls, storage, timers, render };
}

test("controller: play() shows step 0 and schedules an auto-advance timer", () => {
  const { ctrl, timers, render } = makeController();
  ctrl.play();
  assert.equal(ctrl.getIndex(), 0, "play starts at step 0");
  assert.equal(timers.scheduledCount, 1, "play schedules exactly one timer");
  assert.equal(render.calls[0].index, 0, "render invoked with step index 0");
  assert.equal(render.calls[0].total, 4, "render receives total step count");
  assert.ok(render.calls[0].step && render.calls[0].step.id === "market", "first rendered step is market");
});

test("controller: firing the timer auto-advances 0 -> 1 and re-schedules", () => {
  const { ctrl, timers } = makeController();
  ctrl.play();
  timers.fireTimer();
  assert.equal(ctrl.getIndex(), 1, "auto-advance moved to step 1");
  assert.equal(timers.scheduledCount, 2, "a new timer was scheduled after advancing");
});

test("controller: autoplay through the last step stops and writes heroSeen", () => {
  const { ctrl, timers, storage, render } = makeController();
  ctrl.play();
  // 4 steps (indices 0..3). Fire the timer 3 times to reach the last step,
  // then once more to trigger stop() at the end.
  timers.fireTimer(); // -> 1
  timers.fireTimer(); // -> 2
  timers.fireTimer(); // -> 3 (last)
  assert.equal(ctrl.getIndex(), 3, "reached the final step via autoplay");
  timers.fireTimer(); // at last step -> stop()
  assert.deepEqual(
    storage.writes.find((w) => w[0] === "heroSeen"),
    ["heroSeen", "1"],
    "end of autoplay writes heroSeen=1",
  );
  assert.equal(render.calls[render.calls.length - 1].step, null, "overlay cleared via render(null) at end");
});

test("controller: pause() clears the timer so no further auto-advance occurs", () => {
  const { ctrl, timers } = makeController();
  ctrl.play();
  const before = ctrl.getIndex();
  ctrl.pause();
  // The previously scheduled timer must be marked cleared; firing it is a no-op.
  timers.fireTimer();
  assert.equal(ctrl.getIndex(), before, "index unchanged after pause + fire");
});

test("controller: next() advances and pauses auto-advance", () => {
  const { ctrl, timers } = makeController();
  ctrl.play();
  ctrl.next();
  assert.equal(ctrl.getIndex(), 1, "next moved to step 1");
  // The original autoplay timer should be cleared by next()'s pause; firing is a no-op.
  timers.fireTimer();
  assert.equal(ctrl.getIndex(), 1, "no auto-advance after manual next");
});

test("controller: prev() decrements and respects the lower bound", () => {
  const { ctrl } = makeController();
  ctrl.play();
  ctrl.next(); // -> 1
  ctrl.prev(); // -> 0
  assert.equal(ctrl.getIndex(), 0, "prev returned to step 0");
  ctrl.prev(); // already at 0
  assert.equal(ctrl.getIndex(), 0, "prev never goes negative");
});

test("controller: next() at the last step triggers stop teardown", () => {
  const { ctrl, storage, controls, render } = makeController();
  ctrl.play();
  ctrl.next(); // 1
  ctrl.next(); // 2
  ctrl.next(); // 3 (last)
  ctrl.next(); // beyond last -> stop()
  assert.deepEqual(
    storage.writes.find((w) => w[0] === "heroSeen"),
    ["heroSeen", "1"],
    "next past the last step writes heroSeen=1",
  );
  assert.ok(
    controls.calls.some((x) => x.name === "resetHighlight"),
    "stop resets the highlight",
  );
  assert.equal(render.calls[render.calls.length - 1].step, null, "stop clears the overlay");
});

test("controller: skip() writes heroSeen, resets highlight, and renders null", () => {
  const { ctrl, storage, controls, render } = makeController();
  ctrl.play();
  ctrl.skip();
  assert.deepEqual(
    storage.writes.find((w) => w[0] === "heroSeen"),
    ["heroSeen", "1"],
    "skip writes heroSeen=1",
  );
  const resets = controls.calls.filter((x) => x.name === "resetHighlight");
  assert.equal(resets.length, 1, "skip calls resetHighlight exactly once");
  assert.equal(render.calls[render.calls.length - 1].step, null, "skip clears the overlay (render(null))");
});

test("controller: reduced-motion suppresses the auto-advance timer", () => {
  const { ctrl, timers, render } = makeController({ reduced: true });
  ctrl.play();
  assert.equal(timers.scheduledCount, 0, "reduced-motion schedules ZERO timers");
  assert.equal(render.calls[0].index, 0, "reduced-motion still renders step 0");
});

test("controller: reduced-motion still allows manual next()", () => {
  const { ctrl, timers, render } = makeController({ reduced: true });
  ctrl.play();
  ctrl.next();
  assert.equal(ctrl.getIndex(), 1, "manual next advances under reduced motion");
  assert.equal(timers.scheduledCount, 0, "still no timer scheduled under reduced motion");
  assert.equal(render.calls[render.calls.length - 1].index, 1, "render reflects the manual advance");
});

test("controller: replay — play() runs even when heroSeen is already '1'", () => {
  const { ctrl, render } = makeController({ storageInit: { heroSeen: "1" } });
  ctrl.play();
  assert.equal(ctrl.getIndex(), 0, "replay restarts from step 0 regardless of stored heroSeen");
  assert.ok(render.calls.length >= 1, "replay renders the overlay again");
});
