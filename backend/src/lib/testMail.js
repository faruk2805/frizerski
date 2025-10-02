import { sendEmail } from './mailer.js';

async function test() {
  try {
    const info = await sendEmail('tvoj_mail_za_test@domena.com', 'Test email', '<h1>Ovo je test mail</h1>');
    console.log('Test mail poslan:', info.messageId);
  } catch (err) {
    console.error('Greška prilikom slanja test maila:', err);
  }
}

test();