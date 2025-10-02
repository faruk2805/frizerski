'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/context/authcontext'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCalendar, FiClock, FiUser, FiScissors, FiCheck, FiX, FiChevronDown, FiChevronUp, FiTrash2, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEdit } from 'react-icons/fi'
import { FaSpinner, FaRegCalendarAlt, FaMapMarkerAlt, FaPhone, FaStore, FaUserTie, FaCut, FaRegClock, FaClock, FaCalendarDay, FaInfoCircle, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa'
import Image from 'next/image'
import Footer from '../components/footer'
import Navbar from '../components/navbarl'
import { useRouter } from 'next/navigation'

const statusConfig = {
    SCHEDULED: {
        color: 'bg-blue-500',
        icon: <FiClock className="text-blue-500" />,
        label: 'Zakazano',
        textColor: 'text-blue-400'
    },
    COMPLETED: {
        color: 'bg-green-500',
        icon: <FiCheck className="text-green-500" />,
        label: 'Završeno',
        textColor: 'text-green-400'
    },
    CANCELLED: {
        color: 'bg-red-500',
        icon: <FiX className="text-red-500" />,
        label: 'Otkazano',
        textColor: 'text-red-400'
    },
    MISSED: {
        color: 'bg-yellow-500',
        icon: <FiX className="text-yellow-500" />,
        label: 'Propusteno',
        textColor: 'text-yellow-400'
    },
    PENDING_CONFIRMATION: {
        color: 'bg-purple-500',
        icon: <FaSpinner className="animate-spin text-purple-500" />,
        label: 'Čeka potvrdu',
        textColor: 'text-purple-400'
    }
}

export default function UserAppointments() {
    const { user } = useAuth()
    const router = useRouter()
    const [appointments, setAppointments] = useState([])
    const [services, setServices] = useState([])
    const [salons, setSalons] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedAppointment, setExpandedAppointment] = useState(null)
    const [filter, setFilter] = useState('ALL')
    const [cancellingId, setCancellingId] = useState(null)
    const [reschedulingId, setReschedulingId] = useState(null)
    const [showRescheduleForm, setShowRescheduleForm] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [newServiceIds, setNewServiceIds] = useState([])
    const [newDateTime, setNewDateTime] = useState(null)
    const [availableSlots, setAvailableSlots] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [rescheduleStep, setRescheduleStep] = useState(1)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    })

    const fetchInitialData = async () => {
        try {
            setLoading(true);

            const [servicesRes, salonsRes] = await Promise.all([
                fetch('http://localhost:4000/api/services'),
                fetch('http://localhost:4000/api/salon')
            ]);

            if (!servicesRes.ok) throw new Error('Failed to fetch services');
            if (!salonsRes.ok) throw new Error('Failed to fetch salons');

            const [servicesData, salonsData] = await Promise.all([
                servicesRes.json(),
                salonsRes.json()
            ]);

            // Dodajemo default slike ako nedostaju
            const enhancedServices = servicesData.map(service => ({
                ...service,
                imageUrl: service.imageUrl || `/images/services/${service.id}.jpg`
            }));

            const enhancedSalons = salonsData.map(salon => ({
                ...salon,
                imageUrl: salon.imageUrl || `/images/salon/${salon.id}.jpg`
            }));

            setServices(enhancedServices);
            setSalons(enhancedSalons);
            await fetchAppointments(enhancedServices, enhancedSalons);

        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async (servicesList = services, salonsList = salons) => {
    try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(
            `http://localhost:4000/api/appointments/user/${user.id}?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}`,
            { headers }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
        }

        const data = await response.json();

        const enhancedAppointments = data.data.map(appointment => {
            // Process services - ensure we have full service data
            const appointmentServices = appointment.services.map(apptService => {
                // Find the full service data from servicesList
                const fullService = servicesList.find(s => s.id === apptService.id) || {};
                return {
                    ...fullService,  // Full service data from the services list
                    ...apptService,  // Specific data from the appointment
                    imageUrl: fullService.imageUrl || `/images/services/${apptService.id}.jpg`
                };
            });

            // Process stylist
            const stylistData = appointment.stylist || {};
            const fullStylist = {
                ...stylistData,
                profilePhoto: stylistData.profilePhoto || '/images/team/placeholder.jpg'
            };

            // Process salon
            const salonFromAPI = appointment.stylist?.salon || {};
            const salonFromList = salonsList.find(s => s?.id === salonFromAPI.id);
            const fullSalon = {
                ...(salonFromList || salonFromAPI),
                imageUrl: salonFromList?.imageUrl || salonFromAPI.imageUrl || '/images/salon/default.jpg'
            };

            return {
                ...appointment,
                services: appointmentServices,
                stylist: {
                    ...fullStylist,
                    salon: fullSalon
                },
                salon: fullSalon
            };
        });

        setAppointments(enhancedAppointments);

        if (data.meta) {
            setPagination({
                page: data.meta.page,
                limit: data.meta.limit,
                total: data.meta.total,
                totalPages: data.meta.totalPages
            });
        }

    } catch (err) {
        console.error('Error in fetchAppointments:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    const fetchAvailableSlots = async () => {
        try {
            if (!selectedAppointment || !selectedAppointment.stylist?.id || !newServiceIds.length || !selectedDate) {
                setAvailableSlots([])
                return
            }

            const dateFrom = new Date(selectedDate)
            dateFrom.setHours(0, 0, 0, 0)

            const dateTo = new Date(selectedDate)
            dateTo.setHours(23, 59, 59, 999)

            const response = await fetch(
                `http://localhost:4000/api/appointments/available?stylistId=${selectedAppointment.stylist.id}&serviceIds=${newServiceIds.join(',')}&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`
            )

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            if (!data.data?.availableSlots || !Array.isArray(data.data.availableSlots)) {
                throw new Error('Invalid response format')
            }

            const formattedSlots = data.data.availableSlots.map(slot => ({
                ...slot,
                start: new Date(slot.start),
                end: new Date(slot.end),
                formattedTime: formatTime(slot.start)
            }))

            setAvailableSlots(formattedSlots)
        } catch (err) {
            console.error('Error fetching available slots:', err)
            setAvailableSlots([])
            setError('Došlo je do greške pri dohvatu dostupnih termina')
        }
    }

    const toggleExpand = (id) => {
        setExpandedAppointment(expandedAppointment === id ? null : id)
    }

    const canCancelOrReschedule = (dateTime) => {
        try {
            const now = new Date()
            const appointmentDate = new Date(dateTime)
            if (isNaN(appointmentDate.getTime())) return false

            const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60)
            return hoursDifference > 24
        } catch {
            return false
        }
    }

    const cancelAppointment = async (id) => {
        try {
            setCancellingId(id);

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/appointments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cancellationReason: 'Otkazao korisnik'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }

            await fetchAppointments();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError(err.message || 'Došlo je do greške pri otkazivanju termina');
        } finally {
            setCancellingId(null);
        }
    };

    const openRescheduleForm = (appointment) => {
        if (!appointment?.services || appointment.services.length === 0) {
            setError('Nevalidan termin za promjenu - nema usluga');
            return;
        }

        setSelectedAppointment(appointment);
        setNewServiceIds(appointment.services.map(s => s.id));
        setRescheduleStep(1);
        setShowRescheduleForm(true);
        setError(null);
        setSelectedDate(new Date(appointment.dateTime));
        setNewDateTime(new Date(appointment.dateTime));
    };

    const toggleServiceSelection = (serviceId) => {
        setNewServiceIds(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const proceedToDateSelection = () => {
        if (!newServiceIds.length) {
            setError('Molimo odaberite barem jednu uslugu')
            return
        }
        setRescheduleStep(2)
        fetchAvailableSlots()
    }

    const submitReschedule = async () => {
        if (!selectedAppointment || !selectedAppointment.id || !newServiceIds.length || !newDateTime) {
            setError('Molimo odaberite sve potrebne podatke')
            return
        }

        try {
            setReschedulingId(selectedAppointment.id)

            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:4000/api/appointments/${selectedAppointment.id}/reschedule`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceIds: newServiceIds,
                    stylistId: selectedAppointment.stylist.id,
                    dateTime: newDateTime.toISOString()
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`)
            }

            await response.json()
            await fetchAppointments()
            setShowRescheduleForm(false)
            setError(null)
        } catch (err) {
            console.error('Error rescheduling appointment:', err)
            setError(err.message || 'Došlo je do greške pri promjeni termina')
        } finally {
            setReschedulingId(null)
        }
    }

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'Nepoznat datum'

            const date = new Date(dateString)

            if (isNaN(date.getTime())) return 'Nepoznat datum'

            return date.toLocaleDateString('hr-HR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        } catch {
            return 'Nepoznat datum'
        }
    }

    const formatTime = (dateString) => {
        try {
            if (!dateString) return 'Nepoznato vrijeme'

            const date = new Date(dateString)

            if (isNaN(date.getTime())) return 'Nepoznato vrijeme'

            return date.toLocaleTimeString('hr-HR', {
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return 'Nepoznato vrijeme'
        }
    }

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }))
        }
    }

    const handleDateChange = (date) => {
        setSelectedDate(date)
        setNewDateTime(null)
    }

    const handleTimeSelect = (slot) => {
        setNewDateTime(slot.start)
    }

    useEffect(() => {
        if (user?.id) {
            fetchInitialData()
        }
    }, [user, filter, pagination.page])

    useEffect(() => {
        if (selectedDate && newServiceIds.length && selectedAppointment && rescheduleStep === 2) {
            fetchAvailableSlots()
        }
    }, [selectedDate, newServiceIds, rescheduleStep])

    return (
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/hero-bg.jpg"
                    alt="Background"
                    fill
                    sizes="100vw"
                    className="object-cover opacity-30"
                    priority
                />
            </div>

            <AnimatePresence>
                {showRescheduleForm && selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                Promjena termina za {selectedAppointment.services[0]?.name}
                            </h3>

                            {error && (
                                <div className="bg-red-500/20 p-3 rounded-lg mb-4">
                                    <p className="text-red-300">{error}</p>
                                </div>
                            )}

                            {rescheduleStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-300 mb-2 flex items-center">
                                            <FaCut className="mr-2 text-amber-500" />
                                            Odaberite usluge (možete odabrati više)
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {services.map(service => (
                                                <motion.div
                                                    key={service.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => toggleServiceSelection(service.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${newServiceIds.includes(service.id)
                                                        ? 'bg-amber-600/20 border-amber-500'
                                                        : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
                                                            <Image
                                                                src={service.imageUrl || '/images/services/default-service.jpg'}
                                                                alt={service.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="100vw"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${newServiceIds.includes(service.id) ? 'text-white' : 'text-gray-300'
                                                                }`}>
                                                                {service.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {service.duration} min • {service.price.toFixed(2)} KM
                                                            </p>
                                                        </div>
                                                        {newServiceIds.includes(service.id) && (
                                                            <div className="ml-auto w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                                                <FiCheck className="text-white text-xs" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            onClick={() => setShowRescheduleForm(false)}
                                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center"
                                        >
                                            <FaArrowLeft className="mr-2" />
                                            Odustani
                                        </button>
                                        <button
                                            onClick={proceedToDateSelection}
                                            disabled={!newServiceIds.length}
                                            className={`px-4 py-2 rounded-lg flex items-center ${!newServiceIds.length
                                                ? 'bg-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                        >
                                            Dalje
                                            <FaArrowRight className="ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {rescheduleStep === 2 && (
                                <div className="space-y-4">
                                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                                            <FaCut className="mr-2 text-amber-500" />
                                            Odabrane usluge
                                        </h4>
                                        <div className="space-y-3">
                                            {services
                                                .filter(s => newServiceIds.includes(s.id))
                                                .map(service => (
                                                    <div key={service.id} className="flex items-center gap-3">
                                                        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
                                                            <Image
                                                                src={service.imageUrl || '/images/services/default-service.jpg'}
                                                                alt={service.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="100vw"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {service.name}
                                                            </p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs text-gray-300">
                                                                    {service.duration} min
                                                                </span>
                                                                <span className="text-xs font-bold text-amber-500">
                                                                    {service.price.toFixed(2)} KM
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-300 mb-2 flex items-center">
                                            <FaCalendarDay className="mr-2 text-amber-500" />
                                            Odaberite datum
                                        </label>
                                        <DatePicker
                                            selected={selectedDate}
                                            onChange={handleDateChange}
                                            minDate={new Date()}
                                        />
                                    </div>

                                    {selectedDate && (
                                        <div>
                                            <label className="block text-gray-300 mb-2 flex items-center">
                                                <FaClock className="mr-2 text-amber-500" />
                                                Odaberite vrijeme
                                            </label>
                                            <TimePicker
                                                availableSlots={availableSlots}
                                                selectedSlot={availableSlots.find(slot =>
                                                    newDateTime && slot.start.getTime() === newDateTime.getTime()
                                                )}
                                                onSelectSlot={handleTimeSelect}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between gap-3 pt-4">
                                        <button
                                            onClick={() => setRescheduleStep(1)}
                                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center"
                                        >
                                            <FaArrowLeft className="mr-2" />
                                            Nazad
                                        </button>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowRescheduleForm(false)}
                                                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center"
                                            >
                                                Odustani
                                            </button>
                                            <button
                                                onClick={submitReschedule}
                                                disabled={!newDateTime || reschedulingId}
                                                className={`px-4 py-2 rounded-lg flex items-center ${!newDateTime || reschedulingId
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                {reschedulingId ? (
                                                    <>
                                                        <FaSpinner className="animate-spin mr-2" />
                                                        Šaljem...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck className="mr-2" />
                                                        Potvrdi promjenu
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10">
                <Navbar />

                <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 pt-60">
                    <div className="w-full max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-700">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white">
                                            Moji termini
                                        </h1>
                                        <p className="text-gray-400 mt-1">
                                            Pregledajte i upravljajte svojim zakazanim terminima
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {['ALL', 'UPCOMING', 'PAST'].map((f) => (
                                            <motion.button
                                                key={f}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setFilter(f)
                                                    setPagination(prev => ({ ...prev, page: 1 }))
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {f === 'ALL' && 'Svi termini'}
                                                {f === 'UPCOMING' && 'Nadolazeći'}
                                                {f === 'PAST' && 'Prošli'}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center">
                                    <FaSpinner className="animate-spin text-4xl text-amber-500 mb-4" />
                                    <p className="text-gray-400">Učitavanje termina...</p>
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                                        <FiX className="text-2xl text-red-500" />
                                    </div>
                                    <p className="text-red-400 font-medium">{error}</p>
                                    <button
                                        onClick={fetchInitialData}
                                        className="mt-4 px-6 py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
                                    >
                                        <FiRefreshCw className="mr-2" />
                                        Pokušaj ponovo
                                    </button>
                                </div>
                            ) : appointments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
                                        <FiCalendar className="text-2xl text-gray-400" />
                                    </div>
                                    <h3 className="text-xl text-white font-medium mb-2">Nema termina</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">
                                        {filter === 'UPCOMING'
                                            ? "Trenutno nemate zakazanih termina. Rezervišite novi termin u našem salonu."
                                            : "Nema pronađenih termina za odabrani filter."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <ul className="divide-y divide-gray-700/50">
                                        {appointments.map((appointment) => {
                                            const isUpcoming = new Date(appointment.dateTime) > new Date()
                                            const isExpanded = expandedAppointment === appointment.id
                                            const status = statusConfig[appointment.status] || statusConfig.SCHEDULED
                                            const canModify = isUpcoming && canCancelOrReschedule(appointment.dateTime)

                                            return (
                                                <motion.li
                                                    key={appointment.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <div className="px-6 py-5">
                                                        <div
                                                            className="flex items-center justify-between cursor-pointer"
                                                            onClick={() => toggleExpand(appointment.id)}
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/30">
                                                                    <Image
                                                                        src={appointment.services[0]?.imageUrl || '/images/services/default-service.jpg'}
                                                                        alt={appointment.services[0]?.name || 'Usluga'}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="100vw"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                                        {appointment.services.length > 1
                                                                            ? `${appointment.services[0].name} + ${appointment.services.length - 1} više`
                                                                            : appointment.services[0]?.name}
                                                                    </h3>
                                                                    <div className="flex items-center space-x-3 mt-1">
                                                                        <p className="text-sm text-gray-400 flex items-center">
                                                                            <FiCalendar className="mr-1.5" />
                                                                            {formatDate(appointment.dateTime)}
                                                                        </p>
                                                                        <p className="text-sm text-gray-400 flex items-center">
                                                                            <FiClock className="mr-1.5" />
                                                                            {formatTime(appointment.dateTime)}
                                                                        </p>
                                                                        <span className={`text-xs px-2.5 py-1 rounded-full ${status.color} ${status.textColor} font-medium`}>
                                                                            {status.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                                <FiChevronDown size={20} />
                                                            </div>
                                                        </div>

                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-6 pl-16 space-y-5">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                                                                                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                                                                    <FaCut className="mr-2 text-amber-500" />
                                                                                    Detalji usluga
                                                                                </h4>
                                                                                <div className="space-y-3">
                                                                                    {appointment.services.map((service, index) => (
                                                                                        <div key={index} className="flex items-start gap-4">
                                                                                            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
                                                                                                <Image
                                                                                                    src={service.imageUrl || '/images/services/default-service.jpg'}
                                                                                                    alt={service.name}
                                                                                                    fill
                                                                                                    className="object-cover"
                                                                                                    sizes="100vw"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-white font-medium">
                                                                                                    {service.name}
                                                                                                </p>
                                                                                                <p className="text-sm text-gray-400 mt-1">
                                                                                                    {service.description || 'Opis nije dostupan'}
                                                                                                </p>
                                                                                                <div className="flex items-center gap-4 mt-2">
                                                                                                    <span className="text-sm text-gray-300">
                                                                                                        <span className="font-medium">Trajanje:</span> {service.duration} min
                                                                                                    </span>
                                                                                                    <span className="text-sm font-bold text-amber-500">
                                                                                                        {service.price.toFixed(2)} KM
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>

                                                                            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                                                                                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                                                                    <FaUserTie className="mr-2 text-amber-500" />
                                                                                    Frizer
                                                                                </h4>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-amber-500/30">
                                                                                        <Image
                                                                                            src={appointment.stylist.profilePhoto || '/images/team/placeholder.jpg'}
                                                                                            alt={appointment.stylist.name}
                                                                                            fill
                                                                                            className="object-cover"
                                                                                            sizes="100vw"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-white font-medium">
                                                                                            {appointment.stylist.name}
                                                                                        </p>
                                                                                        <div className="flex items-center gap-2 mt-2">
                                                                                            <div className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full">
                                                                                                {appointment.stylist.specialties || 'Nepoznata specijalnost'}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                                                                            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                                                                <FaStore className="mr-2 text-amber-500" />
                                                                                Lokacija salona
                                                                            </h4>
                                                                            <div className="flex items-start gap-4">
                                                                                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
                                                                                    <Image
                                                                                        src={appointment.salon.imageUrl || '/images/salon/default.jpg'}
                                                                                        alt={appointment.salon.name}
                                                                                        fill
                                                                                        className="object-cover"
                                                                                        sizes="100vw"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-white font-medium">
                                                                                        {appointment.salon.name}
                                                                                    </p>
                                                                                    <div className="flex items-center text-sm text-gray-400 mt-1">
                                                                                        <FaMapMarkerAlt className="mr-2 text-amber-500" />
                                                                                        <span>{appointment.salon.address || 'Nepoznata adresa'}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center text-sm text-gray-400 mt-1">
                                                                                        <FaPhone className="mr-2 text-amber-500" />
                                                                                        <a href={`tel:${appointment.salon.phone || ''}`} className="hover:text-amber-500 transition-colors">
                                                                                            {appointment.salon.phone || 'Nepoznat telefon'}
                                                                                        </a>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {appointment.notes && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: 5 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                transition={{ delay: 0.1 }}
                                                                                className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20"
                                                                            >
                                                                                <h4 className="text-xs font-semibold text-amber-400 mb-1">VAŠA NAPOMENA</h4>
                                                                                <p className="text-sm text-amber-300">{appointment.notes}</p>
                                                                            </motion.div>
                                                                        )}

                                                                        {appointment.cancellationReason && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: 5 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                transition={{ delay: 0.15 }}
                                                                                className="bg-red-500/10 p-4 rounded-lg border border-red-500/20"
                                                                            >
                                                                                <h4 className="text-xs font-semibold text-red-400 mb-1">RAZLOG OTKAZIVANJA</h4>
                                                                                <p className="text-sm text-red-300">{appointment.cancellationReason}</p>
                                                                            </motion.div>
                                                                        )}

                                                                        <div className="flex flex-col justify-end">
                                                                            {isUpcoming && canModify && (
                                                                                <div className="flex justify-end gap-3">
                                                                                    <motion.button
                                                                                        initial={{ opacity: 0, y: 5 }}
                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                        transition={{ delay: 0.2 }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            openRescheduleForm(appointment)
                                                                                        }}
                                                                                        disabled={reschedulingId === appointment.id}
                                                                                        className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all ${reschedulingId === appointment.id
                                                                                            ? 'bg-gray-600 cursor-not-allowed'
                                                                                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/20'
                                                                                            }`}
                                                                                    >
                                                                                        {reschedulingId === appointment.id ? (
                                                                                            <>
                                                                                                <FaSpinner className="animate-spin mr-2" />
                                                                                                Prijava...
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <FiEdit className="mr-2" />
                                                                                                Promijeni termin
                                                                                            </>
                                                                                        )}
                                                                                    </motion.button>

                                                                                    <motion.button
                                                                                        initial={{ opacity: 0, y: 5 }}
                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                        transition={{ delay: 0.25 }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            cancelAppointment(appointment.id)
                                                                                        }}
                                                                                        disabled={cancellingId === appointment.id}
                                                                                        className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all ${cancellingId === appointment.id
                                                                                            ? 'bg-gray-600 cursor-not-allowed'
                                                                                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/20'
                                                                                            }`}
                                                                                    >
                                                                                        {cancellingId === appointment.id ? (
                                                                                            <>
                                                                                                <FaSpinner className="animate-spin mr-2" />
                                                                                                Otkazivanje...
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <FiTrash2 className="mr-2" />
                                                                                                Otkaži termin
                                                                                            </>
                                                                                        )}
                                                                                    </motion.button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.li>
                                            )
                                        })}
                                    </ul>

                                    {pagination.totalPages > 1 && (
                                        <div className="flex justify-between items-center p-6 border-t border-gray-700/50 bg-gray-800/30">
                                            <button
                                                onClick={() => changePage(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="px-5 py-2 bg-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-600 transition-colors flex items-center gap-2"
                                            >
                                                <FiChevronLeft />
                                                Prethodna
                                            </button>
                                            <span className="text-gray-300 text-sm">
                                                Strana <span className="font-medium">{pagination.page}</span> od <span className="font-medium">{pagination.totalPages}</span>
                                            </span>
                                            <button
                                                onClick={() => changePage(pagination.page + 1)}
                                                disabled={pagination.page === pagination.totalPages}
                                                className="px-5 py-2 bg-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-600 transition-colors flex items-center gap-2"
                                            >
                                                Sljedeća
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    )
}

function DatePicker({ selected, onChange, minDate }) {
    const [showPicker, setShowPicker] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(selected || new Date())

    const months = [
        'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
        'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ]

    const days = ['Ne', 'Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su']

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth)
        const firstDayOfMonth = getFirstDayOfMonth(currentMonth)
        const daysArray = []

        for (let i = 0; i < firstDayOfMonth; i++) {
            daysArray.push(<div key={`empty-${i}`} className="w-10 h-10" />)
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
            const isSelected = selected && date.toDateString() === selected.toDateString()
            const isDisabled = minDate && date < new Date(minDate.setHours(0, 0, 0, 0))

            daysArray.push(
                <motion.button
                    key={`day-${i}`}
                    whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                    whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                    onClick={() => {
                        if (!isDisabled) {
                            onChange(date)
                            setShowPicker(false)
                        }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${isSelected ? 'bg-amber-500 text-white' :
                            isDisabled ? 'text-gray-500 cursor-not-allowed' :
                                'text-gray-200 hover:bg-gray-700'}`}
                    disabled={isDisabled}
                >
                    {i}
                </motion.button>
            )
        }

        return daysArray
    }

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
            >
                <span>{selected ? selected.toLocaleDateString('hr-HR') : 'Odaberite datum'}</span>
                <FiCalendar className="text-amber-500" />
            </motion.button>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={prevMonth}
                                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
                            >
                                <FiChevronLeft />
                            </motion.button>

                            <h3 className="text-lg font-medium text-white">
                                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h3>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={nextMonth}
                                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
                            >
                                <FiChevronRight />
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {days.map((day) => (
                                <div key={day} className="text-center text-sm text-gray-500 w-10">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {renderDays()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function TimePicker({ availableSlots, selectedSlot, onSelectSlot }) {
    const [showPicker, setShowPicker] = useState(false)

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
            >
                <span>{selectedSlot ? selectedSlot.formattedTime : 'Odaberite vrijeme'}</span>
                <FiClock className="text-amber-500" />
            </motion.button>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4"
                    >
                        <h3 className="text-lg font-medium text-white mb-3">Dostupni termini</h3>

                        {availableSlots.length === 0 ? (
                            <p className="text-gray-500 text-center py-2">Nema dostupnih termina</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {availableSlots.map((slot, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            onSelectSlot(slot)
                                            setShowPicker(false)
                                        }}
                                        className={`py-2 px-3 rounded-md text-sm font-medium transition-all
                      ${selectedSlot?.start.getTime() === slot.start.getTime()
                                                ? 'bg-amber-500 text-black'
                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
                                    >
                                        {slot.formattedTime}
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}