'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../components/context/authcontext'
import { motion, AnimatePresence } from 'framer-motion'
import { FiStar, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiPlus, FiCalendar, FiClock } from 'react-icons/fi'
import { FaSpinner, FaUser, FaQuoteLeft, FaCheck, FaTimes, FaCut, FaRegCalendarAlt, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'
import Image from 'next/image'
import Footer from '../components/footer'
import Navbar from '../components/navbarl'

export default function ReviewsPage() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedReview, setExpandedReview] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [currentReview, setCurrentReview] = useState(null)
    const [formData, setFormData] = useState({
        rating: 5,
        comment: ''
    })
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const fetchUserReviews = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem('token')
            const response = await fetch(
                `http://localhost:4000/api/reviews?userId=${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            setReviews(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Error fetching reviews:', err)
            setError(err.message)
        }
    }

    const fetchCompletedAppointments = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(
                `http://localhost:4000/api/appointments/user/${user.id}?status=COMPLETED`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            const appointmentsData = Array.isArray(data) ? data : []
            
            const appointmentsWithoutReviews = appointmentsData.filter(appointment => 
                !reviews.some(review => review.appointmentId === appointment.id)
            )
            setAppointments(appointmentsWithoutReviews)
        } catch (err) {
            console.error('Error fetching appointments:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            
            const url = editMode 
                ? `http://localhost:4000/api/reviews/${currentReview.id}`
                : 'http://localhost:4000/api/reviews'
            
            const method = editMode ? 'PUT' : 'POST'
            
            const body = editMode 
                ? { rating: formData.rating, comment: formData.comment }
                : { 
                    ...formData, 
                    userId: user.id,
                    appointmentId: selectedAppointment.id 
                }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            await fetchUserReviews()
            await fetchCompletedAppointments()
            setShowForm(false)
            setFormData({ rating: 5, comment: '' })
            setSelectedAppointment(null)
        } catch (err) {
            console.error('Error submitting review:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Da li ste sigurni da želite obrisati ovu recenziju?')) return
        
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            
            const response = await fetch(`http://localhost:4000/api/reviews/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            await fetchUserReviews()
            await fetchCompletedAppointments()
        } catch (err) {
            console.error('Error deleting review:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const openEditForm = (review) => {
        setCurrentReview(review)
        setFormData({
            rating: review.rating,
            comment: review.comment || ''
        })
        setEditMode(true)
        setShowForm(true)
    }

    const openCreateForm = (appointment) => {
        setCurrentReview(null)
        setSelectedAppointment(appointment)
        setFormData({
            rating: 5,
            comment: ''
        })
        setEditMode(false)
        setShowForm(true)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Nepoznat datum'
        const date = new Date(dateString)
        return date.toLocaleDateString('hr-HR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        if (!dateString) return 'Nepoznato vrijeme'
        const date = new Date(dateString)
        return date.toLocaleTimeString('hr-HR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    useEffect(() => {
        if (user?.id) {
            fetchUserReviews().then(fetchCompletedAppointments)
        }
    }, [user])

    return (
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden">
            {/* Pozadina */}
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
                                            Moje Recenzije
                                        </h1>
                                        <p className="text-gray-400 mt-1">
                                            Pregledajte i upravljajte svojim recenzijama
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    >
                                        <FaSpinner className="text-4xl text-amber-500 mb-4" />
                                    </motion.div>
                                    <p className="text-gray-400">Učitavanje podataka...</p>
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4"
                                    >
                                        <FaTimes className="text-2xl text-red-500" />
                                    </motion.div>
                                    <p className="text-red-400 font-medium">{error}</p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            fetchUserReviews()
                                            fetchCompletedAppointments()
                                        }}
                                        className="mt-4 px-6 py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
                                    >
                                        Pokušaj ponovo
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700/50">
                                    {/* Sekcija za recenzije */}
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <FiStar className="text-amber-500" />
                                            Moje recenzije ({reviews.length})
                                        </h2>

                                        {reviews.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-gray-700/50 p-6 rounded-lg text-center"
                                            >
                                                <p className="text-gray-400">Još niste ostavili nijednu recenziju.</p>
                                            </motion.div>
                                        ) : (
                                            <ul className="space-y-4">
                                                {reviews.map((review) => {
                                                    const isExpanded = expandedReview === review.id

                                                    return (
                                                        <motion.li
                                                            key={review.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600/50 hover:border-amber-500/30 transition-colors"
                                                        >
                                                            <div className="p-4">
                                                                <div
                                                                    className="flex items-center justify-between cursor-pointer"
                                                                    onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <motion.div
                                                                                    key={i}
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                >
                                                                                    <FiStar
                                                                                        className={`${i < review.rating ? 'text-amber-500' : 'text-gray-500'}`}
                                                                                    />
                                                                                </motion.div>
                                                                            ))}
                                                                        </div>
                                                                        <p className="text-white line-clamp-1">
                                                                            {review.comment || 'Bez komentara'}
                                                                        </p>
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
                                                                            <div className="mt-4 pl-10 space-y-4">
                                                                                <div className="flex items-start gap-3">
                                                                                    <FaQuoteLeft className="text-amber-500/30 text-xl mt-1 flex-shrink-0" />
                                                                                    <p className="text-gray-300">
                                                                                        {review.comment || 'Korisnik nije ostavio komentar'}
                                                                                    </p>
                                                                                </div>

                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    <div className="bg-gray-700/70 p-3 rounded-lg">
                                                                                        <h4 className="text-xs text-gray-400 mb-1 flex items-center">
                                                                                            <FaRegCalendarAlt className="mr-2" />
                                                                                            Datum recenzije
                                                                                        </h4>
                                                                                        <p className="text-white">
                                                                                            {formatDate(review.createdAt)}
                                                                                        </p>
                                                                                    </div>

                                                                                    {review.appointment && (
                                                                                        <div className="bg-gray-700/70 p-3 rounded-lg">
                                                                                            <h4 className="text-xs text-gray-400 mb-1 flex items-center">
                                                                                                <FiCalendar className="mr-2" />
                                                                                                Datum termina
                                                                                            </h4>
                                                                                            <p className="text-white">
                                                                                                {formatDate(review.appointment.dateTime)}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex justify-end gap-3 pt-2">
                                                                                    <motion.button
                                                                                        whileHover={{ scale: 1.05 }}
                                                                                        whileTap={{ scale: 0.95 }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            openEditForm(review)
                                                                                        }}
                                                                                        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                                                                    >
                                                                                        <FiEdit2 size={14} />
                                                                                        Uredi
                                                                                    </motion.button>
                                                                                    <motion.button
                                                                                        whileHover={{ scale: 1.05 }}
                                                                                        whileTap={{ scale: 0.95 }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            handleDelete(review.id)
                                                                                        }}
                                                                                        className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                                                                                    >
                                                                                        <FiTrash2 size={14} />
                                                                                        Obriši
                                                                                    </motion.button>
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
                                        )}
                                    </div>

                                    {/* Sekcija za termine bez recenzija */}
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <FaCheck className="text-green-500" />
                                            Termini za recenziju ({appointments.length})
                                        </h2>

                                        {appointments.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-gray-700/50 p-6 rounded-lg text-center"
                                            >
                                                <p className="text-gray-400">Nemate završenih termina bez recenzije.</p>
                                            </motion.div>
                                        ) : (
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {appointments.map((appointment) => (
                                                    <motion.li
                                                        key={appointment.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600/50 hover:border-amber-500/30 transition-colors"
                                                    >
                                                        <div className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="bg-amber-500/10 p-2 rounded-lg">
                                                                    <FaCut className="text-amber-500" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="text-white font-medium">
                                                                        {appointment.services?.[0]?.name || 'Usluga'}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                                                        <FiCalendar />
                                                                        <span>{formatDate(appointment.dateTime)}</span>
                                                                        <FiClock />
                                                                        <span>{formatTime(appointment.dateTime)}</span>
                                                                    </div>
                                                                    {appointment.notes && (
                                                                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                                                            "{appointment.notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => openCreateForm(appointment)}
                                                                className="mt-3 w-full py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center justify-center gap-1"
                                                            >
                                                                <FiPlus size={14} />
                                                                Ostavi recenziju
                                                            </motion.button>
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>

                {/* Forma za recenzije */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {editMode ? 'Uredi recenziju' : 'Nova recenzija'}
                                </h3>

                                {!editMode && selectedAppointment && (
                                    <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                                        <p className="text-gray-300 text-sm mb-1">Termin:</p>
                                        <p className="text-white font-medium">
                                            {formatDate(selectedAppointment.dateTime)} u {formatTime(selectedAppointment.dateTime)}
                                        </p>
                                        {selectedAppointment.notes && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                "{selectedAppointment.notes}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/20 p-3 rounded-lg mb-4"
                                    >
                                        <p className="text-red-300">{error}</p>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">Ocjena</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <motion.button
                                                    key={star}
                                                    type="button"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setFormData({ ...formData, rating: star })}
                                                    className={`text-2xl transition-colors ${formData.rating >= star ? 'text-amber-500' : 'text-gray-500 hover:text-amber-400'}`}
                                                >
                                                    <FiStar />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">Komentar</label>
                                        <textarea
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                                            rows="4"
                                            required
                                            placeholder="Podijelite svoje iskustvo..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowForm(false)}
                                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                        >
                                            Odustani
                                        </motion.button>
                                        <motion.button
                                            type="submit"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={loading}
                                            className={`px-4 py-2 rounded-lg ${loading ? 'bg-gray-600' : 'bg-amber-600 hover:bg-amber-700'} transition-colors flex items-center`}
                                        >
                                            {loading ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        className="mr-2"
                                                    >
                                                        <FaSpinner />
                                                    </motion.div>
                                                    Šaljem...
                                                </>
                                            ) : (
                                                editMode ? 'Spremi promjene' : 'Objavi recenziju'
                                            )}
                                        </motion.button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Footer />
            </div>
        </div>
    )
}