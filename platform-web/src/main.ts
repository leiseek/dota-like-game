import {
  createInitialGameState,
  createSnapshot,
  enqueueAction,
  level001Config,
  restoreSnapshot,
  selectHudState,
  stepSimulation,
  type Enemy,
  type GameAction,
  type GameSnapshot,
  type GameState,
  type Hero,
  type TowerSlotState,
  type Vector2,
} from "../../dist/game-core/index.js";

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const MAX_SUB_STEPS_PER_FRAME = 12;
const SNAPSHOT_KEY = "ancient-defense:web-preview:snapshot";
const DEFAULT_HERO_ARCHETYPE = "hook-guardian";

const HERO_OPTIONS = [
  DEFAULT_HERO_ARCHETYPE,
  "frost-priestess",
  "storm-sigilist",
  "moonblade-ranger",
] as const;

const SPEED_CYCLE = [1, 2, 5, 10] as const;

const canvas = mustGet<HTMLCanvasElement>("battle-canvas");
const context = mustGetContext(canvas);
const heroSelect = mustGet<HTMLSelectElement>("hero-select");
const messageElement = mustGet<HTMLElement>("message");
const startButton = mustGet<HTMLButtonElement>("start-button");
const pauseButton = mustGet<HTMLButtonElement>("pause-button");
const speedButton = mustGet<HTMLButtonElement>("speed-button");
const waveButton = mustGet<HTMLButtonElement>("wave-button");
const saveButton = mustGet<HTMLButtonElement>("save-button");
const resumeButton = mustGet<HTMLButtonElement>("resume-button");
const abandonButton = mustGet<HTMLButtonElement>("abandon-button");

let gameState: GameState = createInitialGameState(level001Config);
let selectedHeroId: string | undefined;
let selectedHeroArchetype: (typeof HERO_OPTIONS)[number] = DEFAULT_HERO_ARCHETYPE;
let lastTimestamp = performance.now();
let accumulatorMs = 0;

startButton.addEventListener("click", () => dispatch({ type: "START" }));
pauseButton.addEventListener("click", () => {
  dispatch(gameState.clock.paused ? { type: "RESUME" } : { type: "PAUSE" });
});
speedButton.addEventListener("click", () => {
  const currentIndex = SPEED_CYCLE.indexOf(gameState.clock.speed);
  const nextSpeed = SPEED_CYCLE[(currentIndex + 1) % SPEED_CYCLE.length] ?? 1;
  dispatch({ type: "SET_SPEED", speed: nextSpeed });
});
waveButton.addEventListener("click", () => dispatch({ type: "START_NEXT_WAVE" }));
saveButton.addEventListener("click", saveAndExit);
resumeButton.addEventListener("click", continueSavedBattle);
abandonButton.addEventListener("click", abandonSavedBattle);
heroSelect.addEventListener("change", () => {
  selectedHeroArchetype = parseHeroArchetype(heroSelect.value);
  setMessage(`Selected build: ${selectedHeroArchetype}`);
});
canvas.addEventListener("click", handleCanvasClick);

syncUi();
requestAnimationFrame(runFrame);

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

function mustGetContext(targetCanvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const canvasContext = targetCanvas.getContext("2d");
  if (!canvasContext) throw new Error("Canvas 2D context is not available");
  return canvasContext;
}

function parseHeroArchetype(value: string): (typeof HERO_OPTIONS)[number] {
  return HERO_OPTIONS.find((candidate) => candidate === value) ?? DEFAULT_HERO_ARCHETYPE;
}

function dispatch(action: GameAction): void {
  gameState = stepSimulation(enqueueAction(gameState, action), 0, level001Config);
  syncUi();
}

function runFrame(timestamp: number): void {
  const realDeltaMs = Math.min(250, timestamp - lastTimestamp);
  lastTimestamp = timestamp;
  accumulatorMs += realDeltaMs;

  let subStepCount = 0;
  while (accumulatorMs >= level001Config.fixedDeltaMs && subStepCount < MAX_SUB_STEPS_PER_FRAME) {
    gameState = stepSimulation(gameState, 1, level001Config);
    accumulatorMs -= level001Config.fixedDeltaMs;
    subStepCount += 1;
  }

  if (subStepCount === MAX_SUB_STEPS_PER_FRAME) {
    accumulatorMs = 0;
  }

  render();
  syncUi();
  requestAnimationFrame(runFrame);
}

