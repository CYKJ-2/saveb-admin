<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <!-- 路由就绪后直接替换内容，避免 out-in 留白及 transform 改变弹层定位。 -->
      <component :is="Component" :key="route.path" />
    </router-view>
  </section>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.app-main {
  width: 100%;
  position: relative;
  background-color: transparent;
}

</style>
