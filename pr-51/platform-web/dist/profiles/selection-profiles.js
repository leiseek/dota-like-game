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
const HERO_PROFILES = {
    "hook-guardian": {
        role: "控制 / 反携晶者",
        summary: "把偷水晶的怪拉回战线，越后期越像撼地神牛式拦路控制。",
        special: "大招：钩锁牵引，命中携晶者时附带强控。",
        tips: "适合放在终点前或返程路口，优先处理携晶者。",
    },
    "frost-priestess": {
        role: "群体减速 / 冰冻控场",
        summary: "用冰霜铺控场，让雷电和月刃吃到状态组合收益。",
        special: "大招：范围冰霜伤害，并给敌人挂减速。",
        tips: "适合覆盖弯道和怪物密集段，是连锁爆发的启动器。",
    },
    "storm-sigilist": {
        role: "连锁爆发 / 状态联动",
        summary: "对带状态的敌人跳跃更多，负责清杂和补爆发。",
        special: "大招：风暴连锁闪电，目标被控时额外跳跃。",
        tips: "和冰霜祭司搭配价值最高，优先打减速/冰冻目标。",
    },
    "moonblade-ranger": {
        role: "弹射清场 / 持续伤害",
        summary: "月刃弹射叠毒和燃烧，适合处理成群小怪。",
        special: "大招：月刃弹射，对受控目标有额外伤害收益。",
        tips: "适合放在长直路或密集路口，吃冰霜和风暴的状态收益。",
    },
    guardian: {
        role: "基础守卫",
        summary: "教程用基础防御单位。",
        special: "大招：直接伤害。",
        tips: "用于验证基础战斗循环。",
    },
};
const ENEMY_PROFILES = {
    runner: {
        role: "基础步兵",
        summary: "低威胁试炼单位，用来验证路线和基础火力。",
        special: "无特殊技能。",
        tips: "普通火力即可处理。",
    },
    "rift-grunt": {
        role: "普通杂兵",
        summary: "数量多、血量低，是早期经济和英雄经验来源。",
        special: "无特殊技能，但成群时会拖慢单体火力。",
        tips: "用月刃弹射或风暴连锁快速清理。",
    },
    "swift-beast": {
        role: "高速突进",
        summary: "移速高，容易冲过薄弱火力点。",
        special: "速度快，偷到水晶后也会快速返程。",
        tips: "用冰霜减速或钩锁守卫在终点前拦截。",
    },
    "crystal-thief": {
        role: "偷晶核心怪",
        summary: "专门威胁水晶，一旦得手必须原路返回起点。",
        special: "携晶后从起点离场才扣水晶；途中死亡会掉落水晶。",
        tips: "优先集火，钩锁守卫对它的价值最高。",
    },
    stoneguard: {
        role: "高血量坦克",
        summary: "移动慢但很硬，会吸收大量普攻火力。",
        special: "高生命值，适合掩护后续高速怪。",
        tips: "用持续伤害和连锁技能压血，不要让它拖住全部输出。",
    },
    "shield-acolyte": {
        role: "护盾侍从",
        summary: "中等血量支援怪，当前版本以数值压力表现护盾身份。",
        special: "后续版本会扩展为护盾/减伤光环单位。",
        tips: "优先观察它和大群杂兵的组合压力。",
    },
    "rift-beast-hatchling": {
        role: "Boss 幼体",
        summary: "Demo 末波高血量 Boss，用来检验阵容成长和控场上限。",
        special: "高生命、低速，逼迫玩家利用被动叠加和大招循环。",
        tips: "需要多英雄组合：冰霜控场、风暴爆发、月刃持续、钩锁保险。",
    },
};
const STATUS_LABELS = {
    slow: { text: "减速", color: "#bff8ff" },
    stun: { text: "眩晕", color: "#ffe28a" },
    poison: { text: "剧毒", color: "#c8ff8a" },
    burn: { text: "燃烧", color: "#ff9f43" },
};
export function heroName(archetype) {
    return HERO_DISPLAY_NAMES[archetype] ?? archetype;
}
export function enemyName(archetype) {
    return ENEMY_DISPLAY_NAMES[archetype] ?? archetype;
}
export function heroProfile(archetype) {
    return HERO_PROFILES[archetype] ?? {
        role: "未知英雄",
        summary: "等待配置英雄简介。",
        special: "等待配置技能说明。",
        tips: "等待后续补充。",
    };
}
export function enemyProfile(archetype) {
    return ENEMY_PROFILES[archetype] ?? {
        role: "未知敌人",
        summary: "等待配置敌人简介。",
        special: "等待配置技能说明。",
        tips: "等待后续补充。",
    };
}
export function statusBadgeFor(statusType) {
    return STATUS_LABELS[statusType];
}
export function statusEffectName(statusType) {
    return statusBadgeFor(statusType).text;
}
//# sourceMappingURL=selection-profiles.js.map