function handleCanvasClick(event: MouseEvent): void {
  const point = toLogicalPoint(event);
  const clickedHero = findHeroAt(point);
  if (clickedHero) {
    selectedHeroId = clickedHero.id;
    setMessage(`Selected hero: ${clickedHero.archetype}`);
    syncUi();
    return;
  }

  const clickedEnemy = findEnemyAt(point);
  if (clickedEnemy) {
    if (!selectedHeroId) {
      setMessage("Select a hero before casting an active skill.");
      return;
    }
    dispatch({ type: "CAST_SKILL", heroId: selectedHeroId, targetEnemyId: clickedEnemy.id });
    setMessage(`Cast skill on ${clickedEnemy.archetype}.`);
    return;
  }

  const clickedSlot = findTowerSlotAt(point);
  if (clickedSlot) {
    if (!clickedSlot.unlocked) {
      setMessage("This tower slot is locked by an obstacle.");
      return;
    }
    if (clickedSlot.occupiedByHeroId) {
      selectedHeroId = clickedSlot.occupiedByHeroId;
      setMessage(`Selected hero: ${clickedSlot.occupiedByHeroId}`);
      syncUi();
      return;
    }
    dispatch({ type: "BUILD_HERO", slotId: clickedSlot.id, heroArchetype: selectedHeroArchetype });
    const builtHero = gameState.heroes.find((hero) => hero.slotId === clickedSlot.id);
    if (builtHero) {
      selectedHeroId = builtHero.id;
      setMessage(`Built ${builtHero.archetype} at ${clickedSlot.id}.`);
    } else {
      setMessage(`Could not build ${selectedHeroArchetype}; check gold and slot state.`);
    }
    syncUi();
  }
}

function toLogicalPoint(event: MouseEvent): Vector2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT,
  };
}

function findHeroAt(point: Vector2): Hero | undefined {
  return gameState.heroes.find((hero) => distance(hero.position, point) <= 18);
}

function findEnemyAt(point: Vector2): Enemy | undefined {
  return gameState.enemies.find((enemy) => distance(enemy.position, point) <= 16);
}

function findTowerSlotAt(point: Vector2): TowerSlotState | undefined {
  return gameState.towerSlots.find((slot) => distance(slot.position, point) <= 22);
}

function saveAndExit(): void {
  if (gameState.status === "running") {
    dispatch({ type: "PAUSE" });
  }
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(createSnapshot(gameState)));
  setMessage("Battle snapshot saved locally. Continue it from this browser later.");
  syncUi();
}

function continueSavedBattle(): void {
  const snapshotJson = localStorage.getItem(SNAPSHOT_KEY);
  if (!snapshotJson) {
    setMessage("No saved battle snapshot found.");
    return;
  }

  try {
    const snapshot = JSON.parse(snapshotJson) as GameSnapshot;
    gameState = restoreSnapshot(snapshot);
    selectedHeroId = undefined;
    accumulatorMs = 0;
    setMessage("Saved battle restored into paused state.");
    syncUi();
  } catch {
    localStorage.removeItem(SNAPSHOT_KEY);
    setMessage("Saved battle snapshot was invalid and has been cleared.");
    syncUi();
  }
}

function abandonSavedBattle(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
  setMessage("Saved battle abandoned.");
  syncUi();
}

function syncUi(): void {
  const hud = selectHudState(gameState);
  setText("hud-crystals", `Crystals ${hud.crystals}/${hud.maxCrystals}`);
  setText("hud-gold", `Gold ${hud.gold}`);
  setText("hud-mana", `Mana ${hud.manaCrystal}`);
  setText("hud-wave", `Wave ${hud.wave.currentWave}/${hud.wave.totalWaves}`);
  setText("hud-status", `Status ${hud.status}`);

  startButton.disabled = gameState.status !== "ready";
  pauseButton.textContent = hud.canResume ? "Resume" : "Pause";
  pauseButton.disabled = !hud.canPause && !hud.canResume;
  speedButton.textContent = `Speed ${hud.speed}x`;
  waveButton.disabled = !hud.canStartNextWave;
  resumeButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
  abandonButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
}

function setText(id: string, text: string): void {
  mustGet<HTMLElement>(id).textContent = text;
}

function setMessage(text: string): void {
  messageElement.textContent = text;
}

function render(): void {
  clearCanvas();
  drawMap();
  drawObstacles();
  drawTowerSlots();
  drawHeroes();
  drawEnemies();
  drawOverlayText();
}

