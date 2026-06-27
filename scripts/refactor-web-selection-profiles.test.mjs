import assert from "node:assert/strict";
import test from "node:test";

import { transformSelectionProfileSource } from "./refactor-web-selection-profiles.mjs";

test("selection profile codemod extracts duplicated profile data", () => {
  const input = `import {
  type Enemy,
} from "../../dist/game-core/index.js";

type EnemyStatusEffect = NonNullable<Enemy["statusEffects"]>[number];
type EnemyStatusBadge = Readonly<{ text: string; color: string }>;
type SelectionProfile = Readonly<{ role: string; summary: string; special: string; tips: string }>;

const HERO_DISPLAY_NAMES: Record<string, string> = {
  "hook-guardian": "钩锁守卫",
};

const ENEMY_DISPLAY_NAMES: Record<string, string> = {
  runner: "试炼行者",
};

const HERO_PROFILES: Record<string, SelectionProfile> = {
  "hook-guardian": {
    role: "控制",
    summary: "说明",
    special: "大招",
    tips: "提示",
  },
};

const ENEMY_PROFILES: Record<string, SelectionProfile> = {
  runner: {
    role: "步兵",
    summary: "说明",
    special: "无",
    tips: "提示",
  },
};

const STATUS_LABELS: Record<EnemyStatusEffect["type"], EnemyStatusBadge> = {
  slow: { text: "减速", color: "#bff8ff" },
};

function renderStatus(statusEffect: EnemyStatusEffect): EnemyStatusBadge {
  const badge = STATUS_LABELS[statusEffect.type];
  return badge;
}

function heroName(archetype: string): string {
  return HERO_DISPLAY_NAMES[archetype] ?? archetype;
}

function enemyName(archetype: string): string {
  return ENEMY_DISPLAY_NAMES[archetype] ?? archetype;
}

function heroProfile(archetype: string): SelectionProfile {
  return HERO_PROFILES[archetype] ?? { role: "未知英雄", summary: "", special: "", tips: "" };
}

function enemyProfile(archetype: string): SelectionProfile {
  return ENEMY_PROFILES[archetype] ?? { role: "未知敌人", summary: "", special: "", tips: "" };
}

function statusEffectName(statusEffect: EnemyStatusEffect): string {
  return STATUS_LABELS[statusEffect.type].text;
}
`;

  const output = transformSelectionProfileSource(input);

  assert.match(output, /from "\.\/profiles\/selection-profiles\.js";/);
  assert.match(output, /type EnemyStatusBadge,/);
  assert.doesNotMatch(output, /const HERO_DISPLAY_NAMES/);
  assert.doesNotMatch(output, /const ENEMY_DISPLAY_NAMES/);
  assert.doesNotMatch(output, /const HERO_PROFILES/);
  assert.doesNotMatch(output, /const ENEMY_PROFILES/);
  assert.doesNotMatch(output, /const STATUS_LABELS/);
  assert.doesNotMatch(output, /function heroName/);
  assert.doesNotMatch(output, /function enemyName/);
  assert.doesNotMatch(output, /function heroProfile/);
  assert.doesNotMatch(output, /function enemyProfile/);
  assert.doesNotMatch(output, /function statusEffectName/);
  assert.match(output, /const badge = statusBadgeFor\(statusEffect\.type\);/);
  assert.match(output, /function renderStatus/);
});

test("selection profile codemod is idempotent after extraction", () => {
  const input = `import {
  type Enemy,
} from "../../dist/game-core/index.js";
import {
  enemyName,
  enemyProfile,
  heroName,
  heroProfile,
  statusBadgeFor,
  statusEffectName,
  type EnemyStatusBadge,
} from "./profiles/selection-profiles.js";

function renderStatus(statusEffect: NonNullable<Enemy["statusEffects"]>[number]): EnemyStatusBadge {
  const badge = statusBadgeFor(statusEffect.type);
  return badge;
}
`;

  assert.equal(transformSelectionProfileSource(input), input);
});
