const nodemailer = require('nodemailer');
const https = require('https');

async function sendOTP(to, code) {
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

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && process.env.BREVO_API_KEY) {
    // Use Brevo HTTP API — works on Render free tier
    const body = JSON.stringify({
      sender: { name: 'Inkwell Journal', email: 'nadeemhonwad537@gmail.com' },
      to: [{ email: to }],
      subject: 'Your Inkwell verification code',
      htmlContent: html,
    });

    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } else {
    // Use Gmail SMTP on localhost
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Inkwell Journal" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Your Inkwell verification code',
      html,
    });
  }
}

module.exports = { sendOTP };
