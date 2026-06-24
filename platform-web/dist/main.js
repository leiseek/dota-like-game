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
const HERO_DISPLAY_NAMES = {
    "hook-guardian": "钩锁守卫",
    "frost-priestess": "冰霜祭司",
    "storm-sigilist": "风暴符师",
    "moonblade-ranger": "月刃游侠",
    guardian: "守卫者",
};
const ENEMY_DISPLAY_NAMES = {
    runner: "试炼行者",
    "rift-grunt": "裂隙杂兵",
    "swift-beast": "迅捷兽",
    "crystal-thief": "水晶窃贼",
    stoneguard: "石甲卫士",
    "shield-acolyte": "护盾侍从",
    "rift-beast-hatchling": "裂隙幼兽",
};
const canvas = mustGet("battle-canvas");
const context = mustGetContext(canvas);
const heroSelect = mustGet("hero-select");
const messageElement = mustGet("message");
const startButton = mustGet("start-button");
const pauseButton = mustGet("pause-button");
const speedButton = mustGet("speed-button");
const waveButton = mustGet("wave-button");
const autoCastButton = mustGet("auto-cast-button");
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
autoCastButton.addEventListener("click", toggleSelectedHeroAutoCast);
saveButton.addEventListener("click", saveAndExit);
resumeButton.addEventListener("click", continueSavedBattle);
abandonButton.addEventListener("click", abandonSavedBattle);
heroSelect.addEventListener("change", () => {
    selectedHeroArchetype = parseHeroArchetype(heroSelect.value);
    setMessage(`已选择建造：${heroName(selectedHeroArchetype)}`);
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
        setMessage(`已选中英雄：${heroName(clickedHero.archetype)}。点击敌人可手动释放大招。`);
        syncUi();
        return;
    }
    const clickedEnemy = findEnemyAt(point);
    if (clickedEnemy) {
        selectedEnemyId = clickedEnemy.id;
        if (!selectedHeroId) {
            setMessage(`已选中敌人：${enemyName(clickedEnemy.archetype)}。先选择英雄，再点击敌人可释放大招。`);
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
            setMessage("该塔位被障碍封锁，后续会加入清障玩法。");
            return;
        }
        if (clickedSlot.occupiedByHeroId) {
            selectedHeroId = clickedSlot.occupiedByHeroId;
            setMessage(`已选中塔位英雄：${clickedSlot.occupiedByHeroId}。点击敌人可手动释放大招。`);
            syncUi();
            return;
        }
        dispatch({ type: "BUILD_HERO", slotId: clickedSlot.id, heroArchetype: selectedHeroArchetype });
        const builtHero = gameState.heroes.find((hero) => hero.slotId === clickedSlot.id);
        if (builtHero) {
            selectedHeroId = builtHero.id;
            setMessage(`已在 ${clickedSlot.id} 建造 ${heroName(builtHero.archetype)}。点击敌人释放大招，或开启自动大招。`);
        }
        else {
            setMessage(`无法建造 ${heroName(selectedHeroArchetype)}，请检查金币或塔位状态。`);
        }
        syncUi();
    }
}
function castSelectedHeroSkill(target) {
    const hero = gameState.heroes.find((candidate) => candidate.id === selectedHeroId);
    if (!hero) {
        setMessage("请先选择英雄，再释放大招。");
        return;
    }
    const beforeCooldown = hero.cooldownTicksRemaining;
    const beforeTargetHealth = target.health;
    dispatch({ type: "CAST_SKILL", heroId: hero.id, targetEnemyId: target.id });
    const afterHero = gameState.heroes.find((candidate) => candidate.id === hero.id);
    const afterTarget = gameState.enemies.find((enemy) => enemy.id === target.id);
    const didStartCooldown = (afterHero?.cooldownTicksRemaining ?? 0) > beforeCooldown;
    const didDamageTarget = !afterTarget || afterTarget.health < beforeTargetHealth;
    if (didStartCooldown || didDamageTarget) {
        setMessage(`${heroName(hero.archetype)} 对 ${enemyName(target.archetype)} 释放了「${skillLabel(hero)}」。`);
    }
    else {
        setMessage("大招未释放：请检查冷却、目标是否存在或是否在有效范围内。");
    }
}
function toggleSelectedHeroAutoCast() {
    const hero = selectedHeroId ? gameState.heroes.find((candidate) => candidate.id === selectedHeroId) : undefined;
    if (!hero) {
        setMessage("请先选择一个英雄，再切换自动大招。");
        return;
    }
    const enabled = !hero.autoCastEnabled;
    dispatch({ type: "SET_AUTO_CAST", heroId: hero.id, enabled });
    setMessage(`${heroName(hero.archetype)} 自动大招已${enabled ? "开启" : "关闭"}。`);
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
    setMessage("战斗已保存到当前浏览器，可稍后继续。");
    syncUi();
}
function continueSavedBattle() {
    const snapshotJson = localStorage.getItem(SNAPSHOT_KEY);
    if (!snapshotJson) {
        setMessage("没有找到本地战斗存档。");
        return;
    }
    try {
        const snapshot = JSON.parse(snapshotJson);
        gameState = restoreSnapshot(snapshot);
        selectedHeroId = undefined;
        selectedEnemyId = undefined;
        floatingTexts = [];
        accumulatorMs = 0;
        setMessage("已恢复存档，战斗处于暂停状态。");
        syncUi();
    }
    catch {
        localStorage.removeItem(SNAPSHOT_KEY);
        setMessage("存档数据无效，已清除。");
        syncUi();
    }
}
function abandonSavedBattle() {
    localStorage.removeItem(SNAPSHOT_KEY);
    setMessage("已放弃本地存档。");
    syncUi();
}
function syncUi() {
    const hud = selectHudState(gameState);
    setText("hud-crystals", `水晶 ${hud.crystals}/${hud.maxCrystals} · ${crystalStatusLabel(hud.crystal.status)}`);
    setText("hud-gold", `金币 ${hud.gold}`);
    setText("hud-mana", `能量 ${hud.manaCrystal}`);
    setText("hud-wave", `波次 ${hud.wave.currentWave}/${hud.wave.totalWaves}`);
    setText("hud-status", hud.settlement.isComplete ? settlementLabel(hud.settlement) : `状态 ${gameStatusLabel(hud.status)}`);
    const selectedHero = selectedHeroId ? gameState.heroes.find((hero) => hero.id === selectedHeroId) : undefined;
    startButton.disabled = gameState.status !== "ready";
    pauseButton.textContent = hud.canResume ? "继续" : "暂停";
    pauseButton.disabled = !hud.canPause && !hud.canResume;
    speedButton.textContent = `速度 ${hud.speed}x`;
    waveButton.disabled = !hud.canStartNextWave;
    autoCastButton.disabled = !selectedHero;
    autoCastButton.textContent = selectedHero
        ? `自动大招：${selectedHero.autoCastEnabled ? "开" : "关"}`
        : "自动大招：未选择英雄";
    resumeButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
    abandonButton.disabled = !localStorage.getItem(SNAPSHOT_KEY);
}
function crystalStatusLabel(status) {
    switch (status) {
        case "safe":
            return "安全";
        case "carried":
            return "被携带";
        case "dropped":
            return "掉落";
        case "returning":
            return "返回中";
        case "recovered":
            return "已回收";
        case "escaped":
            return "已被运出";
    }
}
function gameStatusLabel(status) {
    switch (status) {
        case "ready":
            return "待开始";
        case "running":
            return "战斗中";
        case "paused":
            return "已暂停";
        case "won":
            return "胜利";
        case "lost":
            return "失败";
    }
}
function settlementLabel(settlement) {
    return `${settlement.outcome === "victory" ? "胜利" : "失败"} · ${settlement.stars}★ · 水晶 ${settlement.remainingCrystals}/${settlement.maxCrystals}`;
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
        drawLabel(start, "起点", "#b7ffb2");
    if (end)
        drawLabel(end, "圣坛", "#ffd68a");
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
        const heroConfig = getHeroConfig(hero.archetype);
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
        const cooldown = hero.cooldownTicksRemaining > 0 ? ` CD${cooldownSeconds(hero)}` : "";
        const auto = hero.autoCastEnabled ? " 自动" : "";
        drawLabel({ x: hero.position.x, y: hero.position.y - 25 }, `Lv${hero.level} ${shortHeroName(hero.archetype)}${cooldown}${auto}`, "#dcecff");
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
        context.fillStyle = enemy.carryingCrystal ? "#ff7a59" : enemy.returningToStart ? "#ff9f43" : "#ff4f6d";
        context.strokeStyle = enemy.carryingCrystal ? "#ffe28a" : "rgba(255,255,255,0.65)";
        context.lineWidth = enemy.carryingCrystal ? 3 : 1.5;
        context.fill();
        context.stroke();
        drawHealthBar(enemy.position.x - 18, enemy.position.y - 24, 36, enemy.health / enemy.maxHealth);
        if (enemy.statusEffects?.some((statusEffect) => statusEffect.type === "stun")) {
            drawLabel({ x: enemy.position.x, y: enemy.position.y + 27 }, "眩晕", "#ffe28a");
        }
        else if (enemy.statusEffects?.some((statusEffect) => statusEffect.type === "slow")) {
            drawLabel({ x: enemy.position.x, y: enemy.position.y + 27 }, "减速", "#bff8ff");
        }
        else if (enemy.returningToStart) {
            drawLabel({ x: enemy.position.x, y: enemy.position.y + 27 }, "返程", "#ffcf5a");
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
    drawLabel({ x: crystal.position.x, y: crystal.position.y - 24 }, "水晶返回", "#ffe28a");
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
    context.fillRect(16, 456, 588, 68);
    context.fillStyle = "rgba(255,255,255,0.86)";
    context.font = "16px system-ui, sans-serif";
    context.fillText("点击塔位：建造 · 点击英雄：查看成长 · 点击敌人：查看/手动大招", 32, 486);
    context.fillText(`英雄：${selectedHeroId ?? "未选"} · 敌人：${selectedEnemyId ?? "未选"} · 水晶 ${crystalStatusLabel(gameState.crystal.status)}`, 32, 512);
    context.restore();
}
function drawSelectionPanel() {
    const selectedHero = selectedHeroId ? gameState.heroes.find((hero) => hero.id === selectedHeroId) : undefined;
    const selectedEnemy = selectedEnemyId ? gameState.enemies.find((enemy) => enemy.id === selectedEnemyId) : undefined;
    if (!selectedHero && !selectedEnemy)
        return;
    const heroHeight = selectedHero ? 230 : 0;
    const enemyHeight = selectedEnemy ? 142 : 0;
    const panelHeight = Math.max(170, heroHeight + enemyHeight + (selectedHero && selectedEnemy ? 18 : 0));
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.62)";
    context.fillRect(608, 16, 336, panelHeight);
    context.strokeStyle = "rgba(255, 255, 255, 0.24)";
    context.lineWidth = 1.5;
    context.strokeRect(608, 16, 336, panelHeight);
    let nextY = 42;
    if (selectedHero) {
        nextY = drawHeroPanel(selectedHero, 626, nextY);
    }
    if (selectedEnemy) {
        drawEnemyPanel(selectedEnemy, 626, nextY + (selectedHero ? 12 : 0));
    }
    context.restore();
}
function drawHeroPanel(hero, x, y) {
    const config = getHeroConfig(hero.archetype);
    const passiveLines = unlockedPassiveLabels(hero, config);
    drawPanelLine(x, y, `英雄：${heroName(hero.archetype)}`, "#dcecff", true);
    drawPanelLine(x, y + 22, `等级 Lv${hero.level} · ${xpProgressLabel(hero, config)} · 自动大招 ${hero.autoCastEnabled ? "开" : "关"}`, "rgba(255,255,255,0.9)");
    drawPanelLine(x, y + 44, `生命 ${hero.health}/${hero.maxHealth} · 造价 ${hero.totalCost}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 66, `普攻 ${config?.attackDamage ?? "?"} · 范围 ${config?.attackRange ?? "?"}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 88, `大招：${skillLabel(hero)} · 无蓝耗`, "#ffe28a");
    drawPanelLine(x, y + 110, `伤害 ${config?.skillDamage ?? "?"} · 冷却 ${cooldownSeconds(hero)}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 132, "已解锁被动：", "#9ad1ff", true);
    passiveLines.slice(0, 5).forEach((line, index) => {
        drawPanelLine(x + 10, y + 154 + index * 18, `• ${line}`, "rgba(255,255,255,0.86)");
    });
    return y + 250;
}
function drawEnemyPanel(enemy, x, y) {
    const config = level001Config.enemies?.find((candidate) => candidate.archetype === enemy.archetype);
    drawPanelLine(x, y, `敌人：${enemyName(enemy.archetype)}`, "#ffd1dc", true);
    drawPanelLine(x, y + 22, `生命 ${Math.ceil(enemy.health)}/${enemy.maxHealth} · 击杀奖励 ${config?.rewardGold ?? 0}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 44, `速度 ${config?.speedUnitsPerSecond ?? "?"} · 路径进度 ${enemyPathLabel(enemy)}`, "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 66, `状态：${enemyStateLabel(enemy)}`, enemy.carryingCrystal ? "#ffe28a" : "rgba(255,255,255,0.86)");
    drawPanelLine(x, y + 88, `Buff：${statusEffectsLabel(enemy)}`, "#bff8ff");
    drawPanelLine(x, y + 110, "规则：到圣坛后必须原路返回，从起点离场", "rgba(255,255,255,0.86)");
}
function drawPanelLine(x, y, text, color, bold = false) {
    context.fillStyle = color;
    context.font = `${bold ? "bold " : ""}14px system-ui, sans-serif`;
    context.textAlign = "left";
    context.fillText(text, x, y);
}
function getHeroConfig(archetype) {
    return level001Config.heroConfigs?.find((candidate) => candidate.archetype === archetype);
}
function skillLabel(hero) {
    const config = getHeroConfig(hero.archetype);
    switch (config?.skillKind ?? "direct-damage") {
        case "hook":
            return "钩锁牵引 / 拉回并控制携晶者";
        case "frost":
            return "冰霜范围减速";
        case "storm-chain":
            return "风暴连锁闪电";
        case "moonblade":
            return "月刃弹射";
        case "direct-damage":
            return "直接伤害";
    }
}
function heroName(archetype) {
    return HERO_DISPLAY_NAMES[archetype] ?? archetype;
}
function enemyName(archetype) {
    return ENEMY_DISPLAY_NAMES[archetype] ?? archetype;
}
function unlockedPassiveLabels(hero, config) {
    const passives = config?.progression?.passives.filter((passive) => hero.unlockedPassiveIds.includes(passive.id)) ?? [];
    if (passives.length === 0)
        return ["暂无"];
    return passives.map((passive) => `Lv${passive.level} ${passive.label}`);
}
function xpProgressLabel(hero, config) {
    if (hero.level >= 5)
        return `经验 ${hero.experience} / 满级`;
    const thresholds = [...(config?.progression?.levelThresholds ?? [])];
    const nextThreshold = thresholds[hero.level] ?? "?";
    return `经验 ${hero.experience}/${nextThreshold}`;
}
function cooldownSeconds(hero) {
    if (hero.cooldownTicksRemaining <= 0)
        return "就绪";
    const seconds = Math.ceil((hero.cooldownTicksRemaining * level001Config.fixedDeltaMs) / 1000);
    return `${seconds}s`;
}
function enemyPathLabel(enemy) {
    return `${(enemy.pathIndex + enemy.progress).toFixed(2)}`;
}
function enemyStateLabel(enemy) {
    if (enemy.carryingCrystal)
        return "携带水晶返程";
    if (enemy.returningToStart)
        return "空手返程";
    return "前往圣坛";
}
function statusEffectsLabel(enemy) {
    const effects = enemy.statusEffects?.filter((statusEffect) => statusEffect.remainingTicks > 0) ?? [];
    if (effects.length === 0)
        return "无";
    return effects
        .map((statusEffect) => `${statusEffect.type === "stun" ? "眩晕" : "减速"}:${statusEffect.remainingTicks}`)
        .join("，");
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
    context.fillText(gameState.settlement.outcome === "victory" ? "胜利" : "失败", 480, 205);
    context.font = "22px system-ui, sans-serif";
    context.fillText(`${gameState.settlement.stars} ★`, 480, 245);
    context.font = "16px system-ui, sans-serif";
    context.fillText(`原因：${settlementReasonLabel(gameState.settlement.reason)}`, 480, 280);
    context.fillText(`水晶：${gameState.settlement.remainingCrystals}/${gameState.settlement.maxCrystals}`, 480, 310);
    context.restore();
}
function settlementReasonLabel(reason) {
    switch (reason) {
        case "none":
            return "无";
        case "all-waves-cleared":
            return "清完全部波次";
        case "crystal-escaped":
            return "水晶被运出起点";
        case "base-crystals-depleted":
            return "水晶耗尽";
    }
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