import { boot } from 'quasar/wrappers'

export default boot(() => {
  // Load Google Identity Services script
  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Initialize Google Auth client
  const initializeGoogleAuth = async () => {
    await loadGoogleScript()

    // You'll need to replace this with your actual Google Client ID
    // Get it from Google Cloud Console -> APIs & Services -> Credentials
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      '276214183397-k18qbgohe6hr93ojmudhokpka4kgabl6.apps.googleusercontent.com'

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false, // Allow account selection
      ux_mode: 'popup', // Use popup mode to avoid COOP issues
    })
  }

  // Handle the credential response
  const handleCredentialResponse = (response) => {
    if (window.handleGoogleAuth) {
      window.handleGoogleAuth(response)
    }
  }

  // Initialize on boot
  initializeGoogleAuth().catch(console.error)
})
