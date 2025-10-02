import express from 'express';
import prisma from '../../../lib/prisma.js';
import { z } from 'zod';
import { authMiddleware } from '../../../lib/middleware.js';

const router = express.Router();

const chatMessageSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId je obavezan'),
  message: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
}).refine(
  data => (data.message && data.message.trim().length > 0) || (data.imageUrl && data.imageUrl.length > 0),
  {
    message: 'message ili imageUrl mora biti unesen',
    path: ['message'], 
  }
);



// Dohvati sve poruke za dati appointmentId
router.get('/:appointmentId', authMiddleware, async (req, res) => {
  const { appointmentId } = req.params;

  if (!appointmentId) {
    return res.status(400).json({ error: 'appointmentId je obavezan' });
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { appointmentId },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });
    res.json(messages);
  } catch (e) {
    console.error('Greška pri dohvatu poruka:', e);
    res.status(500).json({ error: 'Greška pri dohvatu poruka' });
  }
});

// Pošalji novu poruku
router.post('/', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  console.log('Primljeni req.body:', req.body);

  const validation = chatMessageSchema.safeParse(req.body);
  if (!validation.success) {
    console.error('Validation errors:', validation.error?.errors || validation.error);
    return res.status(400).json({ error: validation.error?.errors || 'Nevalidan unos' });
  }

  try {
    const newMessage = await prisma.chatMessage.create({
      data: {
        appointmentId: validation.data.appointmentId,
        senderId,
        message: validation.data.message,
        imageUrl: validation.data.imageUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Emit preko Socket.IO ako je potrebno
    const io = req.app.get('io');
    if (io) io.to(validation.data.appointmentId).emit('newChatMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (e) {
    console.error('Greška pri slanju poruke:', e);
    res.status(500).json({ error: 'Greška pri slanju poruke' });
  }
});

// Ažuriraj poruku (edit)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID je obavezan' });
  }

  // partial za update - svi polja su opcionalna
  const updateSchema = chatMessageSchema.partial();
  const validation = updateSchema.safeParse(req.body);

  if (!validation.success) {
    console.error('Validation errors:', validation.error?.errors || validation.error);
    return res.status(400).json({ error: validation.error?.errors || 'Nevalidan unos' });
  }

  try {
    const updated = await prisma.chatMessage.update({
      where: { id },
      data: validation.data,
    });
    res.json(updated);
  } catch (e) {
    console.error('Greška pri ažuriranju poruke:', e);
    res.status(500).json({ error: 'Greška pri ažuriranju poruke' });
  }
});

// Obriši poruku
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID je obavezan' });
  }

  try {
    await prisma.chatMessage.delete({ where: { id } });
    res.json({ message: 'Poruka uspješno obrisana' });
  } catch (e) {
    console.error('Greška pri brisanju poruke:', e);
    res.status(500).json({ error: 'Greška pri brisanju poruke' });
  }
});

export default router;
