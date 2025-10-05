<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-h6 text-weight-bold q-mb-sm">Budgets</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="b in budgets" :key="b.category" flat bordered class="q-mb-sm">
        <q-card-section>
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ b.category }}</div>
              <div class="text-caption text-grey">{{ b.limit }} PHP limit</div>
            </div>
            <div class="text-right">
              <div
                :class="b.spent > b.limit ? 'text-negative' : 'text-primary'"
                class="text-subtitle2"
              >
                {{ b.spent }} / {{ b.limit }}
              </div>
              <q-linear-progress
                :value="b.spent / b.limit"
                color="primary"
                track-color="grey-3"
                size="10px"
                class="q-mt-xs rounded-borders"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </transition-group>

    <div v-if="!budgets.length" class="text-grey text-center q-mt-lg">No budgets defined yet.</div>

    <!-- Floating Add Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="addBudget" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

const budgets = ref([
  { category: 'Food', limit: 5000, spent: 3200 },
  { category: 'Transport', limit: 2000, spent: 600 },
  { category: 'Entertainment', limit: 3000, spent: 2800 },
])

function addBudget() {
  budgets.value.push({ category: 'New Category', limit: 1000, spent: 0 })
}

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
