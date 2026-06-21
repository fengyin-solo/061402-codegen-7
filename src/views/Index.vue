<template>
  <div class="island-container">
    <div class="island-header">
      <h1>🏝️ 海岛生存</h1>
      <p>在荒岛上建立你的生存基地</p>
      <div class="header-info">
        <span class="weather-badge" :class="diseaseStore.weather.id">
          {{ diseaseStore.weather.icon }} {{ diseaseStore.weather.name }}
          <span v-if="diseaseStore.weather.danger > 0" class="danger-hint">
            危险度{{ Math.round(diseaseStore.effectiveWeatherDanger * 100) }}%
          </span>
        </span>
        <span class="day-badge">📅 第 {{ diseaseStore.dayCount }} 天</span>
        <span class="efficiency-badge" :class="efficiencyLevel">
          ⚡ 效率 {{ Math.round(diseaseStore.actionEfficiency * 100) }}%
        </span>
        <span v-if="diseaseStore.shelterBuilt" class="shelter-badge">🏠 庇护所</span>
        <span v-if="diseaseStore.toolsBuilt" class="tools-badge">🔧 工具</span>
      </div>
    </div>

    <div class="island-main">
      <div class="stats-panel">
        <div class="stat-card hp-card" :class="{ critical: diseaseStore.isCritical }">
          <div class="stat-icon">❤️</div>
          <div class="stat-content">
            <div class="stat-number">{{ diseaseStore.hp }}/{{ diseaseStore.maxHp }}</div>
            <el-progress :percentage="diseaseStore.hpPercent" :color="hpColor" :stroke-width="8" />
            <div class="stat-label">生命值</div>
          </div>
        </div>

        <div class="stat-card" :class="{ low: resources.food < 20 }">
          <div class="stat-icon">🍖</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.food }}</div>
            <div class="stat-label">食物</div>
            <div v-if="resources.food < 15" class="stat-warning">⚠️ 极度匮乏</div>
          </div>
        </div>

        <div class="stat-card" :class="{ low: resources.water < 20 }">
          <div class="stat-icon">💧</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.water }}</div>
            <div class="stat-label">淡水</div>
            <div v-if="resources.water < 20" class="stat-warning">⚠️ 严重不足</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🪵</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.wood }}</div>
            <div class="stat-label">木材</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⛏️</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.stone }}</div>
            <div class="stat-label">石头</div>
          </div>
        </div>

        <div class="stat-card herb-card">
          <div class="stat-icon">🌿</div>
          <div class="stat-content">
            <div class="stat-number">{{ diseaseStore.herb }}</div>
            <div class="stat-label">草药</div>
          </div>
        </div>
      </div>

      <div class="status-row">
        <div class="disease-panel" v-if="diseaseStore.activeDiseases.length > 0">
          <h3>⚠️ 状态异常 ({{ diseaseStore.activeDiseaseCount }})</h3>
          <div class="disease-list">
            <el-tooltip
              v-for="disease in diseaseStore.diseaseSummary"
              :key="disease.id"
              :content="getDiseaseTooltip(disease)"
              placement="top"
            >
              <div class="disease-tag" :class="[disease.id, 'severity-' + disease.severity.id]">
                {{ disease.icon }} {{ disease.name }}
                <span class="disease-severity" :style="{ color: disease.severity.color }">
                  [{{ disease.severity.name }}]
                </span>
                <span class="disease-turns">({{ disease.turns }}回合)</span>
                <span class="disease-effect" v-if="disease.effects">
                  -{{ disease.effects.efficiencyLoss }}%效率 / -{{ disease.effects.hpDamage }}HP
                </span>
              </div>
            </el-tooltip>
          </div>
        </div>

        <div class="disease-panel healthy" v-else>
          <h3>✅ 身体状态</h3>
          <div class="healthy-text">身体健康，状态良好</div>
        </div>

        <div class="immunity-panel" v-if="diseaseStore.activeImmunities.length > 0">
          <h3>🛡️ 临时免疫</h3>
          <div class="immunity-list">
            <div v-for="imm in diseaseStore.activeImmunities" :key="imm.id" class="immunity-tag">
              {{ imm.icon }} {{ imm.name }} <span class="imm-countdown">{{ imm.remaining }}回合</span>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-panel">
        <h3>📋 可执行操作</h3>
        <div class="action-grid">
          <div class="action-card" @click="gatherFood" :class="{ weakened: diseaseStore.actionEfficiency < 1, disabled: diseaseStore.isResting }">
            <div class="action-icon">🍓</div>
            <div class="action-title">采集食物</div>
            <div class="action-desc">在岛上寻找可食用的果实和动物</div>
            <div class="action-time">耗时: 30秒</div>
            <div class="action-yield" v-if="diseaseStore.actionEfficiency < 1">
              收益修正: ×{{ diseaseStore.actionEfficiency.toFixed(2) }}
            </div>
            <div class="action-penalty" v-if="hasSpecificPenalty('gatherFood')">
              🍖 额外惩罚: ×{{ getSpecificPenalty('gatherFood').toFixed(2) }}
            </div>
          </div>

          <div class="action-card" @click="collectWater" :class="{ weakened: diseaseStore.actionEfficiency < 1, disabled: diseaseStore.isResting }">
            <div class="action-icon">💧</div>
            <div class="action-title">收集淡水</div>
            <div class="action-desc">收集雨水或净化海水</div>
            <div class="action-time">耗时: 1分钟</div>
            <div class="action-yield" v-if="diseaseStore.actionEfficiency < 1">
              收益修正: ×{{ diseaseStore.actionEfficiency.toFixed(2) }}
            </div>
            <div class="action-penalty" v-if="hasSpecificPenalty('collectWater')">
              💧 额外惩罚: ×{{ getSpecificPenalty('collectWater').toFixed(2) }}
            </div>
          </div>

          <div class="action-card" @click="chopWood" :class="{ weakened: diseaseStore.actionEfficiency < 1, disabled: diseaseStore.isResting }">
            <div class="action-icon">🪓</div>
            <div class="action-title">砍伐木材</div>
            <div class="action-desc">砍伐树木获取木材资源</div>
            <div class="action-time">耗时: 2分钟</div>
            <div class="action-yield" v-if="diseaseStore.actionEfficiency < 1">
              收益修正: ×{{ diseaseStore.actionEfficiency.toFixed(2) }}
            </div>
            <div class="action-penalty" v-if="hasSpecificPenalty('chopWood')">
              🪓 额外惩罚: ×{{ getSpecificPenalty('chopWood').toFixed(2) }}
            </div>
          </div>

          <div class="action-card" @click="mineStone" :class="{ weakened: diseaseStore.actionEfficiency < 1, disabled: diseaseStore.isResting }">
            <div class="action-icon">⛏️</div>
            <div class="action-title">挖掘石头</div>
            <div class="action-desc">在岛上挖掘石头资源</div>
            <div class="action-time">耗时: 3分钟</div>
            <div class="action-yield" v-if="diseaseStore.actionEfficiency < 1">
              收益修正: ×{{ diseaseStore.actionEfficiency.toFixed(2) }}
            </div>
            <div class="action-penalty" v-if="hasSpecificPenalty('mineStone')">
              ⛏️ 额外惩罚: ×{{ getSpecificPenalty('mineStone').toFixed(2) }}
            </div>
          </div>

          <div class="action-card" @click="gatherHerb" :class="{ weakened: diseaseStore.actionEfficiency < 1, disabled: diseaseStore.isResting }">
            <div class="action-icon">🌿</div>
            <div class="action-title">采集草药</div>
            <div class="action-desc">在丛林中寻找草药，用于制药</div>
            <div class="action-time">耗时: 45秒</div>
            <div class="action-yield" v-if="diseaseStore.actionEfficiency < 1">
              收益修正: ×{{ diseaseStore.actionEfficiency.toFixed(2) }}
            </div>
            <div class="action-penalty" v-if="hasSpecificPenalty('gatherHerb')">
              🌿 额外惩罚: ×{{ getSpecificPenalty('gatherHerb').toFixed(2) }}
            </div>
          </div>

          <div class="action-card" @click="buildShelter" :class="{ disabled: diseaseStore.shelterBuilt || diseaseStore.isResting }">
            <div class="action-icon">🏠</div>
            <div class="action-title">建造庇护所</div>
            <div class="action-desc">建造安全的住所，减少恶劣天气致病风险，休息效率+30%</div>
            <div class="action-cost">需要: 50木材, 30石头</div>
            <div class="action-bonus" v-if="!diseaseStore.shelterBuilt">🏰 天气伤害减免50%</div>
            <div class="action-built" v-if="diseaseStore.shelterBuilt">✅ 已建造</div>
          </div>

          <div class="action-card" @click="craftTools" :class="{ disabled: diseaseStore.toolsBuilt || diseaseStore.isResting }">
            <div class="action-icon">🔨</div>
            <div class="action-title">制作工具</div>
            <div class="action-desc">制作更高效的生存工具，探索受伤概率-40%</div>
            <div class="action-cost">需要: 20木材, 10石头</div>
            <div class="action-built" v-if="diseaseStore.toolsBuilt">✅ 已制作</div>
          </div>

          <div class="action-card rest-card" @click="openRestDialog" :class="{ disabled: !diseaseStore.canRest }">
            <div class="action-icon">🛌</div>
            <div class="action-title">休息治疗</div>
            <div class="action-desc">休息以治疗疾病，期间无法行动，消耗食物和水</div>
            <div class="action-cost">每周期消耗: 2食物 + 2水</div>
            <div class="action-time" v-if="diseaseStore.activeDiseases.length > 0">
              可治疗: {{ diseaseStore.activeDiseases.map(d => d.name).join('、') }}
            </div>
            <div class="action-bonus" v-if="diseaseStore.shelterBuilt && diseaseStore.activeDiseases.length > 0">
              🏠 庇护所加速休息30%
            </div>
          </div>
        </div>
      </div>

      <div class="medicine-panel">
        <h3>💊 药物系统</h3>
        <div class="medicine-tabs">
          <div class="tab-section">
            <h4>药物背包</h4>
            <div class="medicine-grid">
              <div
                v-for="(med, medId) in medicineDefinitions"
                :key="medId"
                class="medicine-card"
                :class="{ available: diseaseStore.medicineInventory[medId] > 0, empty: diseaseStore.medicineInventory[medId] === 0 }"
              >
                <div class="med-icon">{{ med.icon }}</div>
                <div class="med-info">
                  <div class="med-name">{{ med.name }}</div>
                  <div class="med-count">×{{ diseaseStore.medicineInventory[medId] }}</div>
                  <div class="med-cures">治: {{ med.cures.map(id => diseaseDefinitions[id]?.name).join('、') }}</div>
                  <div class="med-restore">+{{ med.hpRestore }}HP</div>
                </div>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="diseaseStore.medicineInventory[medId] === 0 || !hasCurableDisease(medId)"
                  @click="useMedicine(medId)"
                >
                  使用
                </el-button>
              </div>
            </div>
          </div>

          <div class="tab-section">
            <h4>制药台</h4>
            <div class="craft-grid">
              <div
                v-for="(med, medId) in medicineDefinitions"
                :key="'craft-' + medId"
                class="craft-card"
              >
                <div class="med-icon">{{ med.icon }}</div>
                <div class="med-info">
                  <div class="med-name">{{ med.name }}</div>
                  <div class="craft-cost">
                    需要: {{ formatCraftCost(med.craftCost) }}
                  </div>
                </div>
                <el-button
                  size="small"
                  type="success"
                  :disabled="!canCraft(medId) || diseaseStore.isResting"
                  @click="craftMedicine(medId)"
                >
                  制作
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rest-panel" v-if="diseaseStore.isResting">
        <h3>🛌 休息中...</h3>
        <div class="rest-info">
          <div class="rest-disease">
            正在治疗: {{ diseaseStore.activeDiseases.find(d => d.id === diseaseStore.restDiseaseId)?.icon }}
            {{ diseaseStore.activeDiseases.find(d => d.id === diseaseStore.restDiseaseId)?.name }}
          </div>
          <el-progress :percentage="diseaseStore.restProgressPercent" :stroke-width="12" status="success" />
          <div class="rest-progress-text">
            {{ diseaseStore.restProgress }} / {{ diseaseStore.restTarget }} 周期
          </div>
          <div class="rest-cost-text">
            每周期消耗: 🍖2食物 + 💧2水
          </div>
          <div class="rest-shelter-text" v-if="diseaseStore.shelterBuilt">
            🏠 庇护所加成：休息效率+30%
          </div>
          <el-button size="small" type="warning" @click="cancelRest">中断休息</el-button>
        </div>
      </div>

      <div class="map-panel">
        <h3>🗺️ 海岛地图</h3>
        <div class="map-container">
          <div class="map-grid">
            <div v-for="(cell, index) in mapGrid" :key="index"
                 :class="'map-cell ' + cell.type + (cell.explored ? ' explored' : '')"
                 @click="exploreCell(index)">
              <span class="cell-icon">{{ cell.explored ? cell.icon : '❓' }}</span>
              <span class="cell-label" v-if="cell.explored">{{ cell.label }}</span>
            </div>
          </div>
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-icon">🌳</span>
              <span>森林</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🏔️</span>
              <span>山地</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🌊</span>
              <span>海洋</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🏠</span>
              <span>营地</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="message-log">
      <h3>📜 生存日志</h3>
      <div class="log-list">
        <div v-for="(msg, index) in messageLog" :key="index" class="log-item"
             :class="msg.type || 'normal'">
          <span class="log-time">{{ msg.time }}</span>
          <span class="log-content">{{ msg.content }}</span>
        </div>
      </div>
    </div>

    <el-dialog v-model="restDialogVisible" title="🛌 选择休息治疗" width="460px">
      <div class="rest-dialog-content">
        <p>选择要治疗的疾病：</p>
        <div class="rest-warning" v-if="resources.food < 10 || resources.water < 10">
          ⚠️ 食物或水不足，休息每周期消耗2食物+2水
        </div>
        <div v-for="disease in diseaseStore.diseaseSummary" :key="disease.id" class="rest-option">
          <div class="rest-option-info">
            <span class="rest-option-name">
              {{ disease.icon }} {{ disease.name }}
              <span class="rest-severity" :style="{ color: disease.severity.color }">[{{ disease.severity.name }}]</span>
            </span>
            <span class="rest-cycles">
              需{{ getRestCycles(disease.id) }}周期
              <span v-if="diseaseStore.shelterBuilt" class="rest-bonus">(庇护所-30%)</span>
            </span>
          </div>
          <el-button
            size="small"
            type="primary"
            :disabled="resources.food < 5 || resources.water < 5"
            @click="startRest(disease.id)"
          >
            开始休息
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="naturalRecoveryDialog" title="🌿 自然恢复" width="380px">
      <div class="natural-recovery-content">
        <p>保持良好的资源状态可以帮助身体自然恢复！</p>
        <div class="recovery-tips">
          <div class="tip-item" v-if="diseaseStore.hasDisease('dehydration')">
            💧 保持水分在50以上，脱水可自然恢复
          </div>
          <div class="tip-item" v-if="diseaseStore.hasDisease('malnutrition')">
            🍖 保持食物在50以上，营养不良可自然恢复
          </div>
          <div class="tip-item" v-if="diseaseStore.hasDisease('cold') || diseaseStore.hasDisease('fever')">
            🏠 建造庇护所，感冒/发烧可自然恢复
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import useDiseaseStore from '../store/modules/disease';

