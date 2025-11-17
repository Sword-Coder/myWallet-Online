<template>
  <div class="landing-page">
    <div class="hero-section">
      <div class="hero-content">
        <q-avatar size="150px" class="hero-logo">
          <img src="/icons/favicon-applogo.png" alt="myWallet Logo" />
        </q-avatar>
        <h1 class="hero-title">Welcome to <span class="brand-name">myWallet</span></h1>
        <p class="hero-subtitle">Your Personal Finance Management Tool</p>
        <p class="hero-description">
          Take control of your finances with ease. Track delegations, export reports, and manage
          your budget all in one place.
        </p>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">Key Features</h2>
        <div class="features-grid">
          <q-card class="feature-card">
            <q-card-section>
              <q-icon name="receipt_long" size="3rem" class="feature-icon" />
              <div class="feature-title">Record Keeping</div>
              <div class="feature-description">
                Keep detailed records of your financial delegations and transactions with ease.
              </div>
            </q-card-section>
          </q-card>

          <q-card class="feature-card">
            <q-card-section>
              <q-icon name="picture_as_pdf" size="3rem" class="feature-icon" />
              <div class="feature-title">PDF Export</div>
              <div class="feature-description">
                Export your records as printable PDFs for easy sharing and archiving.
              </div>
            </q-card-section>
          </q-card>

          <q-card class="feature-card">
            <q-card-section>
              <q-icon name="insights" size="3rem" class="feature-icon" />
              <div class="feature-title">Analysis Tools</div>
              <div class="feature-description">
                Analyze your spending patterns and budget performance with powerful insights.
              </div>
            </q-card-section>
          </q-card>

          <q-card class="feature-card">
            <q-card-section>
              <q-icon name="account_balance_wallet" size="3rem" class="feature-icon" />
              <div class="feature-title">Budget Management</div>
              <div class="feature-description">
                Set and track budgets for different categories to stay on top of your finances.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="container">
        <h2 class="cta-title">Get Started Today</h2>
        <p class="cta-description">Join other users managing their finances effectively.</p>
        <div class="cta-buttons">
          <q-btn color="primary" size="lg" @click="$router.push('/login')" class="cta-btn"
            >Login</q-btn
          >
          <q-btn outline color="primary" size="lg" @click="$router.push('/signup')" class="cta-btn"
            >Sign Up</q-btn
          >
        </div>
      </div>
    </div>

    <!-- Floating Action Button for Signup -->
    <div class="floating-signup-btn">
      <q-btn
        fab
        icon="person_add"
        color="primary"
        size="md"
        @click="$router.push('/signup')"
        class="signup-fab"
      >
        <q-tooltip>Sign Up</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  authStore.checkAuth()
  if (authStore.isAuthenticated) {
    router.push('/home')
  }
})
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4d934e 0%, #6ba06f 100%);
  color: white;
  font-family: 'Roboto', sans-serif;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 1rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
}

.hero-logo {
  margin-bottom: 1.5rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.brand-name {
  color: #ffffff;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.hero-description {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.features-section {
  background: #f8f9fa;
  color: #333;
  padding: 4rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  color: #4d934e;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-description {
  color: #666;
  line-height: 1.5;
}

.cta-section {
  background: white;
  padding: 4rem 1rem;
  text-align: center;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #333;
}

.cta-description {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.cta-btn {
  min-width: 150px;
}

.floating-signup-btn {
  position: fixed;
  bottom: 18px;
  right: 18px;
  z-index: 1000;
}

.signup-fab {
  box-shadow: 0 4px 20px rgba(77, 147, 78, 0.4);
  transition: all 0.3s ease;
}

.signup-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(77, 147, 78, 0.6);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .section-title,
  .cta-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
