---
doc_id: DECISIONS
version: 0.4.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: ADR-0006 accepted for Web Playtest Preview
---

# Decision Log

## ADR-0001: Adopt AI Native Agent Team

- Date: 2026-06-23
- Status: Accepted

### Decision

Use an AI Native Studio model. Project Owner provides direction and key approvals. Team Leader Agent coordinates specialist AI Agents, documents, tasks, reviews, and delivery.

### Impact

All major outputs must include owner agent, version, status, and Self Review result.

---

## ADR-0002: Adopt core-first cross-platform architecture

- Date: 2026-06-23
- Status: Accepted

### Decision

Battle logic must be platform-neutral in `game-core`. HarmonyOS and WeChat Mini Game are platform adapters.

### Impact

No battle-result logic may be hardcoded inside ArkUI, Canvas, WeChat APIs, or platform lifecycle code.

---

## ADR-0003: Pause, resume, exit recovery, and speed are MVP P0

- Date: 2026-06-23
- Status: Accepted

### Decision

The MVP must support pause/resume, exit-and-resume via Battle Snapshot, and speed controls at 1x/2x/5x/10x.

### Impact

Architecture must support fixed tick, serializable GameState, and deterministic progression.

---

## ADR-0004: Phase 1 implementation order

- Date: 2026-06-23
- Status: Accepted

### Decision

Phase 1 starts with GameState, GameAction, GameClock, SeededRandom, map config, then enemy movement and tower combat.

### Rationale

Pause, speed, and resume are foundational; implementing combat first would create refactor risk.

---

## ADR-0005: Use repository docs as Codex context

- Date: 2026-06-23
- Status: Accepted

### Decision

Codex should use repository files as durable context:

- `AGENTS.md` for project-level instructions;
- `docs/CODEX_HANDOFF.md` for task handoff;
- `docs/` for versioned product, architecture, and review docs.

### Rationale

Chat context does not reliably transfer to Codex. Versioned repository docs are auditable, persistent, and reviewable.

### Impact

Every coding task must read `AGENTS.md` first and update docs as part of completion.

---

## ADR-0006: Build Web Playtest Preview before platform-native shells

- Date: 2026-06-24
- Status: Accepted

### Decision

Create a lightweight `platform-web` shell before HarmonyOS or WeChat platform shells.

The Web shell is a playable/debug preview for Demo 0.1. It renders `GameState`, dispatches `GameAction`, uses fixed-step advancement through `stepSimulation`, and stores local Battle Snapshots through core snapshot helpers.

### Rationale

The project now has enough platform-neutral core code to validate the gameplay loop visually. A Web Preview is the fastest way to evaluate map readability, 10x speed behavior, skill targeting, crystal theft feedback, and save/continue behavior without compromising the cross-platform architecture.

### Impact

- `platform-web` may use DOM, Canvas, CSS, and `localStorage`.
- `src/game-core` must remain platform-neutral.
- The Web shell is not the final product UI and must not introduce authoritative battle state outside the core.
- Future `SKILL-002`, `CRYSTAL-001`, and `SETTLEMENT-001` work should be validated through Web Preview when useful.