const diseaseStore = useDiseaseStore();

const diseaseDefinitions = computed(() => diseaseStore.diseaseDefinitions);
const medicineDefinitions = computed(() => diseaseStore.medicineDefinitions);

const resources = ref({
  food: 100,
  water: 100,
  wood: 100,
  stone: 100
});

const messageLog = ref([
  { time: '00:00', content: '你来到了一个荒岛，开始你的生存之旅吧！', type: 'normal' }
]);

const mapGrid = ref([
  { type: 'forest', icon: '🌳', label: '森林', explored: true },
  { type: 'forest', icon: '🌳', label: '森林', explored: true },
  { type: 'mountain', icon: '🏔️', label: '山地', explored: false },
  { type: 'ocean', icon: '🌊', label: '海洋', explored: false },
  { type: 'camp', icon: '🏠', label: '营地', explored: true },
  { type: 'forest', icon: '🌳', label: '森林', explored: false },
  { type: 'ocean', icon: '🌊', label: '海洋', explored: false },
  { type: 'mountain', icon: '🏔️', label: '山地', explored: false },
  { type: 'forest', icon: '🌳', label: '森林', explored: false }
]);

const restDialogVisible = ref(false);
const naturalRecoveryDialog = ref(false);

let gameTickInterval = null;

const hpColor = computed(() => {
  const pct = diseaseStore.hpPercent;
  if (pct > 60) return '#67c23a';
  if (pct > 30) return '#e6a23c';
  return '#f56c6c';
});

