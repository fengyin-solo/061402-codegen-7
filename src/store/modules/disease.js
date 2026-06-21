import { defineStore } from 'pinia';

const SEVERITY_LEVELS = {
  mild: { id: 'mild', name: '轻微', multiplier: 0.6, color: '#e6a23c' },
  moderate: { id: 'moderate', name: '中度', multiplier: 1.0, color: '#f56c6c' },
  severe: { id: 'severe', name: '严重', multiplier: 1.5, color: '#c45656' }
};

const SEVERITY_THRESHOLDS = { mild: 0, moderate: 3, severe: 6 };

const DISEASES = {
  dehydration: {
    id: 'dehydration',
    name: '脱水',
    icon: '🏜️',
    description: '缺水导致身体严重脱水，行动效率大幅下降',
    trigger: { waterBelow: 20 },
    effects: { actionEfficiency: 0.5, hpDamage: 3, specificActionPenalty: { collectWater: 0.7 } },
    cureItem: 'hydration_salve',
    cureRestHours: 4,
    naturalRecoveryChance: 0.08,
    naturalRecoveryCondition: { waterAbove: 50 },
    severityProgressChance: 0.2
  },
  injury: {
    id: 'injury',
    name: '外伤',
    icon: '🩸',
    description: '探索受伤导致伤口流血，持续损失生命值',
    trigger: { injuryChance: 0.35 },
    effects: { actionEfficiency: 0.6, hpDamage: 5, specificActionPenalty: { exploreCell: 0.5, chopWood: 0.6, mineStone: 0.6 } },
    cureItem: 'bandage',
    cureRestHours: 3,
    naturalRecoveryChance: 0.05,
    naturalRecoveryCondition: {},
    severityProgressChance: 0.15
  },
  cold: {
    id: 'cold',
    name: '感冒',
    icon: '🤧',
    description: '恶劣天气下受寒，采集效率降低且消耗增加',
    trigger: { weatherTypes: ['storm', 'blizzard'] },
    effects: { actionEfficiency: 0.4, extraConsume: { food: 3, water: 3 }, hpDamage: 2, specificActionPenalty: { gatherHerb: 0.5 } },
    cureItem: 'cold_medicine',
    cureRestHours: 5,
    naturalRecoveryChance: 0.06,
    naturalRecoveryCondition: { shelterBuilt: true },
    severityProgressChance: 0.25
  },
  fever: {
    id: 'fever',
    name: '发烧',
    icon: '🥵',
    description: '病情恶化引发高烧，几乎无法行动',
    trigger: { fromDisease: ['cold', 'dehydration'] },
    effects: { actionEfficiency: 0.2, hpDamage: 6, extraConsume: { water: 5 }, specificActionPenalty: { all: 0.7 } },
    cureItem: 'fever_reducer',
    cureRestHours: 6,
    naturalRecoveryChance: 0.02,
    naturalRecoveryCondition: { shelterBuilt: true },
    severityProgressChance: 0.3
  },
  infection: {
    id: 'infection',
    name: '感染',
    icon: '🦠',
    description: '伤口未及时处理导致感染，生命值快速下降',
    trigger: { fromDisease: ['injury'] },
    effects: { actionEfficiency: 0.3, hpDamage: 7, specificActionPenalty: { exploreCell: 0.4, chopWood: 0.5 } },
    cureItem: 'antibiotic',
    cureRestHours: 8,
    naturalRecoveryChance: 0.01,
    naturalRecoveryCondition: {},
    severityProgressChance: 0.35
  },
  malnutrition: {
    id: 'malnutrition',
    name: '营养不良',
    icon: '😵',
    description: '食物严重不足导致身体虚弱，所有行动效率降低',
    trigger: { foodBelow: 15 },
    effects: { actionEfficiency: 0.45, hpDamage: 4, extraConsume: { food: 2 }, specificActionPenalty: { gatherFood: 0.6, chopWood: 0.7 } },
    cureItem: 'nutrient_paste',
    cureRestHours: 5,
    naturalRecoveryChance: 0.07,
    naturalRecoveryCondition: { foodAbove: 50 },
    severityProgressChance: 0.2
  }
};

