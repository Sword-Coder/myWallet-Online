<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="text-h6 text-weight-bold q-mb-sm">Categories</div>
    <div class="text-subtitle2 text-grey q-mb-md">{{ currentMonth }}</div>

    <!-- List of Categories -->
    <transition-group name="fade-slide-up" tag="div">
      <q-card v-for="c in categories" :key="c._id" flat bordered class="q-mb-sm">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-chip dense :style="{ backgroundColor: c.color, color: 'white' }" class="q-mr-sm">
              {{ c.name[0].toUpperCase() }}
            </q-chip>
            <div>
              <div class="text-subtitle2">{{ c.name }}</div>
              <div class="text-caption text-grey">{{ c.type }}</div>
            </div>
          </div>

          <q-btn flat round dense icon="edit" color="primary" @click="editCategory(c)" />
        </q-card-section>
      </q-card>
    </transition-group>

    <div v-if="!categories.length" class="text-grey text-center q-mt-lg">No categories yet.</div>

    <!-- Floating Add Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="showAddDialog = true" />
    </q-page-sticky>

    <!-- Add/Edit Category Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{ editingCategory ? 'Edit Category' : 'Add Category' }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input filled v-model="form.name" label="Name" />
          <q-select filled v-model="form.type" :options="['Income', 'Expense']" label="Type" />
          <q-input filled v-model="form.color" label="Color (hex)" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveCategory" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

const showAddDialog = ref(false)
const editingCategory = ref(false)
const form = ref({ name: '', type: 'Expense', color: '#f44336' })

const categories = ref([
  { _id: 'cat1', name: 'Food', type: 'Expense', color: '#f44336' },
  { _id: 'cat2', name: 'Salary', type: 'Income', color: '#4caf50' },
  { _id: 'cat3', name: 'Transport', type: 'Expense', color: '#2196f3' },
])

function editCategory(c) {
  form.value = { ...c }
  editingCategory.value = true
  showAddDialog.value = true
}

function saveCategory() {
  if (editingCategory.value) {
    const idx = categories.value.findIndex((cat) => cat._id === form.value._id)
    if (idx !== -1) categories.value[idx] = { ...form.value }
  } else {
    const id = 'cat' + (categories.value.length + 1)
    categories.value.push({ _id: id, ...form.value })
  }
  editingCategory.value = false
  showAddDialog.value = false
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
