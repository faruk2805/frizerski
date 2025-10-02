import prisma from '../lib/prisma.js';
import { sendEmail } from './mailer.js';

export async function sendUpcomingAppointmentReminders() {
    try {
        const sada = new Date();
        console.log('Sadašnje UTC vrijeme:', sada.toISOString());

        // Provera za 24h podsjetnik
        const startWindow24h = new Date(sada.getTime() + 24 * 60 * 60 * 1000 - 5 * 60 * 1000);
        const endWindow24h = new Date(sada.getTime() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000);

        console.log('Tražim termine za 24h podsjetnik u intervalu (UTC):', startWindow24h.toISOString(), 'do', endWindow24h.toISOString());

        const appointments24h = await prisma.appointment.findMany({
            where: {
                dateTime: {
                    gte: startWindow24h,
                    lte: endWindow24h,
                },
                status: 'SCHEDULED',
            },
            include: {
                user: true,
                stylist: true,
                service: true,
            },
        });

        console.log('Nađeno termina za 24h podsjetnik:', appointments24h.length);

        // Slanje 24h podsjetnika
        for (const appt of appointments24h) {
            console.log(`Provjeravam 24h podsjetnik za korisnika: ${appt.user.email} za termin: ${appt.dateTime}`);

            const exists24h = await prisma.notification.findFirst({
                where: {
                    appointmentId: appt.id,
                    type: 'REMINDER_24H',
                },
            });

            if (exists24h) {
                console.log(`24h notifikacija za termin ${appt.id} već postoji, preskačem...`);
                continue;
            }

            await sendNotificationAndEmail(
                appt,
                'REMINDER_24H',
                `Podsjetnik: Vaš termin u salonu ${appt.stylist.name} sutra`,
                `Imate termin za uslugu ${appt.service.name} kod stiliste ${appt.stylist.name} sutra u ${new Date(appt.dateTime).toLocaleString('bs-BA')}.`
            );
        }

        // Provera za 1h podsjetnik (originalna funkcionalnost)
        const startWindow1h = new Date(sada.getTime() + 60 * 60 * 1000 - 5 * 60 * 1000);
        const endWindow1h = new Date(sada.getTime() + 60 * 60 * 1000 + 5 * 60 * 1000);

        console.log('Tražim termine za 1h podsjetnik u intervalu (UTC):', startWindow1h.toISOString(), 'do', endWindow1h.toISOString());

        const appointments1h = await prisma.appointment.findMany({
            where: {
                dateTime: {
                    gte: startWindow1h,
                    lte: endWindow1h,
                },
                status: 'SCHEDULED',
            },
            include: {
                user: true,
                stylist: true,
                service: true,
            },
        });

        console.log('Nađeno termina za 1h podsjetnik:', appointments1h.length);

        // Slanje 1h podsjetnika
        for (const appt of appointments1h) {
            console.log(`Provjeravam 1h podsjetnik za korisnika: ${appt.user.email} za termin: ${appt.dateTime}`);

            const exists1h = await prisma.notification.findFirst({
                where: {
                    appointmentId: appt.id,
                    type: 'REMINDER_1H',
                },
            });

            if (exists1h) {
                console.log(`1h notifikacija za termin ${appt.id} već postoji, preskačem...`);
                continue;
            }

            await sendNotificationAndEmail(
                appt,
                'REMINDER_1H',
                `Podsjetnik: Vaš termin u salonu ${appt.stylist.name} za sat vremena`,
                `Imate termin za uslugu ${appt.service.name} kod stiliste ${appt.stylist.name} za sat vremena, dana ${new Date(appt.dateTime).toLocaleString('bs-BA')}.`
            );
        }
    } catch (error) {
        console.error('Greška prilikom slanja podsjetnika:', error);
    }
}

