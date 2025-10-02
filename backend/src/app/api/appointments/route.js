import express from 'express';
import prisma from '../../../lib/prisma.js';
import { z } from 'zod';
import { addMinutes, addDays } from 'date-fns';

const router = express.Router();

// Validacija za kreiranje i update termina
const appointmentSchema = z.object({
  userId: z.string().min(1, "userId je obavezan"),
  familyMemberId: z.string().optional().nullable(),
  stylistId: z.string().min(1, "stylistId je obavezan"),
  serviceIds: z.array(z.string().min(1)).min(1, "Barem jedna usluga je obavezna"),
  dateTime: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Neispravan format datuma"
  }),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'MISSED', 'PENDING_CONFIRMATION']).optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional().nullable(),
  internalNotes: z.string().optional()
});

const availableSlotsSchema = z.object({
  stylistId: z.string().min(1, "stylistId je obavezan"),
  serviceIds: z.array(z.string().min(1)).min(1, "Barem jedna usluga je obavezna"),
  dateFrom: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Neispravan format datuma"
  }),
  dateTo: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Neispravan format datuma"
  }),
});

// Pomoćne funkcije
const handleError = (res, status, message, error) => {
  console.error(message, error);
  return res.status(status).json({ 
    error: message,
    ...(error && { details: error.message })
  });
};

const checkResourceExists = async (model, id, errorMessage) => {
  const resource = await model.findUnique({ where: { id } });
  if (!resource) throw new Error(errorMessage);
  return resource;
};

const calculateTotalDuration = async (serviceIds) => {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  });
  return services.reduce((sum, service) => sum + service.duration, 0);
};

// GET svi termini sa paginacijom i filtriranjem
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where = status ? { status: String(status) } : {};
    
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, name: true, email: true } },
          familyMember: true,
          stylist: { select: { id: true, name: true } },
          services: {
            include: {
              service: { select: { id: true, name: true, duration: true } }
            }
          },
        },
        orderBy: { dateTime: 'desc' }
      }),
      prisma.appointment.count({ where })
    ]);

    // Transformacija podataka za lakši pristup
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      services: appointment.services.map(as => as.service)
    }));

    res.json({
      data: transformedAppointments,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    handleError(res, 500, 'Greška prilikom dohvaćanja termina', error);
  }
});

// GET dostupni termini za frizera i uslugu
// GET dostupni termini za frizera i uslugu
router.get('/available', async (req, res) => {
  try {
    // Parsiranje parametara
    const { stylistId, serviceIds: serviceIdsParam, dateFrom, dateTo } = req.query;
    const serviceIds = Array.isArray(serviceIdsParam) 
      ? serviceIdsParam 
      : serviceIdsParam.split(',');

    // Validacija
    if (!stylistId || !dateFrom || !dateTo || serviceIds.length === 0) {
      return res.status(400).json({ 
        error: 'Nedostaju obavezni parametri (stylistId, serviceIds, dateFrom, dateTo)' 
      });
    }

    // Radno vrijeme (9:00-17:00, pon-pet)
    const WORKING_HOURS = {
      start: 9,  // 9:00
      end: 17    // 17:00
    };

    // Dohvat usluga i frizera
    const [services, stylist] = await Promise.all([
      prisma.service.findMany({ 
        where: { id: { in: serviceIds } },
        orderBy: { duration: 'desc' }
      }),
      prisma.user.findUnique({
        where: { id: stylistId },
        include: { salon: true }
      })
    ]);

    if (!stylist) return res.status(404).json({ error: 'Frizer nije pronađen' });
    if (services.length !== serviceIds.length) {
      return res.status(404).json({ error: 'Neke usluge nisu pronađene' });
    }

    // Izračun trajanja
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

    // Dohvat postojećih termina
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        stylistId,
        dateTime: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: { not: 'CANCELLED' }
      },
      include: { services: { include: { service: true } } }
    });

    // Generisanje slotova
    const availableSlots = [];
    const currentDate = new Date(dateFrom);
    currentDate.setHours(WORKING_HOURS.start, 0, 0, 0); // Početak u 9:00

    while (currentDate <= new Date(dateTo)) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Vikend

      if (!isWeekend) {
        const slotEnd = new Date(currentDate.getTime() + totalDuration * 60000);
        
        // Provjera da li termin završava prije 17:00
        if (slotEnd.getHours() < WORKING_HOURS.end || 
            (slotEnd.getHours() === WORKING_HOURS.end && slotEnd.getMinutes() === 0)) {
            
          // Provjera kolizija
          const hasConflict = existingAppointments.some(appt => {
            const apptEnd = new Date(appt.dateTime.getTime() + 
              appt.services.reduce((sum, s) => sum + s.service.duration, 0) * 60000);
            return currentDate < apptEnd && slotEnd > appt.dateTime;
          });

          if (!hasConflict) {
            availableSlots.push({
              start: new Date(currentDate),
              end: slotEnd,
              duration: totalDuration,
              services: services.map(s => ({
                id: s.id,
                name: s.name,
                duration: s.duration,
                price: s.price
              }))
            });
          }
        }
      }

      // Pomak za 30 minuta
      currentDate.setMinutes(currentDate.getMinutes() + 30);

      // Ako smo prešli radno vrijeme, prebaci na sljedeći dan u 9:00
      if (currentDate.getHours() >= WORKING_HOURS.end) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(WORKING_HOURS.start, 0, 0, 0);
      }
    }

    // Formatiran odgovor
    res.json({
      success: true,
      data: {
        services,
        availableSlots,
        meta: {
          stylistId,
          stylistName: stylist.name,
          salonName: stylist.salon?.name,
          workingHours: `Pon-Pet ${WORKING_HOURS.start}:00-${WORKING_HOURS.end}:00`,
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
          totalSlots: availableSlots.length
        }
      }
    });

  } catch (error) {
    console.error('Greška:', error);
    res.status(500).json({ 
      error: 'Greška prilikom dohvatanja termina',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Termini za specifičnog korisnika
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter = 'ALL', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Provjera postojanja korisnika
    await checkResourceExists(prisma.user, userId, 'Korisnik nije pronađen');

    const now = new Date();
    let where = { userId };

    // Primjeni filtere
    if (filter === 'UPCOMING') {
      where.dateTime = { gte: now };
      where.status = { notIn: ['CANCELLED', 'COMPLETED', 'MISSED'] };
    } else if (filter === 'PAST') {
      where.dateTime = { lt: now };
      where.status = { not: 'CANCELLED' };
    } else {
      where.status = { not: 'CANCELLED' };
    }

    // Dohvati termine sa svim potrebnim relacijama
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true
                }
              }
            }
          },
          stylist: {
            include: {
              salon: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  phone: true
                }
              }
            }
          },
          familyMember: true
        },
        orderBy: {
          dateTime: filter === 'PAST' ? 'desc' : 'asc'
        }
      }),
      prisma.appointment.count({ where })
    ]);

    // Transformacija podataka
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      services: appointment.services.map(as => as.service)
    }));

    // Vrati strukturirani odgovor
    res.status(200).json({
      data: transformedAppointments,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        filter
      }
    });
  } catch (error) {
    handleError(res, 500, 'Greška prilikom dohvaćanja korisničkih termina', error);
  }
});

