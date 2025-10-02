import express from 'express';
import prisma from '../../../lib/prisma.js';
import { authMiddleware } from '../../../lib/middleware.js';

const router = express.Router();

// Dohvati poruke za appointmentId
router.get('/:appointmentId', authMiddleware, async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { appointmentId },
      orderBy: { timestamp: 'asc' },
      include: { 
        sender: { select: { id: true, name: true, role: true, profilePhoto: true } }
      },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri dohvatu poruka' });
  }
});

// Pošalji poruku
router.post('/', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  const { appointmentId, message, imageUrl } = req.body;

  if (!appointmentId || (!message && !imageUrl)) {
    return res.status(400).json({ error: 'Nedostaju podaci' });
  }

  try {
    const newMessage = await prisma.chatMessage.create({
      data: {
        appointmentId,
        senderId,
        message,
        imageUrl: imageUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, profilePhoto: true } }
      },
    });

    // Emituj preko socket.io ako imaš
    const io = req.app.get('io');
    if (io) {
      io.to(appointmentId).emit('newChatMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri slanju poruke' });
  }
});

export default router;