// Funkcija za slanje notifikacija o promjeni termina
export async function sendAppointmentChangeNotification(appointmentId, userId, isApproved = false) {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                stylist: true,
                service: true,
            },
        });

        if (!appointment) {
            console.error(`Termin sa ID ${appointmentId} nije pronađen`);
            return;
        }

        const title = isApproved 
            ? `Potvrda izmjene termina za ${appointment.service.name}`
            : `Zahtjev za izmjenu termina za ${appointment.service.name}`;

        const message = isApproved
            ? `Vaš zahtjev za izmjenu termina za uslugu ${appointment.service.name} kod ${appointment.stylist.name} je odobren. Novi termin je ${new Date(appointment.dateTime).toLocaleString('bs-BA')}.`
            : `Imate novi zahtjev za izmjenu termina za uslugu ${appointment.service.name} kod ${appointment.stylist.name}. Molimo potvrdite ili odbijte zahtjev.`;

        await sendNotificationAndEmail(
            appointment,
            isApproved ? 'APPOINTMENT_CHANGE_CONFIRMED' : 'APPOINTMENT_CHANGE_REQUEST',
            title,
            message,
            userId
        );

    } catch (error) {
        console.error('Greška prilikom slanja notifikacije o promjeni termina:', error);
    }
}

// Funkcija za slanje notifikacija o novim porukama
export async function sendMessageNotification(senderId, receiverId, messageContent, appointmentId = null) {
    try {
        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

        if (!sender || !receiver) {
            console.error('Pošiljalac ili primalac nisu pronađeni');
            return;
        }

        const title = `Nova poruka od ${sender.name}`;
        const truncatedContent = messageContent.length > 100 
            ? `${messageContent.substring(0, 100)}...` 
            : messageContent;

        const notification = await prisma.notification.create({
            data: {
                userId: receiverId,
                appointmentId: appointmentId,
                type: 'NEW_MESSAGE',
                title: title,
                message: truncatedContent,
                sendAt: new Date(),
                isRead: false,
            },
        });

        console.log(`Notifikacija o poruci kreirana sa ID: ${notification.id}`);

        // Slanje emaila samo ako korisnik nije online
        const isReceiverOnline = false; // Ovdje bi provjerili stanje korisnika
        if (!isReceiverOnline) {
            const html = generateEmailHtml(
                receiver.name,
                title,
                `Imate novu poruku od ${sender.name}: "${messageContent}"`,
                appointmentId ? `Poruka se odnosi na termin u ${new Date(appointment.dateTime).toLocaleString('bs-BA')}` : '',
                'Pogledajte poruku'
            );

            await sendEmail(receiver.email, title, html);
        }

    } catch (error) {
        console.error('Greška prilikom slanja notifikacije o poruci:', error);
    }
}

// Pomocna funkcija za slanje notifikacija i emailova
async function sendNotificationAndEmail(appointment, type, title, message, specificUserId = null) {
    const userId = specificUserId || appointment.userId;
    
    const notification = await prisma.notification.create({
        data: {
            userId: userId,
            appointmentId: appointment.id,
            type: type,
            title: title,
            message: message,
            sendAt: new Date(),
            isRead: false,
        },
    });

    console.log(`Notifikacija kreirana sa ID: ${notification.id} za korisnika ${userId}`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.error(`Korisnik sa ID ${userId} nije pronađen`);
        return;
    }

    const html = generateEmailHtml(
        user.name,
        title,
        message,
        `Detalji termina:<br>
         Usluga: ${appointment.service.name}<br>
         Frizer/Frizerska: ${appointment.stylist.name}<br>
         Datum i vrijeme: ${new Date(appointment.dateTime).toLocaleString('bs-BA')}<br>
         Trajanje: ${appointment.service.duration} minuta`,
        type.includes('REMINDER') ? 'Pregledajte termin' : 'Pregledajte detalje'
    );

    try {
        const info = await sendEmail(user.email, title, html);
        console.log('Email poslan:', info.messageId);
    } catch (error) {
        console.error(`Greška prilikom slanja emaila korisniku ${user.email}`, error);
    }
}