function clearCanvas(): void {
  context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  const gradient = context.createLinearGradient(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  gradient.addColorStop(0, "#16301d");
  gradient.addColorStop(1, "#2a2117");
  context.fillStyle = gradient;
  context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}

function drawMap(): void {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(225, 193, 120, 0.22)";
  context.lineWidth = 42;
  strokePath();
  context.strokeStyle = "rgba(89, 64, 36, 0.95)";
  context.lineWidth = 26;
  strokePath();
  context.strokeStyle = "rgba(255, 231, 171, 0.24)";
  context.lineWidth = 2;
  strokePath();
  context.restore();

  const start = level001Config.path[0];
  const end = level001Config.path[level001Config.path.length - 1];
  if (start) drawLabel(start, "Start", "#b7ffb2");
  if (end) drawLabel(end, "Ancient", "#ffd68a");
}

function strokePath(): void {
  context.beginPath();
  level001Config.path.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();
}

function drawTowerSlots(): void {
  for (const slot of gameState.towerSlots) {
    const occupied = Boolean(slot.occupiedByHeroId);
    context.beginPath();
    context.arc(slot.position.x, slot.position.y, 18, 0, Math.PI * 2);
    context.fillStyle = occupied ? "rgba(96, 172, 255, 0.36)" : slot.unlocked ? "rgba(110, 255, 162, 0.22)" : "rgba(255, 255, 255, 0.08)";
    context.strokeStyle = occupied ? "#60acff" : slot.unlocked ? "#6effa2" : "rgba(255,255,255,0.28)";
    context.lineWidth = 3;
    context.fill();
    context.stroke();
    drawLabel({ x: slot.position.x, y: slot.position.y + 32 }, slot.id, "rgba(255,255,255,0.75)");
  }
}

function drawObstacles(): void {
  for (const obstacle of gameState.obstacles) {
    if (obstacle.destroyed) continue;
    context.fillStyle = "rgba(123, 82, 48, 0.9)";
    context.strokeStyle = "rgba(255, 214, 138, 0.55)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(obstacle.position.x - 16, obstacle.position.y - 16, 32, 32, 7);
    context.fill();
    context.stroke();
    drawHealthBar(obstacle.position.x - 20, obstacle.position.y - 26, 40, obstacle.health / obstacle.maxHealth);
  }
}

function drawHeroes(): void {
  for (const hero of gameState.heroes) {
    const selected = hero.id === selectedHeroId;
    const heroConfig = level001Config.heroConfigs?.find((config) => config.archetype === hero.archetype);
    if (selected && heroConfig) {
      context.beginPath();
      context.arc(hero.position.x, hero.position.y, heroConfig.attackRange, 0, Math.PI * 2);
      context.fillStyle = "rgba(96, 172, 255, 0.08)";
      context.strokeStyle = "rgba(96, 172, 255, 0.32)";
      context.lineWidth = 2;
      context.fill();
      context.stroke();
    }

    context.beginPath();
    context.arc(hero.position.x, hero.position.y, selected ? 16 : 13, 0, Math.PI * 2);
    context.fillStyle = selected ? "#9ad1ff" : "#60acff";
    context.strokeStyle = "#f6f0df";
    context.lineWidth = selected ? 3 : 1.5;
    context.fill();
    context.stroke();

    const cooldown = hero.cooldownTicksRemaining > 0 ? ` CD ${hero.cooldownTicksRemaining}` : "";
    drawLabel({ x: hero.position.x, y: hero.position.y - 25 }, `${shortHeroName(hero.archetype)}${cooldown}`, "#dcecff");
  }
}

function drawEnemies(): void {
  for (const enemy of gameState.enemies) {
    context.beginPath();
    context.arc(enemy.position.x, enemy.position.y, enemy.carryingCrystal ? 14 : 11, 0, Math.PI * 2);
    context.fillStyle = enemy.carryingCrystal ? "#ff7a59" : "#ff4f6d";
    context.strokeStyle = enemy.carryingCrystal ? "#ffe28a" : "rgba(255,255,255,0.65)";
    context.lineWidth = enemy.carryingCrystal ? 3 : 1.5;
    context.fill();
    context.stroke();
    drawHealthBar(enemy.position.x - 18, enemy.position.y - 24, 36, enemy.health / enemy.maxHealth);

    if (enemy.carryingCrystal) {
      context.fillStyle = "#ffe28a";
      context.beginPath();
      context.moveTo(enemy.position.x, enemy.position.y - 28);
      context.lineTo(enemy.position.x + 7, enemy.position.y - 20);
      context.lineTo(enemy.position.x, enemy.position.y - 12);
      context.lineTo(enemy.position.x - 7, enemy.position.y - 20);
      context.closePath();
      context.fill();
    }
  }
}

function drawOverlayText(): void {
  context.save();
  context.fillStyle = "rgba(0, 0, 0, 0.34)";
  context.fillRect(16, 456, 480, 68);
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.font = "16px system-ui, sans-serif";
  context.fillText("Click slot: build · Click hero: select · Click enemy: cast skill", 32, 486);
  context.fillText(`Selected hero: ${selectedHeroId ?? "none"}`, 32, 512);
  context.restore();
}

function drawHealthBar(x: number, y: number, width: number, ratio: number): void {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  context.fillStyle = "rgba(0,0,0,0.56)";
  context.fillRect(x, y, width, 5);
  context.fillStyle = clampedRatio > 0.45 ? "#8cff92" : "#ffcf5a";
  context.fillRect(x, y, width * clampedRatio, 5);
}

function drawLabel(point: Vector2, text: string, color: string): void {
  context.save();
  context.fillStyle = color;
  context.font = "13px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(text, point.x, point.y);
  context.restore();
}

function shortHeroName(archetype: string): string {
  return archetype
    .split("-")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
