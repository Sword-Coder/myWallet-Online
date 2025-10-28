<template>
  <div class="flex flex-center" style="min-height: 100vh">
    <q-card class="q-pa-lg" style="min-width: 400px">
      <q-card-section>
        <div class="text-h5 text-center q-mb-lg">Sign Up</div>

        <!-- Online status indicator -->
        <div v-if="!authStore.isOnline" class="q-mb-md">
          <q-banner class="text-white bg-red" rounded>
            <template v-slot:avatar>
              <q-icon name="wifi_off" />
            </template>
            You must be online to create an account
          </q-banner>
        </div>

        <!-- Google Sign Up Button -->
        <div class="q-mb-md">
          <q-btn
            color="white"
            text-color="dark"
            class="full-width"
            @click="handleGoogleSignup"
            :loading="googleLoading"
            :disable="!authStore.isOnline"
          >
            <template v-slot:default>
              <q-avatar size="24px" class="q-mr-sm">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              </q-avatar>
              Sign up with Google
            </template>
          </q-btn>
        </div>

        <q-separator class="q-mb-md">
          <q-chip dense color="grey-3" text-color="dark">OR</q-chip>
        </q-separator>

        <!-- Traditional Sign Up Form -->
        <q-form @submit="handleSignup" class="q-gutter-md">
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            required
            :rules="[(val) => (val && val.includes('@')) || 'Please enter a valid email']"
            :disable="!authStore.isOnline"
          />
          <q-input
            v-model="form.password"
            label="Password"
            type="password"
            required
            :rules="[(val) => (val && val.length >= 6) || 'Password must be at least 6 characters']"
            :disable="!authStore.isOnline"
          />
          <q-input
            v-model="form.confirmPassword"
            label="Confirm Password"
            type="password"
            required
            :rules="[(val) => val === form.password || 'Passwords do not match']"
            :disable="!authStore.isOnline"
          />
          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading"
            :disable="!authStore.isOnline"
          >
            Sign Up
          </q-btn>
        </q-form>
        <div class="text-center q-mt-md">
          <q-btn flat color="primary" @click="$router.push('/login')"
            >Already have an account? Login</q-btn
          >
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const googleLoading = ref(false)

async function handleGoogleSignup() {
  if (!authStore.isOnline) {
    $q.notify({
      color: 'negative',
      message: 'You must be online to sign up with Google',
      icon: 'wifi_off',
    })
    return
  }

  googleLoading.value = true
  try {
    await authStore.signupWithGoogle()
    $q.notify({
      color: 'positive',
      message: 'Account created successfully!',
      icon: 'check_circle',
    })
    router.push('/home')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Google signup failed',
      icon: 'error',
    })
  } finally {
    googleLoading.value = false
  }
}

async function handleSignup() {
  loading.value = true
  try {
    await authStore.signup(form.value.email, form.value.password)
    $q.notify({
      color: 'positive',
      message: 'Account created successfully! Please check your email to verify your account.',
      icon: 'check_circle',
    })
    router.push('/login')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Signup failed',
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
