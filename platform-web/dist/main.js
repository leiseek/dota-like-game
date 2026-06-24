import { createInitialGameState, createSnapshot, enqueueAction, level001Config, restoreSnapshot, selectHudState, stepSimulation, } from "../../dist/game-core/index.js";
const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const MAX_SUB_STEPS_PER_FRAME = 12;
const SNAPSHOT_KEY = "ancient-defense:web-preview:snapshot";
const DEFAULT_HERO_ARCHETYPE = "hook-guardian";
const FLOATING_TEXT_DURATION_MS = 900;
const HERO_OPTIONS = [
    DEFAULT_HERO_ARCHETYPE,
    "frost-priestess",
    "storm-sigilist",
    "moonblade-ranger",
];
const SPEED_CYCLE = [1, 2, 5, 10];
const canvas = mustGet("battle-canvas");
const context = mustGetContext(canvas);
const heroSelect = mustGet("hero-select");
const messageElement = mustGet("message");
const startButton = mustGet("start-button");
const pauseButton = mustGet("pause-button");
const speedButton = mustGet("speed-button");
const waveButton = mustGet("wave-button");
const saveButton = mustGet("save-button");
const resumeButton = mustGet("resume-button");
const abandonButton = mustGet("abandon-button");
let gameState = createInitialGameState(level001Config);
let selectedHeroId;
let selectedEnemyId;
let selectedHeroArchetype = DEFAULT_HERO_ARCHETYPE;
let floatingTexts = [];
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
function mustGet(id) {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing #${id}`);
    return element;
}
function mustGetContext(targetCanvas) {
    const canvasContext = targetCanvas.getContext("2d");
    if (!canvasContext)
        throw new Error("Canvas 2D context is not available");
    return canvasContext;
}
function parseHeroArchetype(value) {
    return HERO_OPTIONS.find((candidate) => candidate === value) ?? DEFAULT_HERO_ARCHETYPE;
}
function dispatch(action) {
    setGameState(stepSimulation(enqueueAction(gameState, action), 0, level001Config));
    syncUi();
}
function setGameState(nextState) {
    captureDamageNumbers(gameState, nextState);
    gameState = nextState;
    if (selectedHeroId && !gameState.heroes.some((hero) => hero.id === selectedHeroId)) {
        selectedHeroId = undefined;
    }
    if (selectedEnemyId && !gameState.enemies.some((enemy) => enemy.id === selectedEnemyId)) {
        selectedEnemyId = undefined;
    }
}
function captureDamageNumbers(previousState, nextState) {
    for (const previousEnemy of previousState.enemies) {
        const nextEnemy = nextState.enemies.find((enemy) => enemy.id === previousEnemy.id);
        const damage = nextEnemy ? previousEnemy.health - nextEnemy.health : previousEnemy.health;
        if (damage <= 0)
            continue;
        const hitPosition = nextEnemy ? nextEnemy.position : previousEnemy.position;
        addFloatingText(`-${Math.ceil(damage)}`, hitPosition);
    }
}
function addFloatingText(text, position) {
    floatingTexts = [
        ...floatingTexts,
        {
            text,
            position: { x: position.x, y: position.y - 18 },
            ageMs: 0,
            durationMs: FLOATING_TEXT_DURATION_MS,
        },
    ].slice(-24);
}
function updateFloatingTexts(deltaMs) {
    floatingTexts = floatingTexts
        .map((floatingText) => ({ ...floatingText, ageMs: floatingText.ageMs + deltaMs }))
        .filter((floatingText) => floatingText.ageMs < floatingText.durationMs);
}
function runFrame(timestamp) {
    const realDeltaMs = Math.min(250, timestamp - lastTimestamp);
    lastTimestamp = timestamp;
    accumulatorMs += realDeltaMs;
    let subStepCount = 0;
    while (accumulatorMs >= level001Config.fixedDeltaMs && subStepCount < MAX_SUB_STEPS_PER_FRAME) {
        setGameState(stepSimulation(gameState, 1, level001Config));
        accumulatorMs -= level001Config.fixedDeltaMs;
        subStepCount += 1;
    }
    if (subStepCount === MAX_SUB_STEPS_PER_FRAME) {
        accumulatorMs = 0;
    }
    updateFloatingTexts(realDeltaMs);
    render();
    syncUi();
    requestAnimationFrame(runFrame);
}
function handleCanvasClick(event) {
    const point = toLogicalPoint(event);
    const clickedHero = findHeroAt(point);
    if (clickedHero) {
        selectedHeroId = clickedHero.id;
        setMessage(`Selected hero: ${clickedHero.archetype}. Click an enemy to cast its active skill.`);
        syncUi();
        return;
    }
    const clickedEnemy = findEnemyAt(point);
    if (clickedEnemy) {
        selectedEnemyId = clickedEnemy.id;
        if (!selectedHeroId) {
            setMessage(`Selected enemy: ${clickedEnemy.archetype}. Select a hero, then click an enemy to cast skill.`);
            syncUi();
            return;
        }
        castSelectedHeroSkill(clickedEnemy);
        syncUi();
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
            setMessage(`Selected hero: ${clickedSlot.occupiedByHeroId}. Click an enemy to cast its active skill.`);
            syncUi();
            return;
        }
        dispatch({ type: "BUILD_HERO", slotId: clickedSlot.id, heroArchetype: selectedHeroArchetype });
        const builtHero = gameState.heroes.find((hero) => hero.slotId === clickedSlot.id);
        if (builtHero) {
            selectedHeroId = builtHero.id;
            setMessage(`Built ${builtHero.archetype} at ${clickedSlot.id}. Click an enemy to cast its skill.`);
        }
        else {
            setMessage(`Could not build ${selectedHeroArchetype}; check gold and slot state.`);
        }
        syncUi();
    }
}
function castSelectedHeroSkill(target) {
    const hero = gameState.heroes.find((candidate) => candidate.id === selectedHeroId);
    if (!hero) {
        setMessage("Select a hero before casting an active skill.");
        return;
    }
    const beforeMana = gameState.resources.manaCrystal;
    const beforeCooldown = hero.cooldownTicksRemaining;
    const beforeTargetHealth = target.health;
    dispatch({ type: "CAST_SKILL", heroId: hero.id, targetEnemyId: target.id });
    const afterHero = gameState.heroes.find((candidate) => candidate.id === hero.id);
    const afterTarget = gameState.enemies.find((enemy) => enemy.id === target.id);
    const didSpendMana = gameState.resources.manaCrystal < beforeMana;
    const didStartCooldown = (afterHero?.cooldownTicksRemaining ?? 0) > beforeCooldown;
    const didDamageTarget = !afterTarget || afterTarget.health < beforeTargetHealth;
    if (didSpendMana || didStartCooldown || didDamageTarget) {
        setMessage(`${hero.archetype} cast ${skillLabel(hero)} on ${target.archetype}.`);
    }
    else {
        setMessage(`Skill did not cast. Check cooldown, mana, and target validity.`);
    }
}
function toLogicalPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT,
    };
}
function findHeroAt(point) {
    return gameState.heroes.find((hero) => distance(hero.position, point) <= 18);
}
function findEnemyAt(point) {
    return gameState.enemies.find((enemy) => distance(enemy.position, point) <= 16);
}
function findTowerSlotAt(point) {
    return gameState.towerSlots.find((slot) => distance(slot.position, point) <= 22);
}
function saveAndExit() {
    if (gameState.status === "running") {
        dispatch({ type: "PAUSE" });
    }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(createSnapshot(gameState)));
    setMessage("Battle snapshot saved locally. Continue it from this browser later.");
    syncUi();
}
function continueSavedBattle() {
    const snapshotJson = localStorage.getItem(SNAPSHOT_KEY);
    if (!snapshotJson) {
        setMessage("No saved battle snapshot found.");
        return;
    }
    try {
        const snapshot = JSON.parse(snapshotJson);
        gameState = restoreSnapshot(snapshot);
        selectedHeroId = undefined;
        selectedEnemyId = undefined;
        floatingTexts = [];
        accumulatorMs = 0;
        setMessage("Saved battle restored into paused state.");
        syncUi();
    }
    catch {
        localStorage.removeItem(SNAPSHOT_KEY);
        setMessage("Saved battle snapshot was invalid and has been cleared.");
        syncUi();
    }
}
function abandonSavedBattle() {
    localStorage.removeItem(SNAPSHOT_KEY);
    setMessage("Saved battle abandoned.");
    syncUi();
}
function syncUi() {
    const hud = selectHudState(gameState);
    setText("hud-crystals", `Crystals ${hud.crystals}/${hud.maxCrystals} · ${crystalStatusLabel(hud.crystal.status)}`);
    setText("hud-gold", `Gold ${hud.gold}`);
    setText("hud-mana", `Mana ${hud.manaCrystal}`);
    setText("hud-wave", `Wave ${hud.wave.currentWave}/${hud.wave.totalWaves}`);
    setText("hud-status", hud.settlement.isComplete ? settlementLabel(hud.settlement) : `Status ${hud.status}`);
    startButton.disabled = gameState.status !== "ready";
    pauseButton.textContent = hud.canResume ? "Resume" : "Pause";
    pauseButton.disabled = !hud.canPause && !hud.canResume;
    speedButton.textContent = `Speed ${hud.speed}x`;
    waveButton.disabled = !hud.canStartNextWave;
    resumeButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
    abandonButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
}
function crystalStatusLabel(status) {
    switch (status) {
        case "safe":
            return "safe";
        case "carried":
            return "stolen";
        case "dropped":
            return "dropped";
        case "returning":
            return "returning";
        case "recovered":
            return "recovered";
        case "escaped":
            return "escaped";
    }
}
function settlementLabel(settlement) {
    return `${settlement.outcome.toUpperCase()} · ${settlement.stars}★ · ${settlement.remainingCrystals}/${settlement.maxCrystals} crystals`;
}
function setText(id, text) {
    mustGet(id).textContent = text;
}
function setMessage(text) {
    messageElement.textContent = text;
}
function render() {
    clearCanvas();
    drawMap();
    drawObstacles();
    drawTowerSlots();
    drawHeroes();
    drawEnemies();
    drawReturningCrystal();
    drawFloatingTexts();
    drawOverlayText();
    drawSelectionPanel();
    drawSettlementPanel();
}
function clearCanvas() {
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const gradient = context.createLinearGradient(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    gradient.addColorStop(0, "#16301d");
    gradient.addColorStop(1, "#2a2117");
    context.fillStyle = gradient;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}
function drawMap() {
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
    if (start)
        drawLabel(start, "Start", "#b7ffb2");
    if (end)
        drawLabel(end, "Ancient", "#ffd68a");
}
function strokePath() {
    context.beginPath();
    level001Config.path.forEach((point, index) => {
        if (index === 0)
            context.moveTo(point.x, point.y);
        else
            context.lineTo(point.x, point.y);
    });
    context.stroke();
}
function drawTowerSlots() {
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
function drawObstacles() {
    for (const obstacle of gameState.obstacles) {
        if (obstacle.destroyed)
            continue;
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
function drawHeroes() {
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
function drawEnemies() {
    for (const enemy of gameState.enemies) {
        const selected = enemy.id === selectedEnemyId;
        if (selected) {
            context.beginPath();
            context.arc(enemy.position.x, enemy.position.y, 19, 0, Math.PI * 2);
            context.strokeStyle = "#ffffff";
            context.lineWidth = 2;
            context.stroke();
        }
        context.beginPath();
        context.arc(enemy.position.x, enemy.position.y, enemy.carryingCrystal ? 14 : 11, 0, Math.PI * 2);
        context.fillStyle = enemy.carryingCrystal ? "#ff7a59" : "#ff4f6d";
        context.strokeStyle = enemy.carryingCrystal ? "#ffe28a" : "rgba(255,255,255,0.65)";
        context.lineWidth = enemy.carryingCrystal ? 3 : 1.5;
        context.fill();
        context.stroke();
        drawHealthBar(enemy.position.x - 18, enemy.position.y - 24, 36, enemy.health / enemy.maxHealth);
        if (enemy.statusEffects?.some((statusEffect) => statusEffect.type === "stun")) {
            drawLabel({ x: enemy.position.x, y: enemy.position.y + 27 }, "STUN", "#ffe28a");
        }
        else if (enemy.statusEffects?.some((statusEffect) => statusEffect.type === "slow")) {
            drawLabel({ x: enemy.position.x, y: enemy.position.y + 27 }, "SLOW", "#bff8ff");
        }
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
function drawReturningCrystal() {
    const crystal = gameState.crystal;
    if ((crystal.status !== "returning" && crystal.status !== "dropped") || !crystal.position)
        return;
    context.save();
    context.strokeStyle = "rgba(255, 226, 138, 0.45)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(crystal.position.x, crystal.position.y, 18, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#ffe28a";
    context.beginPath();
    context.moveTo(crystal.position.x, crystal.position.y - 15);
    context.lineTo(crystal.position.x + 10, crystal.position.y);
    context.lineTo(crystal.position.x, crystal.position.y + 15);
    context.lineTo(crystal.position.x - 10, crystal.position.y);
    context.closePath();
    context.fill();
    drawLabel({ x: crystal.position.x, y: crystal.position.y - 24 }, "RETURN", "#ffe28a");
    context.restore();
}
function drawFloatingTexts() {
    context.save();
    context.font = "bold 18px system-ui, sans-serif";
    context.textAlign = "center";
    for (const floatingText of floatingTexts) {
        const ratio = floatingText.ageMs / floatingText.durationMs;
        context.globalAlpha = Math.max(0, 1 - ratio);
        context.fillStyle = "#fff1a8";
        context.fillText(floatingText.text, floatingText.position.x, floatingText.position.y - ratio * 32);
    }
    context.restore();
}
function drawOverlayText() {
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.34)";
    context.fillRect(16, 456, 560, 68);
    context.fillStyle = "rgba(255,255,255,0.86)";
    context.font = "16px system-ui, sans-serif";
    context.fillText("Click slot: build · Click hero: select · Click enemy: inspect / cast selected hero skill", 32, 486);
    context.fillText(`Selected hero: ${selectedHeroId ?? "none"} · Selected enemy: ${selectedEnemyId ?? "none"} · Crystal ${gameState.crystal.status}`, 32, 512);
    context.restore();
}
function drawSelectionPanel() {
    const selectedHero = selectedHeroId ? gameState.heroes.find((hero) => hero.id === selectedHeroId) : undefined;
    const selectedEnemy = selectedEnemyId ? gameState.enemies.find((enemy) => enemy.id === selectedEnemyId) : undefined;
    if (!selectedHero && !selectedEnemy)
        return;
    const panelHeight = selectedHero && selectedEnemy ? 266 : 170;
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.58)";
    context.fillRect(620, 16, 324, panelHeight);
    context.strokeStyle = "rgba(255, 255, 255, 0.24)";
    context.lineWidth = 1.5;
    context.strokeRect(620, 16, 324, panelHeight);
    let nextY = 44;
    if (selectedHero) {
        nextY = drawHeroPanel(selectedHero, 638, nextY);
    }
    if (selectedEnemy) {
        drawEnemyPanel(selectedEnemy, 638, nextY + (selectedHero ? 12 : 0));
    }
    context.restore();
}
function drawHeroPanel(hero, x, y) {
    const config = level001Config.heroConfigs?.find((candidate) => candidate.archetype === hero.archetype);
    drawPanelLine(x, y, `Hero: ${hero.archetype}`, "#dcecff", true);
    drawPanelLine(x, y + 22, `HP ${hero.health}/${hero.maxHealth} · Cost ${hero.totalCost}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 44, `Attack ${config?.attackDamage ?? "?"} · Range ${config?.attackRange ?? "?"}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 66, `Skill ${skillLabel(hero)} · Mana ${config?.skillManaCost ?? 0}`, "#ffe28a");
    drawPanelLine(x, y + 88, `Damage ${config?.skillDamage ?? "?"} · CD ${hero.cooldownTicksRemaining}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 110, "Operation: click enemy to cast", "#9ad1ff");
    return y + 132;
}
function drawEnemyPanel(enemy, x, y) {
    const config = level001Config.enemies?.find((candidate) => candidate.archetype === enemy.archetype);
    drawPanelLine(x, y, `Enemy: ${enemy.archetype}`, "#ffd1dc", true);
    drawPanelLine(x, y + 22, `HP ${enemy.health}/${enemy.maxHealth} · Reward ${config?.rewardGold ?? 0}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 44, `Speed ${config?.speedUnitsPerSecond ?? "?"} · Path ${enemyPathLabel(enemy)}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 66, `State ${enemy.carryingCrystal ? "carrying crystal" : "advancing"}`, enemy.carryingCrystal ? "#ffe28a" : "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 88, `Buffs ${statusEffectsLabel(enemy)}`, "#bff8ff");
    drawPanelLine(x, y + 110, "Skill: steal crystal, escape to Start", "rgba(255,255,255,0.86)");
}
function drawPanelLine(x, y, text, color, bold = false) {
    context.fillStyle = color;
    context.font = `${bold ? "bold " : ""}14px system-ui, sans-serif`;
    context.textAlign = "left";
    context.fillText(text, x, y);
}
function skillLabel(hero) {
    const config = level001Config.heroConfigs?.find((candidate) => candidate.archetype === hero.archetype);
    switch (config?.skillKind ?? "direct-damage") {
        case "hook":
            return "Hook / pull + stun carrier";
        case "frost":
            return "Frost AoE slow";
        case "storm-chain":
            return "Storm chain lightning";
        case "moonblade":
            return "Moonblade bounce";
        case "direct-damage":
            return "Direct damage";
    }
    return "Direct damage";
}
function enemyPathLabel(enemy) {
    return `${(enemy.pathIndex + enemy.progress).toFixed(2)}`;
}
function statusEffectsLabel(enemy) {
    const effects = enemy.statusEffects?.filter((statusEffect) => statusEffect.remainingTicks > 0) ?? [];
    if (effects.length === 0)
        return "none";
    return effects
        .map((statusEffect) => `${statusEffect.type}:${statusEffect.remainingTicks}`)
        .join(", ");
}
function drawSettlementPanel() {
    if (!gameState.settlement.isComplete)
        return;
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.72)";
    context.fillRect(250, 150, 460, 210);
    context.strokeStyle = "rgba(255, 214, 138, 0.72)";
    context.lineWidth = 2;
    context.strokeRect(250, 150, 460, 210);
    context.fillStyle = "#f6f0df";
    context.textAlign = "center";
    context.font = "28px system-ui, sans-serif";
    context.fillText(gameState.settlement.outcome === "victory" ? "Victory" : "Defeat", 480, 205);
    context.font = "22px system-ui, sans-serif";
    context.fillText(`${gameState.settlement.stars} ★`, 480, 245);
    context.font = "16px system-ui, sans-serif";
    context.fillText(`Reason: ${gameState.settlement.reason}`, 480, 280);
    context.fillText(`Crystals: ${gameState.settlement.remainingCrystals}/${gameState.settlement.maxCrystals}`, 480, 310);
    context.restore();
}
function drawHealthBar(x, y, width, ratio) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    context.fillStyle = "rgba(0,0,0,0.56)";
    context.fillRect(x, y, width, 5);
    context.fillStyle = clampedRatio > 0.45 ? "#8cff92" : "#ffcf5a";
    context.fillRect(x, y, width * clampedRatio, 5);
}
function drawLabel(point, text, color) {
    context.save();
    context.fillStyle = color;
    context.font = "13px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(text, point.x, point.y);
    context.restore();
}
function shortHeroName(archetype) {
    return archetype
        .split("-")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
//# sourceMappingURL=main.js.map