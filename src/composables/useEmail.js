export function useEmail() {
  async function sendWelcomeEmail(email, name, verificationToken = null) {
    const baseUrl = window.location.origin
    const subject = 'Welcome to MyWallet!'

    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to MyWallet, ${name}!</h1>
        <p>Thank you for joining MyWallet. We're excited to help you manage your finances.</p>
        <p>Get started by exploring your dashboard and setting up your first wallet.</p>
    `

    if (verificationToken) {
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`
      emailContent += `
        <p><strong>Please verify your email address to activate your account:</strong></p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
      `
    }

    emailContent += `
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Happy budgeting!</p>
        <p>The MyWallet Team</p>
      </div>
    `

    const response = await fetch('https://mywallet.themission.site/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        html: emailContent,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send welcome email')
    }

    return true
  }

  return {
    sendWelcomeEmail,
  }
}
