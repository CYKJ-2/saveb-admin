<template>
  <svg
    :class="['svg-icon', className]"
    :style="{ width: size + 'px', height: size + 'px' }"
    aria-hidden="true"
  >
    <use :xlink:href="'#icon-' + icon" :href="'#icon-' + icon" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    required: true
  },
  className: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 16
  }
})
</script>

<style scoped>
.svg-icon {
  fill: currentColor;
  vertical-align: -0.15em;
  overflow: hidden;
}
</style>