const efficiencyLevel = computed(() => {
  const eff = diseaseStore.actionEfficiency;
  if (eff >= 0.8) return 'good';
  if (eff >= 0.5) return 'medium';
  return 'bad';
});

const getDiseaseTooltip = (disease) => {
  const def = diseaseDefinitions.value[disease.id];
  if (!def) return '';
  let tip = def.description;
  if (disease.effects) {
    tip += `\n效率损失: ${disease.effects.efficiencyLoss}%`;
    tip += `\n生命损失: ${disease.effects.hpDamage}/回合`;
  }
  tip += `\n严重程度: ${disease.severity.name}`;
  return tip;
};

const getRestCycles = (diseaseId) => {
  const def = diseaseDefinitions.value[diseaseId];
  if (!def) return 0;
  let hours = def.cureRestHours;
  if (diseaseStore.shelterBuilt) hours = Math.max(1, Math.floor(hours * 0.7));
  return hours;
};

const formatCraftCost = (cost) => {
  const labels = { herb: '草药', water: '水', stone: '石头', food: '食物' };
  return Object.entries(cost).map(([k, v]) => `${v}${labels[k] || k}`).join(', ');
};

const hasSpecificPenalty = (actionName) => {
  for (const disease of diseaseStore.activeDiseases) {
    const def = diseaseDefinitions.value[disease.id];
    if (def && def.effects.specificActionPenalty) {
      const penalty = def.effects.specificActionPenalty[actionName] || def.effects.specificActionPenalty.all || 0;
      if (penalty > 0) return true;
    }
  }
  return false;
};

