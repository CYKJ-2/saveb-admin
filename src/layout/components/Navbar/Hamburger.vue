<template>
  <button
    type="button"
    class="hamburger"
    :aria-label="label"
    :title="label"
    :aria-expanded="isActive"
    aria-controls="app-sidebar"
    @click="toggleClick"
  >
    <el-icon :size="20" aria-hidden="true">
      <Fold v-if="isActive" />
      <Expand v-else />
    </el-icon>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isActive: boolean
}>()
const { t } = useI18n()
const label = computed(() => t(`layout.navbar.${props.isActive ? 'collapseSidebar' : 'expandSidebar'}`))

const emit = defineEmits<{
  toggleClick: []
}>()

function toggleClick() {
  emit('toggleClick')
}
</script>

<style lang="scss" scoped>
.hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s;
}

.hamburger:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.hamburger:hover {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}
</style>