const MEDICINES = {
  hydration_salve: {
    id: 'hydration_salve',
    name: '补水膏',
    icon: '💧',
    description: '快速补充体液，治疗脱水',
    cures: ['dehydration'],
    craftCost: { water: 20, herb: 1 },
    hpRestore: 10
  },
  bandage: {
    id: 'bandage',
    name: '绷带',
    icon: '🩹',
    description: '包扎伤口，止血治疗外伤',
    cures: ['injury'],
    craftCost: { herb: 2 },
    hpRestore: 15
  },
  cold_medicine: {
    id: 'cold_medicine',
    name: '感冒药',
    icon: '💊',
    description: '驱寒退烧，治疗感冒',
    cures: ['cold'],
    craftCost: { herb: 3, water: 10 },
    hpRestore: 8
  },
  fever_reducer: {
    id: 'fever_reducer',
    name: '退烧药',
    icon: '🌡️',
    description: '强效退烧，治疗高烧',
    cures: ['fever'],
    craftCost: { herb: 4, water: 15 },
    hpRestore: 12
  },
  antibiotic: {
    id: 'antibiotic',
    name: '抗生素',
    icon: '💉',
    description: '消炎杀菌，治疗感染',
    cures: ['infection'],
    craftCost: { herb: 5, stone: 10 },
    hpRestore: 20
  },
  herb_poultice: {
    id: 'herb_poultice',
    name: '草药膏',
    icon: '🌿',
    description: '通用草药制剂，可缓解轻度症状',
    cures: ['cold', 'injury'],
    craftCost: { herb: 2, water: 5 },
    hpRestore: 8
  },
  nutrient_paste: {
    id: 'nutrient_paste',
    name: '营养膏',
    icon: '🥣',
    description: '浓缩营养食品，治疗营养不良',
    cures: ['malnutrition'],
    craftCost: { food: 15, herb: 2 },
    hpRestore: 15
  },
  panacea: {
    id: 'panacea',
    name: '万灵药',
    icon: '✨',
    description: '珍贵万能药，可治愈任意疾病',
    cures: ['dehydration', 'injury', 'cold', 'fever', 'infection', 'malnutrition'],
    craftCost: { herb: 8, water: 20, stone: 15 },
    hpRestore: 30
  }
};

const WEATHER_TYPES = {
  sunny: { id: 'sunny', name: '晴天', icon: '☀️', danger: 0 },
  cloudy: { id: 'cloudy', name: '多云', icon: '⛅', danger: 0 },
  rainy: { id: 'rainy', name: '雨天', icon: '🌧️', danger: 0.1 },
  storm: { id: 'storm', name: '暴风雨', icon: '⛈️', danger: 0.3 },
  blizzard: { id: 'blizzard', name: '暴风雪', icon: '❄️', danger: 0.4 }
};

const IMMUNITY_DURATION = 5;