const getSpecificPenalty = (actionName) => {
  let eff = 1;
  for (const disease of diseaseStore.activeDiseases) {
    const def = diseaseDefinitions.value[disease.id];
    if (def && def.effects.specificActionPenalty) {
      const penalty = def.effects.specificActionPenalty[actionName] || def.effects.specificActionPenalty.all || 0;
      if (penalty > 0) eff *= penalty;
    }
  }
  return eff;
};

const addMessage = (content, type = 'normal') => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  messageLog.value.push({ time, content, type });
  if (messageLog.value.length > 50) {
    messageLog.value.shift();
  }
};

const performAction = (name, cost, gain, time, actionKey) => {
  if (diseaseStore.isResting) {
    ElMessage.warning('休息中，无法行动');
    return false;
  }

  for (const [resource, amount] of Object.entries(cost)) {
    const available = resource === 'herb' ? diseaseStore.herb : resources.value[resource];
    if (available < amount) {
      ElMessage.error(`资源不足，无法${name}`);
      return false;
    }
  }

  for (const [resource, amount] of Object.entries(cost)) {
    if (resource === 'herb') {
      diseaseStore.herb -= amount;
    } else {
      resources.value[resource] -= amount;
    }
  }

  const adjustedGain = {};
  for (const [resource, amount] of Object.entries(gain)) {
    if (actionKey && hasSpecificPenalty(actionKey)) {
      adjustedGain[resource] = diseaseStore.applySpecificActionPenalty(actionKey, amount);
    } else {
      adjustedGain[resource] = diseaseStore.applyActionEfficiency(amount);
    }
  }

  addMessage(`开始${name}...`);

  setTimeout(() => {
    for (const [resource, amount] of Object.entries(adjustedGain)) {
      if (resource === 'herb') {
        diseaseStore.herb += amount;
      } else {
        resources.value[resource] += amount;
      }
    }
    const gainStr = Object.entries(adjustedGain).map(([k, v]) => {
      const label = k === 'herb' ? '草药' : k;
      return `${v}${label}`;
    }).join('、');
    addMessage(`${name}完成！获得了${gainStr}`, 'success');

    if (diseaseStore.actionEfficiency < 1) {
      addMessage(`⚠️ 因疾病影响，基础效率降低为${Math.round(diseaseStore.actionEfficiency * 100)}%`, 'warning');
    }

    if (actionKey && hasSpecificPenalty(actionKey)) {
      const penalty = getSpecificPenalty(actionKey);
      addMessage(`⚠️ 特定行动惩罚：额外×${penalty.toFixed(2)}`, 'warning');
    }

    processTickEffects();
    checkGameOver();
    ElMessage.success(`${name}完成！`);
  }, time);

  return true;
};

