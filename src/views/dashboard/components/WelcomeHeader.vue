<template>
  <div class="welcome-header">
    <div class="welcome-content">
      <h2 class="welcome-title">{{ greeting }}, {{ userName }}</h2>
      <p class="welcome-desc">{{ welcomeDesc }}</p>
    </div>
    <div class="welcome-stats">
      <div class="stat-item">
        <el-icon class="stat-icon" :size="18"><Sunny /></el-icon>
        <div class="stat-info">
          <div class="stat-label">{{ t('dashboard.welcomeHeader.stat.weather') }}</div>
          <div class="stat-value">{{ weather }}</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon class="stat-icon" :size="18"><Clock /></el-icon>
        <div class="stat-info">
          <div class="stat-label">{{ t('dashboard.welcomeHeader.stat.systemTime') }}</div>
          <div class="stat-value">{{ currentTime }}</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon class="stat-icon" :size="18"><Calendar /></el-icon>
        <div class="stat-info">
          <div class="stat-label">{{ t('dashboard.welcomeHeader.stat.dataDate') }}</div>
          <div class="stat-value">{{ todayDate }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Sunny, Clock, Calendar } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  userName?: string
}>()

const { t } = useI18n()

const userName = computed(() => props.userName || t('dashboard.welcomeHeader.userFallback'))
const weather = computed(() => t('dashboard.welcomeHeader.weatherSunny'))

const currentTime = ref('')
let timer: number | null = null

function updateTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hh}:${mm}:${ss}`
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return t('dashboard.welcomeHeader.greeting.dawn')
  if (hour < 12) return t('dashboard.welcomeHeader.greeting.morning')
  if (hour < 14) return t('dashboard.welcomeHeader.greeting.noon')
  if (hour < 18) return t('dashboard.welcomeHeader.greeting.afternoon')
  return t('dashboard.welcomeHeader.greeting.evening')
})

const date = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const weekday = computed(() => {
  const names = t('dashboard.welcomeHeader.weekday') as unknown as string[]
  return names[new Date().getDay()]
})

const welcomeDesc = computed(() =>
  t('dashboard.welcomeHeader.desc', { date: date.value, weekday: weekday.value }),
)

const todayDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})
</script>

<style lang="scss" scoped>
.welcome-header {
  /* 渐变全部由 token 驱动，深浅主题自动切换 */
  background: linear-gradient(
    135deg,
    hsl(var(--hero-bg-from)) 0%,
    hsl(var(--hero-bg-via)) 50%,
    hsl(var(--hero-bg-to)) 100%
  );
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: hsl(var(--hero-fg));
  box-shadow: var(--hero-shadow);
  position: relative;
  overflow: hidden;
  transition: background 0.3s, color 0.3s, box-shadow 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, hsl(var(--hero-glow)), transparent 70%);
    pointer-events: none;
    transition: background 0.3s;
  }

  .welcome-content {
    position: relative;
    z-index: 1;

    .welcome-title {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 600;
      color: hsl(var(--hero-fg));
      transition: color 0.3s;
    }

    .welcome-desc {
      margin: 0;
      font-size: 13px;
      color: hsl(var(--hero-fg-muted));
      transition: color 0.3s;
    }
  }

  .welcome-stats {
    display: flex;
    gap: 28px;
    position: relative;
    z-index: 1;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;

      /* 三个图标各自绑定主题语义色 token，跟随主题走 */
      &:nth-child(1) .stat-icon { color: hsl(var(--success)); }
      &:nth-child(2) .stat-icon { color: hsl(var(--primary)); }
      &:nth-child(3) .stat-icon { color: hsl(var(--warning)); }

      .stat-icon {
        opacity: 0.95;
        transition: color 0.3s;
      }

      .stat-info {
        .stat-label {
          font-size: 11px;
          color: hsl(var(--hero-fg-dim));
          margin-bottom: 2px;
          transition: color 0.3s;
        }

        .stat-value {
          font-size: 14px;
          color: hsl(var(--hero-fg));
          font-weight: 600;
          font-family: 'Courier New', monospace;
          transition: color 0.3s;
        }
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .welcome-stats {
      width: 100%;
      justify-content: space-between;
      gap: 12px;
    }
  }
}
</style>
