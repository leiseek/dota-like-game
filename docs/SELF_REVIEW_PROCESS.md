---
doc_id: SELF_REVIEW_PROCESS
version: 0.1.0
status: active
owner_agent: Self Review Agent
last_updated: 2026-06-23
change_summary: Self Review Gate process
---

# Self Review Process

The project uses SRG: Self Review Gate.

Every design, code, UI, level, and balance proposal must pass Self Review before being considered complete.

## Core Flow

```text
Agent output
↓
Agent self-review
↓
Cross-agent review
↓
Self Review Agent risk mark
↓
Team Leader summary
↓
Revision
↓
Next phase
```

## Review Layers

| Review | Owner | Focus |
|---|---|---|
| Product Review | Producer + Game Director | MVP fit and core experience |
| Gameplay Review | Game Director + Combat + Level | fun, clarity, comeback moments |
| UX Review | UX/UI + QA | usability, readability, mobile interaction |
| Technical Review | Architect + Engineering | feasibility, serialization, portability |
| Code Review | Engineering + Architect | readability, testability, coupling |
| Balance Review | Combat + QA | difficulty, values, dominant strategy |
| Release Review | Producer + QA + Platform | playable flow and release risk |

## Fast Review Format

```text
Review Result: Pass / Need Changes / Reject
Main Issues:
Required Changes:
Risk Level: Low / Medium / High
```

## Deep Review Format

```text
Review Target:
Owner Agent:
Review Agents:
Summary:
Strengths:
Issues:
Risks:
Required Changes:
Acceptance Criteria:
Decision:
```

## Universal Checklist

### MVP Scope

- [ ] Does it serve the core experience?
- [ ] Must it be in Demo 0.1?
- [ ] Can it be delayed?
- [ ] Does it add too much complexity?
- [ ] Are acceptance criteria clear?

### Gameplay

- [ ] Does the player know the goal?
- [ ] Does the player know why they failed?
- [ ] Do skills create rescue value?
- [ ] Do heroes combo?
- [ ] Are enemies differentiated?
- [ ] Is there comeback potential?

### UX

- [ ] Is it easy to tap on mobile?
- [ ] Is information clear?
- [ ] Is there mis-tap risk?
- [ ] Are pause and speed easy to find?
- [ ] Is skill casting intuitive?
- [ ] Does tutorial text interrupt too much?

### Tech

- [ ] Is GameState the single source of truth?
- [ ] Is state serializable?
- [ ] Does it support exit resume?
- [ ] Does it support fixed tick?
- [ ] Does it support 10x?
- [ ] Is it platform-neutral?

### QA

- [ ] Can the run start and end?
- [ ] Does pause/resume work?
- [ ] Does exit/resume work?
- [ ] Is 10x stable?
- [ ] Do enemies get stuck?
- [ ] Do projectiles miss incorrectly?
