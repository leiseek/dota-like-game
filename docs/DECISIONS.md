---
doc_id: DECISIONS
version: 0.3.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-23
change_summary: key architecture and workflow decisions through ADR-0005
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
