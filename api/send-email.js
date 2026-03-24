// api/send-email.js
// Vercel serverless function — sends emails via Resend
// Deploy this file to your GitHub repo at: /api/send-email.js
// Add RESEND_API_KEY to your Vercel environment variables

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, name, emailType } = req.body;

  // Basic validation
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Email must look real
  if (!to.includes('@') || !to.includes('.')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Lune <hello@trylune.app>',
        to: [to],
        subject: subject,
        text: body,
        // Clean HTML version -- same content, just nicer in email clients
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1916; background: #f5f0e8;">
            <div style="margin-bottom: 32px;">
              <span style="font-family: Georgia, serif; font-size: 22px; color: #18706C; letter-spacing: -0.3px;">◑ Lune</span>
            </div>
            <div style="font-size: 15px; line-height: 1.8; white-space: pre-wrap; color: #1a1916;">${body.replace(/\n/g, '<br>')}</div>
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #ddd7ce; font-size: 12px; color: #7a7570;">
              trylune.app · You can reply to this email directly.
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Email failed to send' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
