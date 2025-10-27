<template>
  <div class="flex flex-center" style="min-height: 100vh">
    <q-card class="q-pa-lg" style="min-width: 400px">
      <q-card-section>
        <div class="text-h5 text-center q-mb-lg">Login</div>

        <!-- Online status indicator -->
        <div v-if="!authStore.isOnline" class="q-mb-md">
          <q-banner class="text-white bg-red" rounded>
            <template v-slot:avatar>
              <q-icon name="wifi_off" />
            </template>
            You must be online to sign in with Google
          </q-banner>
        </div>

        <!-- Google Login Button -->
        <div class="q-mb-md">
          <q-btn
            color="white"
            text-color="dark"
            class="full-width"
            @click="handleGoogleLogin"
            :loading="googleLoading"
            :disable="!authStore.isOnline"
          >
            <template v-slot:default>
              <q-avatar size="24px" class="q-mr-sm">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              </q-avatar>
              Sign in with Google
            </template>
          </q-btn>
        </div>

        <q-separator class="q-mb-md">
          <q-chip dense color="grey-3" text-color="dark">OR</q-chip>
        </q-separator>

        <!-- Traditional Login Form -->
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            required
            :rules="[(val) => (val && val.includes('@')) || 'Please enter a valid email']"
          />
          <q-input v-model="form.password" label="Password" type="password" required />
          <q-btn type="submit" color="primary" class="full-width" :loading="loading">Login</q-btn>
        </q-form>
        <div class="text-center q-mt-md">
          <q-btn flat color="primary" @click="$router.push('/signup')"
            >Don't have an account? Sign Up</q-btn
          >
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const $googleAuth = inject('$googleAuth')

const form = ref({
  email: '',
  password: '',
})
const loading = ref(false)
const googleLoading = ref(false)

async function handleGoogleLogin() {
  if (!authStore.isOnline) {
    $q.notify({
      color: 'negative',
      message: 'You must be online to sign in with Google',
      icon: 'wifi_off',
    })
    return
  }

  googleLoading.value = true
  try {
    if (!$googleAuth) {
      throw new Error('Google Auth not available')
    }

    const userInfo = await $googleAuth.signIn()

    authStore.user = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      provider: 'google',
    }
    authStore.isAuthenticated = true
    localStorage.setItem('user', JSON.stringify(authStore.user))

    $q.notify({
      color: 'positive',
      message: 'Signed in successfully!',
      icon: 'check_circle',
    })
    router.push('/home')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Google login failed',
      icon: 'error',
    })
  } finally {
    googleLoading.value = false
  }
}

function handleLogin() {
  loading.value = true
  try {
    authStore.login(form.value.email, form.value.password)
    $q.notify({
      color: 'positive',
      message: 'Signed in successfully!',
      icon: 'check_circle',
    })
    router.push('/home')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Login failed',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
