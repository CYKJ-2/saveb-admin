<script setup lang="ts">
import ApiPagination from '@/components/common/ApiPagination.vue'
defineOptions({ inheritAttrs: false })
</script>
<template><ApiPagination v-bind="$attrs" /></template>
