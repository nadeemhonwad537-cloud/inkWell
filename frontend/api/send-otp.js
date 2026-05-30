// Vercel serverless function — called by backend to send OTP emails
// This runs on Vercel which has no outbound connection restrictions

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, code, secret } = req.body;

  // Simple shared secret to prevent abuse
  if (secret !== process.env.MAILER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:2rem;border:1px solid #e8e4dc;">
      <h2 style="font-weight:400;color:#1a1a18;">Inkwell Journal</h2>
      <p style="color:#555;line-height:1.6;">Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:2.5rem;font-weight:700;letter-spacing:.3em;color:#c0392b;padding:1.5rem 0;text-align:center;">
        ${code}
      </div>
      <p style="color:#999;font-size:.8rem;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Inkwell Journal', email: 'nadeemhonwad537@gmail.com' },
        to: [{ email: to }],
        subject: 'Your Inkwell verification code',
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
