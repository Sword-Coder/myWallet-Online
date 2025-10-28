export function useEmail() {
  async function sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`

    // For now, we'll simulate email sending by logging to console
    // In production, you would integrate with an email service API
    console.log('=== EMAIL VERIFICATION LINK ===')
    console.log(`To: ${email}`)
    console.log(`Subject: Verify Your MyWallet Account`)
    console.log(`Verification URL: ${verificationUrl}`)
    console.log('================================')

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For development, you can copy this URL and paste it in the browser
    alert(`Development mode: Email verification link logged to console. URL: ${verificationUrl}`)

    return true
  }

  return {
    sendVerificationEmail,
  }
}
