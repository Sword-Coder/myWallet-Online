<template>
  <div class="flex flex-center" style="min-height: 100vh">
    <q-card class="q-pa-lg" style="min-width: 400px">
      <q-card-section>
        <div class="text-h5 text-center q-mb-lg">{{ title }}</div>

        <div v-if="loading" class="text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-md">Verifying your email...</div>
        </div>

        <div v-else-if="success" class="text-center">
          <q-icon name="check_circle" color="positive" size="4em" />
          <div class="q-mt-md text-h6 text-positive">Email verified successfully!</div>
          <div class="q-mt-sm">You can now log in to your account.</div>
          <q-btn color="primary" class="q-mt-lg full-width" @click="$router.push('/login')">
            Go to Login
          </q-btn>
        </div>

        <div v-else class="text-center">
          <q-icon name="error" color="negative" size="4em" />
          <div class="q-mt-md text-h6 text-negative">Verification failed</div>
          <div class="q-mt-sm">{{ errorMessage }}</div>
          <q-btn color="primary" class="q-mt-lg full-width" @click="$router.push('/signup')">
            Back to Signup
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const route = useRoute()
const authStore = useAuthStore()
const $q = useQuasar()

const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')
const title = ref('Email Verification')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    loading.value = false
    errorMessage.value = 'Invalid verification link'
    return
  }

  try {
    await authStore.verifyEmail(token)
    success.value = true
    $q.notify({
      color: 'positive',
      message: 'Email verified successfully!',
      icon: 'check_circle',
    })
  } catch (error) {
    errorMessage.value = error.message || 'Verification failed'
    $q.notify({
      color: 'negative',
      message: error.message || 'Verification failed',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
})
</script>