// Generisanje HTML-a za email
function generateEmailHtml(userName, title, mainMessage, details, buttonText) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
                
                body {
                    font-family: 'Poppins', Arial, sans-serif;
                    line-height: 1.6;
                    color: #4a4a4a;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0;
                    background-color: #f5f5f5;
                }
                .email-container {
                    background-color: #ffffff;
                    margin: 20px auto;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .header {
                    background: linear-gradient(135deg, #8e6c88 0%, #b88ca8 100%);
                    padding: 30px 20px;
                    text-align: center;
                    color: white;
                }
                .logo {
                    max-width: 180px;
                    height: auto;
                    margin-bottom: 15px;
                }
                .content {
                    padding: 30px;
                }
                h1 {
                    color: #8e6c88;
                    font-size: 26px;
                    margin-top: 0;
                    margin-bottom: 20px;
                    font-weight: 600;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 25px;
                }
                .appointment-card {
                    background-color: #faf9ff;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 25px 0;
                    border-left: 5px solid #8e6c88;
                    box-shadow: 0 2px 8px rgba(142, 108, 136, 0.1);
                }
                .detail-row {
                    display: flex;
                    margin-bottom: 12px;
                    align-items: center;
                }
                .detail-label {
                    font-weight: 500;
                    color: #8e6c88;
                    min-width: 100px;
                }
                .detail-value {
                    font-weight: 400;
                    color: #4a4a4a;
                }
                .divider {
                    height: 1px;
                    background-color: #e0e0e0;
                    margin: 25px 0;
                }
                .button-container {
                    text-align: center;
                    margin: 30px 0;
                }
                .button {
                    display: inline-block;
                    padding: 12px 25px;
                    background: linear-gradient(135deg, #8e6c88 0%, #b88ca8 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 30px;
                    margin: 10px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px rgba(142, 108, 136, 0.2);
                }
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(142, 108, 136, 0.3);
                }
                .footer {
                    background-color: #f9f9f9;
                    padding: 25px;
                    text-align: center;
                    font-size: 14px;
                    color: #777;
                }
                .social-icons {
                    margin: 20px 0;
                }
                .social-icon {
                    margin: 0 10px;
                }
                .contact-info {
                    margin-top: 15px;
                    line-height: 1.8;
                }
                .highlight {
                    color: #8e6c88;
                    font-weight: 500;
                }
                @media only screen and (max-width: 600px) {
                    .content {
                        padding: 20px;
                    }
                    .button {
                        display: block;
                        margin: 10px auto;
                        width: 80%;
                    }
                    .detail-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .detail-label {
                        margin-bottom: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img src="https://i.imgur.com/JzQJZzC.png" alt="Salon Lijepa Logo" class="logo">
                    <h1>${title}</h1>
                </div>
                
                <div class="content">
                    <p class="greeting">Poštovani/a <span class="highlight">${userName}</span>,</p>
                    <p>${mainMessage}</p>
                    
                    ${details ? `
                    <div class="appointment-card">
                        ${details.split('<br>').map(detail => `
                            <div class="detail-row">
                                <span class="detail-value">${detail}</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="divider"></div>
                    
                    <div class="button-container">
                        <a href="https://www.salonlijepa.com/appointments" class="button">${buttonText}</a>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="social-icons">
                        <a href="https://facebook.com/salon" class="social-icon">
                            <img src="https://i.imgur.com/vkXZT2Z.png" alt="Facebook" width="24">
                        </a>
                        <a href="https://instagram.com/salon" class="social-icon">
                            <img src="https://i.imgur.com/4ZQZQZQ.png" alt="Instagram" width="24">
                        </a>
                    </div>
                    
                    <div class="contact-info">
                        <p><strong>Salon Lijepa</strong></p>
                        <p>Ul. Primjer 123, Sarajevo</p>
                        <p>+387 33 123 456</p>
                        <p>info@salonlijepa.com</p>
                        <p>www.salonlijepa.com</p>
                    </div>
                    
                    <p style="margin-top: 20px;">© ${new Date().getFullYear()} Salon Lijepa. Sva prava pridržana.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}