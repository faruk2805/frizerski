import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: 'c2384b6dd9cbdd',
    pass: '69b424f2e20f48', 
  },
});

export async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: '"Frizerski Salon" <no-reply@frizerski.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email poslan:', info.messageId);
    return info;
  } catch (error) {
    console.error('Greška pri slanju emaila:', error);
    throw error;
  }
}
