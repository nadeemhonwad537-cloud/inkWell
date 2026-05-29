const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTP(to, code) {
  await resend.emails.send({
    from: 'Inkwell Journal <onboarding@resend.dev>',
    to,
    subject: 'Your Inkwell verification code',
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:2rem;border:1px solid #e8e4dc;">
        <h2 style="font-weight:400;color:#1a1a18;">Inkwell Journal</h2>
        <p style="color:#555;line-height:1.6;">Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:.3em;color:#c0392b;padding:1.5rem 0;text-align:center;">
          ${code}
        </div>
        <p style="color:#999;font-size:.8rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOTP };
