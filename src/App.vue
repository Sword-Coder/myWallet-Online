<template>
  <div>
    <!-- Splash Screen -->
    <div v-if="showSplash" class="splash-screen" @click="hideSplash">
      <div class="splash-content">
        <img src="/icons/favicon-applogo.png" alt="MyWallet Logo" class="splash-logo" />
        <div class="splash-text">MyWallet</div>
        <div class="splash-subtitle">Personal Finance</div>
      </div>
    </div>

    <!-- Main App -->
    <router-view v-if="!showSplash" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showSplash = ref(true)

function hideSplash() {
  showSplash.value = false
}

onMounted(() => {
  // Auto-hide splash after 2.5 seconds
  setTimeout(() => {
    showSplash.value = false
  }, 2500)
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 50%, #4d934e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
}

.splash-content {
  text-align: center;
  animation: splashAnimation 2s ease-in-out;
}

.splash-logo {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: logoBounce 2s ease-in-out infinite;
}

.splash-text {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-top: 24px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.splash-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

@keyframes splashAnimation {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes logoBounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Mobile responsive */
@media (max-width: 600px) {
  .splash-logo {
    width: 100px;
    height: 100px;
    border-radius: 20px;
  }

  .splash-text {
    font-size: 2rem;
    margin-top: 20px;
  }

  .splash-subtitle {
    font-size: 1rem;
  }
}
</style>