// GET termin po ID-u
router.get('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        familyMember: true,
        stylist: { 
          include: { 
            salon: { select: { id: true, name: true, address: true, phone: true } } 
          } 
        },
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Termin nije pronađen' });
    }

    // Transformacija podataka
    const transformedAppointment = {
      ...appointment,
      services: appointment.services.map(as => as.service)
    };

    res.json(transformedAppointment);
  } catch (error) {
    handleError(res, 500, 'Greška prilikom pretrage termina', error);
  }
});

// POST novi termin
router.post('/', async (req, res) => {
  try {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const { userId, familyMemberId, stylistId, serviceIds, dateTime } = parsed.data;
    
    // Provjera postojanja resursa
    await Promise.all([
      checkResourceExists(prisma.user, userId, 'Korisnik nije pronađen'),
      ...(familyMemberId ? [checkResourceExists(prisma.familyMember, familyMemberId, 'Član obitelji nije pronađen')] : []),
      checkResourceExists(prisma.user, stylistId, 'Frizer nije pronađen'),
      ...serviceIds.map(id => checkResourceExists(prisma.service, id, `Usluga s ID ${id} nije pronađena`))
    ]);

    const appointmentDate = new Date(dateTime);
    const now = new Date();

    // Provjera da datum nije u prošlosti
    if (appointmentDate < now) {
      return res.status(400).json({ error: 'Ne možete zakazati termin u prošlosti' });
    }

    // Izračunaj ukupno trajanje usluga
    const totalDuration = await calculateTotalDuration(serviceIds);

    // Provjera dostupnosti termina
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        stylistId,
        dateTime: { gte: appointmentDate, lte: addMinutes(appointmentDate, totalDuration) },
        status: { not: 'CANCELLED' }
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ error: 'Termin je već zauzet' });
    }

    // Kreiranje termina sa uslugama
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        familyMemberId: familyMemberId || undefined,
        stylistId,
        dateTime: appointmentDate,
        status: 'SCHEDULED',
        notes: parsed.data.notes,
        cancellationReason: null,
        internalNotes: parsed.data.internalNotes,
        services: {
          create: serviceIds.map(serviceId => ({
            service: { connect: { id: serviceId } }
          }))
        }
      },
      include: {
        user: { select: { name: true, email: true } },
        stylist: { select: { name: true } },
        services: {
          include: {
            service: { select: { name: true } }
          }
        }
      }
    });

    // Transformacija podataka za notifikaciju
    const serviceNames = appointment.services.map(as => as.service.name).join(', ');

    // Slanje obavijesti
    await prisma.notification.create({
      data: {
        type: 'APPOINTMENT_CREATED',
        title: 'Novi termin',
        message: `Imate novi termin za ${serviceNames} dana ${appointmentDate.toLocaleString()}`,
        userId: stylistId,
        appointmentId: appointment.id,
        sendAt: new Date()
      }
    });

    res.status(201).json({
      ...appointment,
      services: appointment.services.map(as => as.service)
    });
  } catch (error) {
    handleError(res, 400, 'Greška prilikom kreiranja termina', error);
  }
});