const processTickEffects = () => {
  diseaseStore.advanceWeather();
  diseaseStore.checkDiseaseTriggers(resources.value);
  const hpLoss = diseaseStore.tickDiseases(resources.value);
  if (hpLoss > 0) {
    addMessage(`💔 疾病造成${hpLoss}点生命值损失`, 'danger');
  }
  const extra = diseaseStore.applyExtraConsume(resources.value);
  if (extra.food > 0 || extra.water > 0) {
    addMessage(`⚠️ 疾病额外消耗了${extra.food}食物、${extra.water}淡水`, 'warning');
  }

  const immunities = diseaseStore.activeImmunities;
  if (immunities.length > 0) {
    addMessage(`🛡️ 免疫保护中: ${immunities.map(i => `${i.name}(${i.remaining})`).join('、')}`, 'info');
  }
};

const gatherFood = () => {
  performAction('采集食物', {}, { food: 20 }, 30000, 'gatherFood');
};

const collectWater = () => {
  performAction('收集淡水', {}, { water: 30 }, 60000, 'collectWater');
};

const chopWood = () => {
  performAction('砍伐木材', {}, { wood: 15 }, 120000, 'chopWood');
};

const mineStone = () => {
  performAction('挖掘石头', {}, { stone: 10 }, 180000, 'mineStone');
};

const gatherHerb = () => {
  performAction('采集草药', {}, { herb: 2 }, 45000, 'gatherHerb');
};

const buildShelter = () => {
  if (diseaseStore.shelterBuilt) {
    ElMessage.info('庇护所已经建造过了');
    return;
  }
  if (performAction('建造庇护所', { wood: 50, stone: 30 }, {}, 300000)) {
    setTimeout(() => {
      diseaseStore.buildShelter();
      addMessage('🏠 庇护所建造完成！天气伤害减免50%，休息效率+30%', 'success');
      ElMessage.success('庇护所建造完成！获得天气保护与休息加成');
    }, 300000);
  }
};

const craftTools = () => {
  if (diseaseStore.toolsBuilt) {
    ElMessage.info('工具已经制作过了');
    return;
  }
  if (performAction('制作工具', { wood: 20, stone: 10 }, {}, 120000)) {
    setTimeout(() => {
      diseaseStore.buildTools();
      addMessage('🔧 工具制作完成！探索受伤概率降低40%', 'success');
      ElMessage.success('工具制作完成！探索更安全了');
    }, 120000);
  }
};

const useMedicine = (medicineId) => {
  const result = diseaseStore.useMedicine(medicineId);
  if (result.success) {
    ElMessage.success(result.message);
    addMessage(result.message, 'cure');
    addMessage('🛡️ 获得了该疾病的临时免疫力（5回合）', 'info');
  } else {
    ElMessage.warning(result.message);
    addMessage(result.message, 'warning');
  }
};

const hasCurableDisease = (medicineId) => {
  const med = medicineDefinitions.value[medicineId];
  if (!med) return false;
  return med.cures.some(diseaseId => diseaseStore.hasDisease(diseaseId));
};

const canCraft = (medicineId) => {
  const med = medicineDefinitions.value[medicineId];
  if (!med) return false;
  for (const [resource, amount] of Object.entries(med.craftCost)) {
    const available = resource === 'herb' ? diseaseStore.herb : (resources.value[resource] || 0);
    if (available < amount) return false;
  }
  return true;
};

const craftMedicine = (medicineId) => {
  const result = diseaseStore.craftMedicine(medicineId, resources.value);
  if (result.success) {
    ElMessage.success(result.message);
    addMessage(result.message, 'success');
  } else {
    ElMessage.warning(result.message);
    addMessage(result.message, 'warning');
  }
};

const openRestDialog = () => {
  if (!diseaseStore.canRest) {
    ElMessage.info('当前无需休息治疗');
    return;
  }
  restDialogVisible.value = true;
};

