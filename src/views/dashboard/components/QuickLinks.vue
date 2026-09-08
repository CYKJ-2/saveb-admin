<template>
  <div class="quick-links">
    <div class="card-header">
      <span class="title-text">{{ t('dashboard.quickLinks.title') }}</span>
    </div>
    <div class="links-grid">
      <div
        v-for="link in links"
        :key="link.title"
        class="link-item"
        :style="{ '--color': link.color }"
        @click="navigateTo(link.url)"
      >
        <div class="link-icon">
          <el-icon :size="22">
            <component :is="link.icon" />
          </el-icon>
        </div>
        <span class="link-title">{{ link.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { quickLinks } from '../data/mockData'

const router = useRouter()
const { t } = useI18n()
const links = quickLinks

function navigateTo(url: string) {
  if (url.startsWith('http')) {
    window.open(url, '_blank')
  } else {
    router.push(url)
  }
}
</script>

<style lang="scss" scoped>
.quick-links {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 4px hsl(0 0% 0% / 0.15);
  transition: background-color 0.2s, border-color 0.2s;

  .card-header {
    margin-bottom: 16px;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
  }

  .links-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .link-item {
    --color: hsl(var(--primary));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
    border-radius: 8px;
    background: hsl(var(--primary) / 0.06);
    border: 1px solid hsl(var(--primary) / 0.18);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: hsl(var(--primary) / 0.12);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px hsl(0 0% 0% / 0.2);

      .link-icon {
        transform: scale(1.1);
      }
    }

    .link-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: transform 0.25s ease;
    }

    .link-title {
      font-size: 12px;
      color: hsl(var(--foreground));
      font-weight: 500;
      text-align: center;
    }
  }
}
</style>