// PUT ažuriranje termina
router.put('/:id', async (req, res) => {
  try {
    const parsed = appointmentSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { 
        stylist: true, 
        user: true, 
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Termin nije pronađen' });
    }

    // Provjera promjena koje zahtijevaju potvrdu
    const dateChanged = parsed.data.dateTime && 
      new Date(parsed.data.dateTime).getTime() !== existingAppointment.dateTime.getTime();
    const stylistChanged = parsed.data.stylistId && 
      parsed.data.stylistId !== existingAppointment.stylistId;
    const servicesChanged = parsed.data.serviceIds && 
      JSON.stringify(parsed.data.serviceIds.sort()) !== 
      JSON.stringify(existingAppointment.services.map(as => as.service.id).sort());

    // Ažuriranje osnovnih podataka
    const updatedAppointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        dateTime: parsed.data.dateTime ? new Date(parsed.data.dateTime) : undefined,
        status: (dateChanged || stylistChanged || servicesChanged) ? 
          'PENDING_CONFIRMATION' : parsed.data.status,
        updatedAt: new Date()
      },
      include: { 
        stylist: true, 
        user: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    // Ažuriranje usluga ako su promijenjene
    if (servicesChanged && parsed.data.serviceIds) {
      // Prvo obriši sve postojeće veze
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: req.params.id }
      });

      // Zatim kreiraj nove veze
      await prisma.appointmentService.createMany({
        data: parsed.data.serviceIds.map(serviceId => ({
          appointmentId: req.params.id,
          serviceId
        }))
      });

      // Ponovo dohvati ažurirani termin sa uslugama
      updatedAppointment.services = await prisma.appointmentService.findMany({
        where: { appointmentId: req.params.id },
        include: { service: true }
      });
    }

    if (dateChanged || stylistChanged || servicesChanged) {
      const serviceNames = updatedAppointment.services.map(as => as.service.name).join(', ');
      const changes = [];
      
      if (dateChanged) changes.push(`Novi datum/vrijeme: ${updatedAppointment.dateTime.toLocaleString()}`);
      if (stylistChanged) changes.push(`Novi stilist: ${updatedAppointment.stylist.name}`);
      if (servicesChanged) changes.push(`Nove usluge: ${serviceNames}`);

      await prisma.notification.create({
        data: {
          type: 'APPOINTMENT_CHANGED',
          title: 'Promjena termina',
          message: `Termin za ${serviceNames} je ažuriran. ${changes.join('. ')}. Molimo potvrdite promjene.`,
          userId: updatedAppointment.stylistId,
          appointmentId: updatedAppointment.id,
          sendAt: new Date()
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${updatedAppointment.stylistId}`).emit('new-notification', {
          title: 'Promjena termina',
          message: `Termin za ${serviceNames} je ažuriran. ${changes.join('. ')}`
        });
      }
    }

    res.json({
      ...updatedAppointment,
      services: updatedAppointment.services.map(as => as.service)
    });
  } catch (error) {
    handleError(res, 400, 'Greška prilikom ažuriranja termina', error);
  }
});

// DELETE termin
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Termin nije pronađen' });
    }

    const serviceNames = appointment.services.map(as => as.service.name).join(', ');

    // Umjesto brisanja, označimo kao otkazan
    const deletedAppointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { 
        status: 'CANCELLED',
        cancellationReason: req.body.cancellationReason || 'Otkazano od strane administratora'
      }
    });

    // Obavijest korisnika
    await prisma.notification.create({
      data: {
        type: 'APPOINTMENT_CANCELLED',
        title: 'Termin otkazan',
        message: `Vaš termin za ${serviceNames} na datum ${deletedAppointment.dateTime.toLocaleString()} je otkazan.`,
        userId: deletedAppointment.userId,
        sendAt: new Date()
      }
    });

    res.json({ 
      message: 'Termin je uspješno otkazan',
      appointment: deletedAppointment 
    });
  } catch (error) {
    handleError(res, 400, 'Greška prilikom brisanja termina', error);
  }
});

router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { 
        services: {
          include: {
            service: true
          }
        },
        stylist: true 
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Termin nije pronađen' });
    }

    const serviceNames = appointment.services.map(as => as.service.name).join(', ');

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'PENDING_CONFIRMATION',
        updatedAt: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        type: 'APPOINTMENT_RESCHEDULED',
        title: 'Zahtjev za promjenu termina',
        message: `Korisnik je zatražio promjenu termina za ${serviceNames}`,
        userId: appointment.stylistId,
        appointmentId: appointment.id,
        sendAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Full error details:', error);
    handleError(res, 500, 'Greška prilikom promjene termina', error);
  }
});

export default router;