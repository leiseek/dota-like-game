import type { Enemy, GameAction, GameState } from "./types.js";

const HERO_SKILL_DAMAGE = 25;
const HERO_SKILL_COOLDOWN_TICKS = 10;
const ENEMY_PROGRESS_PER_TICK = 0.05;

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return state.status === "ready"
        ? { ...state, status: "running", clock: { ...state.clock, paused: false } }
        : state;
    case "PAUSE":
      return state.status === "running"
        ? { ...state, status: "paused", clock: { ...state.clock, paused: true } }
        : state;
    case "RESUME":
      return state.status === "paused"
        ? { ...state, status: "running", clock: { ...state.clock, paused: false } }
        : state;
    case "SET_SPEED":
      return { ...state, clock: { ...state.clock, speed: action.speed } };
    case "PLACE_HERO":
      return { ...state, heroes: [...state.heroes, action.hero] };
    case "SPAWN_ENEMY":
      return { ...state, enemies: [...state.enemies, action.enemy] };
    case "CAST_SKILL":
      return castSkill(state, action.heroId, action.targetEnemyId);
  }
}

function castSkill(state: GameState, heroId: string, targetEnemyId: string): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  if (!hero || hero.cooldownTicksRemaining > 0) return state;

  const damagedEnemies = state.enemies.map((enemy) =>
    enemy.id === targetEnemyId ? { ...enemy, health: enemy.health - HERO_SKILL_DAMAGE } : enemy,
  );
  const enemies = damagedEnemies.filter((enemy) => enemy.health > 0);
  const killedCarrier = damagedEnemies.some(
    (enemy) => enemy.id === targetEnemyId && enemy.health <= 0 && enemy.carryingCrystal,
  );

  return {
    ...state,
    crystal: killedCarrier ? { atBase: true } : state.crystal,
    heroes: state.heroes.map((candidate) =>
      candidate.id === heroId ? { ...candidate, cooldownTicksRemaining: HERO_SKILL_COOLDOWN_TICKS } : candidate,
    ),
    enemies,
  };
}

function advanceEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    progress: enemy.progress + (enemy.carryingCrystal ? -ENEMY_PROGRESS_PER_TICK : ENEMY_PROGRESS_PER_TICK),
  };
}

function resolveCrystalAndBase(state: GameState, advancedEnemies: readonly Enemy[]): Pick<GameState, "baseHealth" | "crystal" | "enemies" | "status"> {
  let baseHealth = state.baseHealth;
  let crystal = state.crystal;
  let status = state.status;
  const enemies: Enemy[] = [];

  for (const enemy of advancedEnemies) {
    if (enemy.carryingCrystal && enemy.progress <= 0) {
      status = "lost";
      crystal = { atBase: false, carrierEnemyId: enemy.id };
      enemies.push({ ...enemy, progress: 0 });
      continue;
    }

    if (!enemy.carryingCrystal && enemy.progress >= 1) {
      if (crystal.atBase) {
        const carrier = { ...enemy, progress: 1, carryingCrystal: true };
        crystal = { atBase: false, carrierEnemyId: carrier.id };
        enemies.push(carrier);
      } else {
        baseHealth = Math.max(0, baseHealth - 1);
      }
      continue;
    }

    enemies.push(enemy);
  }

  if (baseHealth === 0) status = "lost";

  return { baseHealth, crystal, enemies, status };
}

function advanceRunningTick(state: GameState): GameState {
  const resolved = resolveCrystalAndBase(state, state.enemies.map(advanceEnemy));

  return {
    ...state,
    ...resolved,
    clock: { ...state.clock, tick: state.clock.tick + 1 },
    heroes: state.heroes.map((hero) => ({
      ...hero,
      cooldownTicksRemaining: Math.max(0, hero.cooldownTicksRemaining - 1),
    })),
  };
}

export function reduceActions(state: GameState): GameState {
  const reduced = state.pendingActions.reduce(applyAction, state);
  return { ...reduced, pendingActions: [] };
}

export function stepFixedTick(state: GameState): GameState {
  const reduced = reduceActions(state);
  if (reduced.clock.paused || reduced.status !== "running") return reduced;
  return advanceRunningTick(reduced);
}

export function stepSimulation(state: GameState, fixedTicks = 1): GameState {
  let nextState = reduceActions(state);
  const ticksToRun = Math.max(0, Math.trunc(fixedTicks)) * nextState.clock.speed;

  for (let index = 0; index < ticksToRun; index += 1) {
    if (nextState.clock.paused || nextState.status !== "running") return nextState;
    nextState = advanceRunningTick(nextState);
  }

  return nextState;
}