const startRest = (diseaseId) => {
  const result = diseaseStore.startRest(diseaseId, resources.value);
  if (result.success) {
    ElMessage.success(result.message);
    addMessage(result.message, 'cure');
    restDialogVisible.value = false;
  } else {
    ElMessage.warning(result.message);
    addMessage(result.message, 'warning');
  }
};

const cancelRest = () => {
  diseaseStore.isResting = false;
  diseaseStore.restProgress = 0;
  diseaseStore.restTarget = 0;
  diseaseStore.restDiseaseId = null;
  addMessage('中断了休息治疗', 'warning');
  ElMessage.warning('已中断休息');
};

const exploreCell = (index) => {
  if (diseaseStore.isResting) {
    ElMessage.warning('休息中，无法探索');
    return;
  }

  const cell = mapGrid.value[index];
  if (cell.explored) {
    ElMessage.info('这个区域已经探索过了');
    return;
  }

  ElMessageBox.confirm(
    `确定要探索这个区域吗？可能会遇到危险或发现资源。${diseaseStore.toolsBuilt ? '\n🔧 工具保护：受伤概率降低40%' : ''}`,
    '探索未知区域',
    {
      confirmButtonText: '开始探索',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    addMessage(`开始探索${cell.icon}区域...`);

    setTimeout(() => {
      cell.explored = true;

      const injured = diseaseStore.checkInjuryOnExplore();
      if (injured) {
        addMessage('🩸 探索中受伤了！出现了外伤症状', 'danger');
        ElMessage.error('探索中受伤了！');
      }

      const random = Math.random();
      if (random < 0.25) {
        const foodGain = diseaseStore.applySpecificActionPenalty('exploreCell', Math.floor(Math.random() * 20) + 10);
        resources.value.food += foodGain;
        addMessage(`探索发现了食物！获得${foodGain}食物`, 'success');
        ElMessage.success(`探索发现了食物！获得${foodGain}食物`);
      } else if (random < 0.45) {
        const woodGain = diseaseStore.applyActionEfficiency(Math.floor(Math.random() * 15) + 5);
        resources.value.wood += woodGain;
        addMessage(`探索发现了木材！获得${woodGain}木材`, 'success');
        ElMessage.success(`探索发现了木材！获得${woodGain}木材`);
      } else if (random < 0.6) {
        const stoneGain = diseaseStore.applyActionEfficiency(Math.floor(Math.random() * 10) + 5);
        resources.value.stone += stoneGain;
        addMessage(`探索发现了石头！获得${stoneGain}石头`, 'success');
        ElMessage.success(`探索发现了石头！获得${stoneGain}石头`);
      } else if (random < 0.75) {
        const herbGain = diseaseStore.applySpecificActionPenalty('gatherHerb', Math.floor(Math.random() * 3) + 1);
        diseaseStore.herb += herbGain;
        addMessage(`探索发现了草药！获得${herbGain}草药`, 'success');
        ElMessage.success(`探索发现了草药！获得${herbGain}草药`);
      } else {
        resources.value.food -= 10;
        resources.value.water -= 10;
        addMessage(`探索遇到了危险！损失了10食物和10水`, 'danger');
        ElMessage.warning(`探索遇到了危险！损失了10食物和10水`);
      }

      processTickEffects();
      checkGameOver();
    }, 5000);
  }).catch(() => {
    addMessage('取消了探索');
  });
};

const checkGameOver = () => {
  if (diseaseStore.hp <= 0) {
    ElMessageBox.alert(
      `你的生命值耗尽了！在第${diseaseStore.dayCount}天倒下。\n曾患疾病: ${diseaseStore.diseaseHistory.filter(d => d.type === 'contracted').map(d => d.name).join('、') || '无'}\n累计治愈: ${diseaseStore.totalCuredCount}次`,
      '游戏结束',
      {
        confirmButtonText: '重新开始',
        type: 'error'
      }
    ).then(() => {
      resetGame();
    });
  } else if (resources.value.food <= 0 || resources.value.water <= 0) {
    ElMessageBox.alert(
      '你的食物或水耗尽了，游戏结束！',
      '游戏结束',
      {
        confirmButtonText: '重新开始',
        type: 'error'
      }
    ).then(() => {
      resetGame();
    });
  }
};

const resetGame = () => {
  resources.value = { food: 100, water: 100, wood: 100, stone: 100 };
  diseaseStore.resetAll();
  mapGrid.value = [
    { type: 'forest', icon: '🌳', label: '森林', explored: true },
    { type: 'forest', icon: '🌳', label: '森林', explored: true },
    { type: 'mountain', icon: '🏔️', label: '山地', explored: false },
    { type: 'ocean', icon: '🌊', label: '海洋', explored: false },
    { type: 'camp', icon: '🏠', label: '营地', explored: true },
    { type: 'forest', icon: '🌳', label: '森林', explored: false },
    { type: 'ocean', icon: '🌊', label: '海洋', explored: false },
    { type: 'mountain', icon: '🏔️', label: '山地', explored: false },
    { type: 'forest', icon: '🌳', label: '森林', explored: false }
  ];
  messageLog.value = [{ time: '00:00', content: '重新开始游戏！', type: 'normal' }];
};

