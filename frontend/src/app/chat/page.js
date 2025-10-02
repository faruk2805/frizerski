'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/context/authcontext'
import Navbar from '../components/navbarl'
import Footer from '../components/footer'
import Image from 'next/image'
import {
  FaArrowLeft,
  FaSpinner,
  FaArrowRight,
  FaSync,
  FaTimes,
  FaImage,
  FaRegSmile,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa'
import { IoMdSend } from 'react-icons/io'
import { format, isAfter } from 'date-fns'
import { hr } from 'date-fns/locale'
import { io } from 'socket.io-client'

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [messages, setMessages] = useState([]) // Osiguravamo da je uvijek array
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  // Scroll chat to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch user's future appointments
  const fetchAppointments = async () => {
    if (!user) return
    setIsLoading(true)
    setRefreshing(true)
    try {
      const res = await fetch(`http://localhost:4000/api/appointments/user/${user.id}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
      if (!res.ok) throw new Error('Neuspješno dohvaćanje termina')

      const { data } = await res.json()
      const now = new Date()
      const futureAppointments = data.filter(app => {
        try {
          return app.dateTime && isAfter(new Date(app.dateTime), now)
        } catch {
          return false
        }
      })

      setAppointments(futureAppointments)
      setError(null)
    } catch (err) {
      setError(err.message)
      setAppointments([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch + refresh every 30s
  useEffect(() => {
    if (!user) return
    fetchAppointments()
    const interval = setInterval(fetchAppointments, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fetch messages and setup socket on appointment select
  useEffect(() => {
    if (!selectedAppointment || !user) return

    const fetchMessages = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`http://localhost:4000/api/chat/messages/${selectedAppointment.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
        if (!res.ok) throw new Error('Neuspješno dohvaćanje poruka')
        const messages = await res.json()  
        setMessages(Array.isArray(messages) ? messages : [])
      } catch (err) {
        setError(err.message)
        setMessages([]) // Postavljamo prazan array ako dođe do greške
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()

    // Disconnect previous socket if exists
    if (socketRef.current) {
      socketRef.current.off('newChatMessage')
      socketRef.current.disconnect()
    }

    // Setup new socket connection
    socketRef.current = io('http://localhost:4000', {
      auth: { token: user.token },
    })

    socketRef.current.emit('joinAppointment', selectedAppointment.id)

    socketRef.current.on('newChatMessage', (msg) => {
      setMessages(prev => {
        // Provjeri da poruka već ne postoji u stanju i osiguraj jedinstveni ključ
        if (!Array.isArray(prev)) prev = []
        if (prev.some(m => m.id === msg.id)) return prev

        // Generiraj jedinstveni ID ako ga nema
        if (!msg.id) {
          msg.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }

        return [...prev, msg]
      })
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.off('newChatMessage')
        socketRef.current.disconnect()
      }
    }
  }, [selectedAppointment, user])

  // Handle sending message with optional image upload
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !imageFile) || isLoading) return

    try {
      setIsLoading(true)
      let imageUrl = null

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadRes = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()
          throw new Error(`Greška pri uploadu slike: ${errText}`)
        }

        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      }

      // Ne dodajemo poruku ručno u stanje, već ćemo je primiti preko socket.io
      await fetch('http://localhost:4000/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          message: newMessage,
          imageUrl,
        }),
      })

      setNewMessage('')
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image file input and preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Slika je prevelika (max 5MB)')
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-black relative">
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

      <Navbar />

      <main className="flex-grow flex flex-col py-16 px-4 sm:px-6 lg:px-8 pt-60 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          {!selectedAppointment ? (
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaCalendarAlt className="mr-2 text-amber-500" />
                  Odaberite termin za chat
                </h2>
                <button
                  onClick={fetchAppointments}
                  disabled={refreshing}
                  className="text-amber-500 hover:text-amber-400"
                  aria-label="Osvježi termine"
                >
                  <FaSync className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                </div>
              ) : error ? (
                <div className="text-red-400 text-center py-4">{error}</div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Trenutno nemate aktivnih termina. Rezervišite novi termin.
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => setSelectedAppointment(appointment)}
                      className="p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedAppointment(appointment)
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-white">
                            {appointment.service?.name} sa {appointment.stylist?.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {format(new Date(appointment.dateTime), 'dd.MM.yyyy HH:mm', { locale: hr })}
                          </p>
                        </div>
                        <div className="text-amber-500">
                          <FaArrowRight />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl flex flex-col h-[calc(100vh-280px)]">
              <div className="border-b border-gray-700 p-4 flex items-center">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-amber-500 hover:text-amber-400 mr-4"
                  aria-label="Nazad na odabir termina"
                >
                  <FaArrowLeft />
                </button>

                <div className="flex items-center">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={selectedAppointment.stylist?.profilePhoto || '/images/barber-placeholder.jpg'}
                      alt={selectedAppointment.stylist?.name || 'Frizer'}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-medium text-white">{selectedAppointment.stylist?.name}</h2>
                    <p className="text-xs text-gray-400">
                      {selectedAppointment.service?.name} •{' '}
                      {format(new Date(selectedAppointment.dateTime), 'dd.MM.yyyy HH:mm', { locale: hr })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400 py-8">{error}</div>
                ) : !messages || messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FaUser className="text-4xl mb-2" />
                    <p>Nema poruka u ovom razgovoru</p>
                    <p className="text-sm">Pošaljite prvu poruku</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={`${message.id}-${message.timestamp || Date.now()}`} // Osiguravamo jedinstveni ključ
                      className={`flex ${message.sender?.id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${message.sender?.id === user.id ? 'bg-amber-500/90 text-black' : 'bg-gray-700 text-white'
                          }`}
                      >
                        {message.imageUrl && (
                          <div className="mb-2 rounded-md overflow-hidden">
                            <Image
                              src={message.imageUrl}
                              alt="Chat image"
                              width={400}
                              height={300}
                              className="object-cover w-full h-auto"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${message.sender?.id === user.id ? 'text-gray-800' : 'text-gray-400'}`}
                        >
                          {message.timestamp ? format(new Date(message.timestamp), 'HH:mm', { locale: hr }) : '--:--'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-700 p-4">
                {imagePreview && (
                  <div className="relative mb-4 rounded-md overflow-hidden w-40">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={160}
                      height={120}
                      className="object-cover w-full h-auto"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white hover:text-amber-500"
                      aria-label="Ukloni sliku"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <label className="cursor-pointer text-gray-400 hover:text-amber-500 p-2" aria-label="Dodaj sliku">
                    <FaImage className="text-xl" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Napišite poruku..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 px-4 text-white focus:outline-none focus:border-amber-500 pr-10"
                      aria-label="Polje za unos poruke"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 text-gray-400 hover:text-amber-500"
                      aria-label="Dodaj emotikon (trenutno ne radi)"
                      onClick={() => { }}
                    >
                      <FaRegSmile className="text-xl" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !imageFile) || isLoading}
                    className={`p-2 rounded-full ${(!newMessage.trim() && !imageFile) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black'
                      }`}
                    aria-label="Pošalji poruku"
                  >
                    {isLoading ? <FaSpinner className="animate-spin" /> : <IoMdSend className="text-xl" />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}