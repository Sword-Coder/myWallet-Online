<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-h6 text-weight-bold q-mb-sm">Analysis</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <transition-group name="fade-slide-up" tag="div">
      <q-card flat bordered class="q-mb-md" key="breakdown">
        <q-card-section>
          <div class="text-subtitle2">Expense Breakdown</div>
          <div class="text-caption text-grey">by category</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="text-center text-grey q-pa-lg">
          <q-icon name="pie_chart_outline" size="64px" class="q-mb-sm" />
          <div>No data yet</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mb-md" key="trend">
        <q-card-section>
          <div class="text-subtitle2">Income vs Expense Trend</div>
          <div class="text-caption text-grey">Last 6 months</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="text-center text-grey q-pa-lg">
          <q-icon name="show_chart" size="64px" class="q-mb-sm" />
          <div>No data yet</div>
        </q-card-section>
      </q-card>
    </transition-group>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'

const currentMonth = computed(() =>
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
)
</script>

<style scoped>
.fade-slide-up-enter-active {
  transition: all 0.3s ease;
}
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