const gameTick = () => {
  resources.value.food = Math.max(0, resources.value.food - 2);
  resources.value.water = Math.max(0, resources.value.water - 3);

  if (diseaseStore.isResting) {
    const result = diseaseStore.tickRest(resources.value);
    if (result.completed) {
      addMessage(result.message, 'cure');
      ElMessage.success(result.message);
    } else {
      addMessage('🛌 休息中... 消耗了2食物和2水', 'info');
    }
  }

  diseaseStore.advanceWeather();
  diseaseStore.checkDiseaseTriggers(resources.value);
  const hpLoss = diseaseStore.tickDiseases(resources.value);
  if (hpLoss > 0) {
    addMessage(`💔 疾病造成${hpLoss}点生命值损失`, 'danger');
  }
  const extra = diseaseStore.applyExtraConsume(resources.value);
  if (extra.food > 0 || extra.water > 0) {
    addMessage(`⚠️ 疾病额外消耗了${extra.food}食物、${extra.water}淡水`, 'warning');
  }

  if (diseaseStore.activeDiseases.length > 0) {
    const diseaseNames = diseaseStore.diseaseSummary.map(d => `${d.icon}${d.name}[${d.severity.name}]`).join('、');
    addMessage(`当前患病: ${diseaseNames}`, 'warning');
  }

  const immunities = diseaseStore.activeImmunities;
  if (immunities.length > 0) {
    addMessage(`🛡️ 免疫中: ${immunities.map(i => `${i.name}(${i.remaining})`).join('、')}`, 'info');
  }

  if (diseaseStore.weather.danger > 0) {
    const prot = diseaseStore.shelterBuilt ? '（庇护所减免50%）' : '';
    addMessage(`🌤️ 当前天气${diseaseStore.weather.name}，致病危险度${Math.round(diseaseStore.effectiveWeatherDanger * 100)}%${prot}`, 'info');
  }

  checkGameOver();
};

onMounted(() => {
  addMessage('欢迎来到海岛生存游戏！注意保持水分和健康状态。', 'normal');
  addMessage('💡 提示：建造庇护所可以减少恶劣天气致病风险', 'info');
  addMessage('💡 提示：保持资源充足可以让疾病自然恢复', 'info');
  gameTickInterval = setInterval(gameTick, 30000);
});

onUnmounted(() => {
  if (gameTickInterval) {
    clearInterval(gameTickInterval);
  }
});
</script>

