<template>
  <!-- Home Button -->
  <div class="home-button-container">
    <q-btn
      flat
      round
      color="primary"
      icon="home"
      size="md"
      @click="$router.push('/landing')"
      class="home-btn"
    >
      <q-tooltip>Home</q-tooltip>
    </q-btn>
  </div>

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
          <div id="google-login-button" class="google-button-container"></div>
          <q-btn
            v-if="!googleAuthLoaded"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const form = ref({
  email: '',
  password: '',
})
const loading = ref(false)
const googleLoading = ref(false)
const googleAuthLoaded = ref(false)

onMounted(() => {
  // Check if Google Auth is loaded and render the button
  const checkGoogleAuth = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      googleAuthLoaded.value = true
      window.google.accounts.id.renderButton(document.getElementById('google-login-button'), {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        ux_mode: 'popup',
      })
    } else {
      // Retry after a short delay
      setTimeout(checkGoogleAuth, 100)
    }
  }
  checkGoogleAuth()
})

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
    await authStore.loginWithGoogle()
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

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(form.value.email, form.value.password)
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

<style scoped>
.google-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 44px; /* Google button minimum height */
}

.google-button-container > div {
  margin: 0 auto;
}

.home-button-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.home-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.home-btn:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
}
</style>
