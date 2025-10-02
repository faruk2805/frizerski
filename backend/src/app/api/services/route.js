import express from 'express';
import prisma from '../../../lib/prisma.js';
import { z } from 'zod';

const router = express.Router();

// Definicija validacijske šeme za kreiranje i update servisa
const serviceSchema = z.object({
  name: z.string().min(1, "Ime servisa je obavezno"),
  description: z.string().optional(),
  duration: z.number().int().positive("Trajanje mora biti pozitivan cijeli broj"),
  price: z.number().nonnegative("Cijena ne može biti negativna"),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  stylistIds: z.array(z.string()).optional()
});

// GET svi servisi
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: 'Greška prilikom dohvaćanja servisa' });
  }
});

// GET servis po ID-u
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id }
    });
    if (!service) return res.status(404).json({ error: 'Servis nije pronađen' });
    res.json(service);
  } catch (e) {
    res.status(500).json({ error: 'Greška prilikom pretrage servisa' });
  }
});

// POST novi servis
router.post('/', async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  try {
    const service = await prisma.service.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        duration: parsed.data.duration,
        price: parsed.data.price,
        isActive: parsed.data.isActive ?? true,
        imageUrl: parsed.data.imageUrl,
        stylists: parsed.data.stylistIds ? {
          connect: parsed.data.stylistIds.map(id => ({ id }))
        } : undefined
      }
    });
    res.status(201).json(service);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT ažuriranje servisa
router.put('/:id', async (req, res) => {
  // partial() omogućava djelimičnu validaciju (update nije obavezan za sva polja)
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  try {
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        ...(parsed.data.stylistIds ? {
          stylists: {
            set: parsed.data.stylistIds.map(id => ({ id }))
          }
        } : {})
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE servis
router.delete('/:id', async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Servis obrisan' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