<style scoped>
.island-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.island-header {
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.island-header h1 {
  font-size: 48px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.island-header p {
  font-size: 18px;
  margin: 0 0 12px 0;
  opacity: 0.9;
}

.header-info {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.weather-badge,
.day-badge,
.efficiency-badge,
.shelter-badge,
.tools-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  color: white;
}

.danger-hint {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.weather-badge.storm { background: rgba(100,100,180,0.6); }
.weather-badge.blizzard { background: rgba(100,150,220,0.6); }
.weather-badge.rainy { background: rgba(80,130,200,0.5); }

.efficiency-badge.good { background: rgba(103,194,58,0.5); }
.efficiency-badge.medium { background: rgba(230,162,60,0.5); }
.efficiency-badge.bad { background: rgba(245,108,108,0.5); }

.shelter-badge { background: rgba(103,194,58,0.5); }
.tools-badge { background: rgba(64,158,255,0.5); }

.island-main {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card.critical {
  border: 2px solid #f56c6c;
  animation: pulse 1.5s infinite;
}

.stat-card.low {
  border-left: 3px solid #e6a23c;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(245,108,108,0.3); }
  50% { box-shadow: 0 4px 20px rgba(245,108,108,0.7); }
}

.stat-icon {
  font-size: 36px;
  margin-right: 12px;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-warning {
  font-size: 11px;
  color: #f56c6c;
  font-weight: 600;
  margin-top: 2px;
}

.hp-card .stat-content .el-progress {
  margin-bottom: 4px;
}

.herb-card {
  border-left: 3px solid #67c23a;
}

.status-row {
  margin-bottom: 20px;
}

.disease-panel {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.disease-panel h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.disease-panel.healthy {
  border-left: 4px solid #67c23a;
}

.disease-panel.healthy .healthy-text {
  color: #67c23a;
  font-weight: 600;
  font-size: 15px;
}

.disease-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.disease-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: default;
}

.disease-tag.dehydration { background: #fdf6ec; color: #e6a23c; border: 1px solid #e6a23c; }
.disease-tag.injury { background: #fef0f0; color: #f56c6c; border: 1px solid #f56c6c; }
.disease-tag.cold { background: #f0f9eb; color: #67c23a; border: 1px solid #67c23a; }
.disease-tag.fever { background: #fef0f0; color: #e63946; border: 1px solid #e63946; }
.disease-tag.infection { background: #f4f4f5; color: #909399; border: 1px solid #909399; }
.disease-tag.malnutrition { background: #fdf6ec; color: #b8860b; border: 1px solid #b8860b; }

.disease-tag.severity-moderate {
  border-width: 2px;
  box-shadow: 0 0 6px rgba(245,108,108,0.3);
}

.disease-tag.severity-severe {
  border-width: 3px;
  box-shadow: 0 0 10px rgba(245,108,108,0.5);
  animation: diseasePulse 2s infinite;
}

@keyframes diseasePulse {
  0%, 100% { box-shadow: 0 0 6px rgba(245,108,108,0.4); }
  50% { box-shadow: 0 0 14px rgba(245,108,108,0.8); }
}

.disease-severity {
  font-size: 12px;
  font-weight: 700;
}

.disease-turns {
  font-size: 12px;
  opacity: 0.7;
}

.disease-effect {
  font-size: 11px;
  opacity: 0.8;
}

.immunity-panel {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #a5d6a7;
}

.immunity-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #2e7d32;
}

.immunity-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.immunity-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255,255,255,0.7);
  color: #2e7d32;
  border: 1px solid #81c784;
}

.imm-countdown {
  font-size: 11px;
  color: #66bb6a;
}

.actions-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.actions-panel h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  color: #333;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.action-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.action-card.weakened {
  background: #fff8f0;
  border-color: #e6a23c;
}

.action-card.weakened:hover {
  border-color: #e6a23c;
}

.action-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-card.rest-card {
  background: #f0f5ff;
  border-color: #409eff;
}

.action-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.action-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.action-time,
.action-cost {
  font-size: 12px;
  color: #999;
}

.action-yield {
  font-size: 12px;
  color: #e6a23c;
  font-weight: 600;
  margin-top: 4px;
}

.action-penalty {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 600;
  margin-top: 2px;
}

.action-bonus {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
  margin-top: 4px;
}

.action-built {
  font-size: 13px;
  color: #67c23a;
  font-weight: 600;
  margin-top: 4px;
}

.medicine-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.medicine-panel h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  color: #333;
}

.medicine-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.tab-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.medicine-grid,
.craft-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.medicine-card,
.craft-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.medicine-card.available {
  background: #f0f9eb;
  border-color: #b3e19d;
}

.medicine-card.empty {
  background: #fafafa;
  opacity: 0.6;
}

.med-icon {
  font-size: 28px;
}

.med-info {
  flex: 1;
  min-width: 0;
}

.med-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.med-count {
  font-size: 13px;
  color: #409eff;
  font-weight: bold;
}

.med-cures {
  font-size: 11px;
  color: #999;
}

.med-restore {
  font-size: 11px;
  color: #67c23a;
  font-weight: 600;
}

.craft-cost {
  font-size: 12px;
  color: #e6a23c;
}

.craft-card {
  background: #fafff0;
}

.rest-panel {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #67c23a;
}

.rest-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.rest-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rest-disease {
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.rest-progress-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.rest-cost-text {
  font-size: 13px;
  color: #e6a23c;
  text-align: center;
}

.rest-shelter-text {
  font-size: 13px;
  color: #67c23a;
  text-align: center;
  font-weight: 600;
}

.rest-dialog-content {
  padding: 10px 0;
}

.rest-warning {
  background: #fdf6ec;
  border: 1px solid #e6a23c;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  color: #e6a23c;
  font-size: 13px;
}

.rest-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f8f9fa;
}

.rest-option-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rest-option-name {
  font-weight: 600;
  font-size: 15px;
}

.rest-severity {
  font-weight: 700;
}

.rest-cycles {
  font-size: 13px;
  color: #909399;
}

.rest-bonus {
  color: #67c23a;
  font-weight: 600;
}

.natural-recovery-content {
  padding: 10px 0;
}

.recovery-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #b3e19d;
  font-size: 13px;
  color: #333;
}

.map-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-panel h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  color: #333;
}

.map-container {
  text-align: center;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(3, 120px);
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.map-cell {
  width: 120px;
  height: 120px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #ddd;
}

.map-cell:hover {
  transform: scale(1.05);
  border-color: #667eea;
}

.map-cell.explored {
  background: #f8f9fa;
}

.map-cell .cell-icon {
  font-size: 36px;
}

.map-cell .cell-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-icon {
  font-size: 24px;
}

.message-log {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-log h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  color: #333;
}

.log-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
}

.log-item {
  display: flex;
  margin-bottom: 6px;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.log-item.success { border-left: 3px solid #67c23a; }
.log-item.warning { border-left: 3px solid #e6a23c; }
.log-item.danger { border-left: 3px solid #f56c6c; }
.log-item.cure { border-left: 3px solid #409eff; background: #f0f5ff; }
.log-item.info { border-left: 3px solid #909399; }

.log-time {
  font-weight: bold;
  color: #409eff;
  margin-right: 12px;
  min-width: 50px;
  font-size: 13px;
}

.log-content {
  flex: 1;
  color: #555;
  font-size: 13px;
}

@media (max-width: 768px) {
  .island-header h1 {
    font-size: 32px;
  }

  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .medicine-tabs {
    grid-template-columns: 1fr;
  }

  .map-grid {
    grid-template-columns: repeat(3, 90px);
  }

  .map-cell {
    width: 90px;
    height: 90px;
  }
}
</style>