export default defineStore('disease', {
  state: () => ({
    hp: 100,
    maxHp: 100,
    activeDiseases: [],
    medicineInventory: {
      hydration_salve: 0,
      bandage: 0,
      cold_medicine: 0,
      fever_reducer: 0,
      antibiotic: 0,
      herb_poultice: 0,
      nutrient_paste: 0,
      panacea: 0
    },
    herb: 5,
    weather: { ...WEATHER_TYPES.sunny },
    weatherIndex: 0,
    weatherTimer: 0,
    isResting: false,
    restProgress: 0,
    restTarget: 0,
    restDiseaseId: null,
    dayCount: 1,
    diseaseHistory: [],
    shelterBuilt: false,
    toolsBuilt: false,
    immunityMap: {},
    totalCuredCount: 0
  }),

  getters: {
    diseaseDefinitions: () => DISEASES,
    medicineDefinitions: () => MEDICINES,
    weatherDefinitions: () => WEATHER_TYPES,
    severityLevels: () => SEVERITY_LEVELS,

    hasDisease: (state) => (diseaseId) => {
      return state.activeDiseases.some(d => d.id === diseaseId);
    },

    getDisease: (state) => (diseaseId) => {
      return state.activeDiseases.find(d => d.id === diseaseId);
    },

    getDiseaseSeverity: (state) => (diseaseId) => {
      const disease = state.activeDiseases.find(d => d.id === diseaseId);
      if (!disease) return null;
      return SEVERITY_LEVELS[disease.severity] || SEVERITY_LEVELS.mild;
    },

    activeDiseaseCount: (state) => state.activeDiseases.length,

    actionEfficiency: (state) => {
      let eff = 1;
      for (const disease of state.activeDiseases) {
        const def = DISEASES[disease.id];
        if (def) {
          const severityMult = SEVERITY_LEVELS[disease.severity]?.multiplier || 1;
          const basePenalty = 1 - def.effects.actionEfficiency;
          eff *= (1 - basePenalty * severityMult);
        }
      }
      return Math.max(0.05, eff);
    },

    extraConsume: (state) => {
      const consume = { food: 0, water: 0 };
      for (const disease of state.activeDiseases) {
        const def = DISEASES[disease.id];
        if (def && def.effects.extraConsume) {
          const severityMult = SEVERITY_LEVELS[disease.severity]?.multiplier || 1;
          consume.food += Math.ceil((def.effects.extraConsume.food || 0) * severityMult);
          consume.water += Math.ceil((def.effects.extraConsume.water || 0) * severityMult);
        }
      }
      return consume;
    },

    hpPercent: (state) => Math.round((state.hp / state.maxHp) * 100),

    isCritical: (state) => state.hp <= 20 || state.activeDiseases.length >= 3,

    weatherDanger: (state) => state.weather.danger,

    canRest: (state) => !state.isResting && state.activeDiseases.length > 0,

    restProgressPercent: (state) => {
      if (state.restTarget <= 0) return 0;
      return Math.round((state.restProgress / state.restTarget) * 100);
    },

    weatherProtection: (state) => {
      if (state.shelterBuilt) return 0.5;
      return 0;
    },

    effectiveWeatherDanger: (state) => {
      const base = state.weather.danger;
      const protection = state.shelterBuilt ? 0.5 : 0;
      return Math.max(0, base * (1 - protection));
    },

    activeImmunities: (state) => {
      const result = [];
      for (const [diseaseId, remaining] of Object.entries(state.immunityMap)) {
        if (remaining > 0) {
          const def = DISEASES[diseaseId];
          result.push({
            id: diseaseId,
            name: def?.name || diseaseId,
            icon: def?.icon || '🛡️',
            remaining
          });
        }
      }
      return result;
    },

    diseaseSummary: (state) => {
      return state.activeDiseases.map(d => {
        const def = DISEASES[d.id];
        const severity = SEVERITY_LEVELS[d.severity] || SEVERITY_LEVELS.mild;
        return {
          id: d.id,
          name: d.name,
          icon: d.icon,
          severity: severity,
          turns: d.turns,
          effects: def ? {
            efficiencyLoss: Math.round((1 - def.effects.actionEfficiency * severity.multiplier) * 100),
            hpDamage: Math.ceil((def.effects.hpDamage || 0) * severity.multiplier)
          } : null
        };
      });
    }
  },

  actions: {
    checkDiseaseTriggers(resources) {
      for (const [diseaseId, diseaseDef] of Object.entries(DISEASES)) {
        if (this.hasDisease(diseaseId)) continue;
        if (this.immunityMap[diseaseId] > 0) continue;

        const trigger = diseaseDef.trigger;
        let triggered = false;

        if (trigger.waterBelow && resources.water < trigger.waterBelow) {
          const chance = Math.min(0.5, (trigger.waterBelow - resources.water) / trigger.waterBelow);
          triggered = Math.random() < chance;
        }

        if (trigger.foodBelow && resources.food < trigger.foodBelow) {
          const chance = Math.min(0.5, (trigger.foodBelow - resources.food) / trigger.foodBelow);
          triggered = Math.random() < chance;
        }

        if (trigger.weatherTypes && trigger.weatherTypes.includes(this.weather.id)) {
          const effectiveDanger = this.effectiveWeatherDanger;
          if (effectiveDanger > 0 && Math.random() < effectiveDanger) {
            triggered = true;
          }
        }

        if (trigger.fromDisease) {
          for (const fromId of trigger.fromDisease) {
            if (this.hasDisease(fromId)) {
              const fromDisease = this.getDisease(fromId);
              const severityBonus = fromDisease?.severity === 'severe' ? 0.2 : fromDisease?.severity === 'moderate' ? 0.1 : 0;
              if (Math.random() < 0.15 + severityBonus) {
                triggered = true;
                break;
              }
            }
          }
        }

        if (triggered) {
          this.addDisease(diseaseId);
        }
      }
    },

    checkInjuryOnExplore() {
      const injuryDef = DISEASES.injury;
      if (this.hasDisease('injury')) return false;
      if (this.immunityMap.injury > 0) return false;
      const chance = this.toolsBuilt ? injuryDef.trigger.injuryChance * 0.6 : injuryDef.trigger.injuryChance;
      if (Math.random() < chance) {
        this.addDisease('injury');
        return true;
      }
      return false;
    },

    addDisease(diseaseId) {
      if (this.hasDisease(diseaseId)) return;
      if (this.immunityMap[diseaseId] > 0) return;
      const def = DISEASES[diseaseId];
      if (!def) return;
      this.activeDiseases.push({
        id: diseaseId,
        name: def.name,
        icon: def.icon,
        turns: 0,
        severity: 'mild'
      });
      this.diseaseHistory.push({
        id: diseaseId,
        name: def.name,
        time: new Date().toLocaleTimeString(),
        type: 'contracted'
      });
    },

    removeDisease(diseaseId) {
      const idx = this.activeDiseases.findIndex(d => d.id === diseaseId);
      if (idx === -1) return;
      const disease = this.activeDiseases[idx];
      this.diseaseHistory.push({
        id: diseaseId,
        name: disease.name,
        time: new Date().toLocaleTimeString(),
        type: 'cured'
      });
      this.activeDiseases.splice(idx, 1);
      this.immunityMap[diseaseId] = IMMUNITY_DURATION;
      this.totalCuredCount++;
    },

    useMedicine(medicineId) {
      const medDef = MEDICINES[medicineId];
      if (!medDef) return { success: false, message: '未知的药物' };
      if (this.medicineInventory[medicineId] <= 0) {
        return { success: false, message: `${medDef.name}库存不足` };
      }

      let cured = false;
      let curedName = '';
      for (const diseaseId of medDef.cures) {
        if (this.hasDisease(diseaseId)) {
          curedName = DISEASES[diseaseId]?.name || diseaseId;
          this.removeDisease(diseaseId);
          cured = true;
          break;
        }
      }

      if (!cured) {
        return { success: false, message: `当前没有${medDef.cures.map(id => DISEASES[id]?.name).join('、')}症状，无需使用${medDef.name}` };
      }

      this.medicineInventory[medicineId]--;
      const hpRestore = medDef.hpRestore || 10;
      this.hp = Math.min(this.maxHp, this.hp + hpRestore);
      return { success: true, message: `使用了${medDef.name}，${curedName}已治愈！恢复${hpRestore}生命值` };
    },

    craftMedicine(medicineId, resources) {
      const medDef = MEDICINES[medicineId];
      if (!medDef) return { success: false, message: '未知的药物' };

      const cost = medDef.craftCost;
      for (const [resource, amount] of Object.entries(cost)) {
        const available = resource === 'herb' ? this.herb : (resources[resource] || 0);
        if (available < amount) {
          const label = resource === 'herb' ? '草药' : resource === 'water' ? '水' : resource === 'stone' ? '石头' : resource === 'food' ? '食物' : resource;
          return { success: false, message: `制作${medDef.name}需要${amount}${label}，不足` };
        }
      }

      for (const [resource, amount] of Object.entries(cost)) {
        if (resource === 'herb') {
          this.herb -= amount;
        } else {
          resources[resource] -= amount;
        }
      }

      this.medicineInventory[medicineId]++;
      return { success: true, message: `成功制作了${medDef.name}！` };
    },

    startRest(diseaseId, resources) {
      if (this.isResting) return { success: false, message: '正在休息中...' };
      if (!this.hasDisease(diseaseId)) return { success: false, message: '没有该疾病' };

      if (resources && (resources.food < 5 || resources.water < 5)) {
        return { success: false, message: '休息需要至少5食物和5水，资源不足' };
      }

      const def = DISEASES[diseaseId];
      this.isResting = true;
      this.restDiseaseId = diseaseId;
      this.restProgress = 0;
      let restHours = def.cureRestHours;
      if (this.shelterBuilt) restHours = Math.max(1, Math.floor(restHours * 0.7));
      this.restTarget = restHours;
      return { success: true, message: `开始休息治疗${def.name}，需要${restHours}个周期${this.shelterBuilt ? '（庇护所加成）' : ''}` };
    },

    tickRest(resources) {
      if (!this.isResting) return { completed: false };
      this.restProgress++;
      this.hp = Math.min(this.maxHp, this.hp + 3);

      if (resources) {
        resources.food = Math.max(0, resources.food - 2);
        resources.water = Math.max(0, resources.water - 2);
      }

      if (this.restProgress >= this.restTarget) {
        this.removeDisease(this.restDiseaseId);
        this.isResting = false;
        this.restProgress = 0;
        this.restTarget = 0;
        this.restDiseaseId = null;
        return { completed: true, message: '休息治疗完成，疾病已痊愈！获得了临时免疫力' };
      }
      return { completed: false };
    },

    advanceWeather() {
      this.weatherTimer++;
      if (this.weatherTimer >= 3) {
        this.weatherTimer = 0;
        this.dayCount++;
        const roll = Math.random();
        if (roll < 0.05) {
          this.weather = { ...WEATHER_TYPES.blizzard };
        } else if (roll < 0.15) {
          this.weather = { ...WEATHER_TYPES.storm };
        } else if (roll < 0.35) {
          this.weather = { ...WEATHER_TYPES.rainy };
        } else if (roll < 0.55) {
          this.weather = { ...WEATHER_TYPES.cloudy };
        } else {
          this.weather = { ...WEATHER_TYPES.sunny };
        }
      }
    },

    tickDiseases(resources) {
      let hpLoss = 0;
      for (const disease of this.activeDiseases) {
        const def = DISEASES[disease.id];
        if (def) {
          const severityMult = SEVERITY_LEVELS[disease.severity]?.multiplier || 1;
          hpLoss += Math.ceil((def.effects.hpDamage || 0) * severityMult);
        }
        disease.turns++;

        if (disease.severity !== 'severe' && def) {
          const threshold = SEVERITY_THRESHOLDS[disease.severity === 'mild' ? 'moderate' : 'severe'];
          if (disease.turns >= threshold && Math.random() < (def.severityProgressChance || 0.2)) {
            if (disease.severity === 'mild') {
              disease.severity = 'moderate';
            } else if (disease.severity === 'moderate') {
              disease.severity = 'severe';
            }
          }
        }

        if (def && !this.isResting) {
          this._tryNaturalRecovery(disease, resources);
        }
      }

      if (hpLoss > 0) {
        this.hp = Math.max(0, this.hp - hpLoss);
      }

      for (const diseaseId of Object.keys(this.immunityMap)) {
        if (this.immunityMap[diseaseId] > 0) {
          this.immunityMap[diseaseId]--;
        }
      }

      return hpLoss;
    },

    _tryNaturalRecovery(disease, resources) {
      const def = DISEASES[disease.id];
      if (!def) return;
      const condition = def.naturalRecoveryCondition || {};
      let conditionMet = true;

      if (condition.waterAbove && (!resources || resources.water < condition.waterAbove)) {
        conditionMet = false;
      }
      if (condition.foodAbove && (!resources || resources.food < condition.foodAbove)) {
        conditionMet = false;
      }
      if (condition.shelterBuilt && !this.shelterBuilt) {
        conditionMet = false;
      }

      if (conditionMet && Math.random() < def.naturalRecoveryChance) {
        if (disease.severity === 'severe') {
          disease.severity = 'moderate';
        } else if (disease.severity === 'moderate') {
          disease.severity = 'mild';
        } else {
          this.removeDisease(disease.id);
        }
      }
    },

    applyActionEfficiency(baseAmount) {
      return Math.floor(baseAmount * this.actionEfficiency);
    },

    applySpecificActionPenalty(actionName, baseAmount) {
      let eff = 1;
      for (const disease of this.activeDiseases) {
        const def = DISEASES[disease.id];
        if (def && def.effects.specificActionPenalty) {
          const penalty = def.effects.specificActionPenalty[actionName] || def.effects.specificActionPenalty.all || 0;
          if (penalty > 0) {
            eff *= penalty;
          }
        }
      }
      return Math.max(1, Math.floor(baseAmount * this.actionEfficiency * eff));
    },

    applyExtraConsume(resources) {
      const extra = this.extraConsume;
      if (extra.food > 0) resources.food = Math.max(0, resources.food - extra.food);
      if (extra.water > 0) resources.water = Math.max(0, resources.water - extra.water);
      return extra;
    },

    gatherHerb() {
      const amount = this.applyActionEfficiency(Math.floor(Math.random() * 3) + 1);
      this.herb += amount;
      return amount;
    },

    buildShelter() {
      this.shelterBuilt = true;
    },

    buildTools() {
      this.toolsBuilt = true;
    },

    getRestFoodCost() {
      return 2;
    },

    getRestWaterCost() {
      return 2;
    },

    resetAll() {
      this.hp = 100;
      this.maxHp = 100;
      this.activeDiseases = [];
      this.medicineInventory = {
        hydration_salve: 0,
        bandage: 0,
        cold_medicine: 0,
        fever_reducer: 0,
        antibiotic: 0,
        herb_poultice: 0,
        nutrient_paste: 0,
        panacea: 0
      };
      this.herb = 5;
      this.weather = { ...WEATHER_TYPES.sunny };
      this.weatherIndex = 0;
      this.weatherTimer = 0;
      this.isResting = false;
      this.restProgress = 0;
      this.restTarget = 0;
      this.restDiseaseId = null;
      this.dayCount = 1;
      this.diseaseHistory = [];
      this.shelterBuilt = false;
      this.toolsBuilt = false;
      this.immunityMap = {};
      this.totalCuredCount = 0;
    }
  }
});
