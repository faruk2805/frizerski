'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/context/authcontext'
import Navbar from '../components/navbarl'
import Footer from '../components/footer'
import Image from 'next/image'
import DatePicker from '../components/datepicker'
import TimePicker from '../components/timepicker'
import { 
  FaCalendarAlt, 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheck,
  FaStore,
  FaUserTie,
  FaCut,
  FaRegClock,
  FaClock,
  FaPhone,
  FaCalendarDay,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaSpinner
} from 'react-icons/fa'

export default function ReservationPage() {
  const [step, setStep] = useState(1)
  const { user } = useAuth()
  const router = useRouter()
  const [salons, setSalons] = useState([])
  const [stylists, setStylists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [selectedStylist, setSelectedStylist] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [totalDuration, setTotalDuration] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'CLIENT') {
      router.push('/login')
    }
  }, [user, router])

  // Fetch initial data with proper error handling
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch salons
      const salonsResponse = await fetch('http://localhost:4000/api/salon')
      if (!salonsResponse.ok) {
        throw new Error(`Failed to fetch salons: ${salonsResponse.status}`)
      }
      const salonsData = await salonsResponse.json()
      setSalons(salonsData)
      
      // Fetch users with STYLIST role
      const usersResponse = await fetch('http://localhost:4000/api/users')
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`)
      }
      const allUsers = await usersResponse.json()
      
      // Filter for stylists only
      const stylistsData = allUsers.filter(user => user.role === 'STYLIST')
      
      // Fetch services for each stylist
      const stylistsWithServices = await Promise.all(
        stylistsData.map(async stylist => {
          try {
            const servicesResponse = await fetch(
              `http://localhost:4000/api/services?stylistId=${stylist.id}`
            )
            if (!servicesResponse.ok) {
              console.error(`Failed to fetch services for stylist ${stylist.id}`)
              return { ...stylist, stylistServices: [] }
            }
            const services = await servicesResponse.json()
            return { ...stylist, stylistServices: services }
          } catch (err) {
            console.error(`Error fetching services for stylist ${stylist.id}:`, err)
            return { ...stylist, stylistServices: [] }
          }
        })
      )
      
      setStylists(stylistsWithServices)
    } catch (err) {
      console.error('Error in fetchInitialData:', err)
      setError(err.message)
      // Fallback data if API fails
      setSalons([
        { 
          id: '1', 
          name: 'Frizerski Salon Faruk', 
          address: 'Ul. Bosanskih gazija 10, Bihać',
          phone: '+387 61 234 567',
          imageUrl: '/images/salon-placeholder.jpg'
        }
      ])
      setStylists([
        { 
          id: 'cmdmb932t0000000vk1uzctyl',
          name: 'Ivan Horvat',
          email: 'barber1@example.com',
          role: 'STYLIST',
          profilePhoto: '/images/barbers/barber1.jpg',
          specialties: 'Šišanje, brijanje, stiliziranje',
          salonId: '1',
          stylistServices: [
            {
              id: "cmdkv5d88001z3n0vm36fmvvf",
              name: "Brijanje",
              description: "Stislko oblikovanje brade i brijanje",
              duration: 15,
              price: 15,
              isActive: true,
              imageUrl: "/images/gallery/g2.jpg"
            },
            {
              id: "cmdqlcsn700042rjao15s8nhz",
              name: "Šišanje",
              description: "Moderno šišanje za sve uzraste",
              duration: 60,
              price: 20,
              isActive: true,
              imageUrl: "/images/gallery/g1.jpg"
            }
          ]
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (user && user.role === 'CLIENT') {
      fetchInitialData()
    }
  }, [user, fetchInitialData])

  // Calculate total duration and price
  useEffect(() => {
    const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0)
    const price = selectedServices.reduce((sum, service) => sum + service.price, 0)
    setTotalDuration(duration)
    setTotalPrice(price)
  }, [selectedServices])

  // Fetch available slots with proper error handling
  const fetchAvailableSlots = useCallback(async () => {
    try {
      setIsLoading(true)
      setAvailableSlots([])
      setSelectedSlot(null)
      setError(null)

      if (!selectedStylist?.id || selectedServices.length === 0 || !selectedDate) {
        throw new Error('Molimo odaberite sve potrebne podatke (frizer, usluge i datum)')
      }

      const dateFrom = new Date(selectedDate)
      dateFrom.setHours(0, 0, 0, 0)
      
      const dateTo = new Date(selectedDate)
      dateTo.setHours(23, 59, 59, 999)

      // Prepare query parameters
      const params = new URLSearchParams({
        stylistId: selectedStylist.id,
        serviceIds: selectedServices.map(s => s.id).join(','),
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString()
      })

      const response = await fetch(`http://localhost:4000/api/appointments/available?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Greška pri dohvatanju dostupnih termina')
      }

      const data = await response.json()
      
      // Transform the available slots data to match your expected format
      const formattedSlots = data.data.availableSlots.map(slot => ({
        ...slot,
        start: new Date(slot.start),
        end: new Date(slot.end),
        formattedTime: formatTime(new Date(slot.start)),
        services: slot.services || [] // Ensure services array exists
      }))

      setAvailableSlots(formattedSlots)
    } catch (error) {
      console.error('Error in fetchAvailableSlots:', error)
      setError(error.message)
      setAvailableSlots([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedStylist, selectedServices, selectedDate])

  // Format time helper
  const formatTime = useCallback((date) => {
    return new Date(date).toLocaleTimeString('hr-HR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }, [])

  // Book appointment with proper error handling
  const handleBookAppointment = useCallback(async () => {
    if (!selectedSlot || !selectedStylist || selectedServices.length === 0) return

    try {
      setIsLoading(true)
      
      const appointmentData = {
        userId: user.id,
        stylistId: selectedStylist.id,
        serviceIds: selectedServices.map(s => s.id),
        dateTime: selectedSlot.start.toISOString(),
        status: 'SCHEDULED'
      }

      const response = await fetch('http://localhost:4000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Greška pri rezervaciji termina')
      }

      const appointment = await response.json()
      setBookingSuccess(true)
      router.push('/termini')
    } catch (error) {
      console.error('Error in handleBookAppointment:', error)
      alert(`Greška pri rezervaciji: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSlot, selectedStylist, selectedServices, user, router])

  // Get stylists for selected salon
  const getStylistsForSalon = useCallback(() => {
    if (!selectedSalon) return []
    return stylists.filter(stylist => stylist.salonId === selectedSalon.id)
  }, [selectedSalon, stylists])

  if (!user || user.role !== 'CLIENT') {
    return null 
  }

  // Render steps based on current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                <FaStore className="text-amber-500 text-2xl" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Odaberite Salon</h2>
            <p className="text-gray-400">Odaberite salon koji želite posjetiti</p>
          </div>
        )
      case 2:
        return (
          <div className="flex items-center mb-6">
            <button onClick={() => setStep(1)} className="text-amber-500 hover:text-amber-400 mr-4">
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">Odaberite Frizer i Usluge</h2>
              <div className="flex items-center text-sm text-gray-400">
                <FaStore className="mr-2" />
                <span>{selectedSalon?.name}</span>
                {selectedSalon?.phone && (
                  <>
                    <span className="mx-2">•</span>
                    <FaPhone className="mr-1" />
                    <span>{selectedSalon.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="flex items-center mb-6">
            <button onClick={() => setStep(2)} className="text-amber-500 hover:text-amber-400 mr-4">
              <FaArrowLeft />
            </button>
            <h2 className="text-xl font-bold text-white">Odaberite Datum i Vrijeme</h2>
          </div>
        )
      default:
        return null
    }
  }

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salons.map(salon => (
              <div 
                key={salon.id}
                onClick={() => {
                  setSelectedSalon(salon)
                  setStep(2)
                }}
                className="group border border-gray-700 rounded-lg cursor-pointer transition-all duration-300 hover:border-amber-500/50 overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={salon.imageUrl || '/images/salon-placeholder.jpg'}
                    alt={salon.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-bold text-white text-xl">{salon.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-gray-400 mb-2">
                    <FaMapMarkerAlt className="mr-2 text-amber-500" />
                    <span>{salon.address}</span>
                  </div>
                  {salon.phone && (
                    <div className="flex items-center text-gray-400">
                      <FaPhone className="mr-2 text-amber-500" />
                      <a href={`tel:${salon.phone}`} className="hover:text-amber-500 transition-colors">
                        {salon.phone}
                      </a>
                    </div>
                  )}
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
                      {stylists.filter(s => s.salonId === salon.id).length || 0} frizera
                    </span>
                    <span className="text-xs text-gray-500">Kliknite za detalje</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      case 2:
        const salonStylists = getStylistsForSalon()
        return (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <FaUserTie className="mr-2 text-amber-500" />
                Dostupni Frizera
              </h3>
              
              <div className="space-y-4">
                {salonStylists.map(stylist => (
                  <div 
                    key={stylist.id}
                    onClick={() => {
                      setSelectedStylist(stylist)
                      setSelectedServices([])
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${selectedStylist?.id === stylist.id ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 hover:border-amber-500/50'}`}
                  >
                    <div className="flex items-start">
                      <div className="relative mr-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={stylist.profilePhoto || '/images/barber-placeholder.jpg'}
                            alt={stylist.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                          <FaUserTie className="text-xs text-black" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{stylist.name}</h3>
                        {stylist.specialties && (
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="text-amber-500">Specijalnost: </span>
                            {stylist.specialties}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-3/5">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <FaCut className="mr-2 text-amber-500" />
                {selectedStylist ? `Usluge - ${selectedStylist.name}` : 'Dostupne Usluge'}
              </h3>
              
              {selectedStylist ? (
                <>
                  <div className="space-y-4">
                    {selectedStylist.stylistServices?.map(service => (
                      <div 
                        key={service.id} 
                        onClick={() => {
                          if (selectedServices.some(s => s.id === service.id)) {
                            setSelectedServices(selectedServices.filter(s => s.id !== service.id))
                          } else {
                            setSelectedServices([...selectedServices, service])
                          }
                        }}
                        className={`p-4 border rounded-lg transition-all duration-300 ${selectedServices.some(s => s.id === service.id) ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 hover:border-amber-500/50'}`}
                      >
                        <div className="flex">
                          <div className="relative w-20 h-20 mr-4 flex-shrink-0">
                            <Image
                              src={service.imageUrl || '/images/service-placeholder.jpg'}
                              alt={service.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-white">{service.name}</h3>
                              <span className="text-amber-500 font-bold text-lg">{service.price} KM</span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <FaRegClock className="mr-1" />
                              <span>{service.duration} min</span>
                            </div>
                            {service.description && (
                              <div className="mt-2 flex items-start">
                                <FaInfoCircle className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-400">{service.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedServices.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h3 className="font-medium text-white mb-3 flex items-center">
                        <FaCheck className="mr-2 text-amber-500" />
                        Sažetak Odabira
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="mr-3 text-amber-500">
                            <FaUserTie className="text-lg" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-300">{selectedStylist.name}</p>
                            <p className="text-xs text-gray-500">{selectedStylist.specialties}</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-3">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Usluge:</h4>
                          <ul className="space-y-3">
                            {selectedServices.map(service => (
                              <li key={service.id} className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-gray-300">{service.name}</p>
                                  <p className="text-xs text-gray-500">{service.duration} min</p>
                                </div>
                                <span className="text-amber-500 font-medium">{service.price} KM</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between mt-4 pt-3 border-t border-gray-700 text-white">
                            <span className="font-medium">Ukupno:</span>
                            <span className="font-bold text-amber-500 text-lg">
                              {totalPrice} KM ({totalDuration} min)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-dashed border-gray-700 rounded-lg">
                  <FaUserTie className="mx-auto text-3xl text-gray-600 mb-2" />
                  <p className="text-gray-500">Molimo odaberite frizera da vidite dostupne usluge</p>
                </div>
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center">
                <FaCalendarDay className="mr-2" />
                Datum
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date)
                  setSelectedSlot(null)
                }}
                minDate={new Date()}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 text-white rounded-md focus:border-amber-500 focus:ring-amber-500 p-3"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={fetchAvailableSlots}
                disabled={!selectedDate || !selectedStylist || selectedServices.length === 0}
                className={`px-4 py-2 rounded-md ${!selectedDate || !selectedStylist || selectedServices.length === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black font-medium'}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Provjeravam dostupnost...
                  </span>
                ) : (
                  'Provjeri Dostupne Termine'
                )}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-center py-2">
                {error}
              </div>
            )}
            
            {selectedDate && availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center">
                  <FaClock className="mr-2" />
                  Dostupni Termini
                </label>
                <TimePicker
                  availableSlots={availableSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                />
              </div>
            )}
            
            {selectedDate && availableSlots.length === 0 && !isLoading && !error && (
              <div className="text-center py-4 text-gray-400">
                Nema dostupnih termina za odabrani datum
              </div>
            )}
            
            {selectedSlot && (
              <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg mt-4">
                <h3 className="font-medium text-amber-500 mb-4 flex items-center">
                  <FaCheck className="mr-2" />
                  Potvrda Termina
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <Image
                          src={selectedSalon.imageUrl || '/images/salon-placeholder.jpg'}
                          alt={selectedSalon.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{selectedSalon.name}</h4>
                      <p className="text-xs text-gray-400 flex items-center">
                        <FaMapMarkerAlt className="mr-1" />
                        {selectedSalon.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={selectedStylist.profilePhoto || '/images/barber-placeholder.jpg'}
                          alt={selectedStylist.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{selectedStylist.name}</h4>
                      {selectedStylist.specialties && (
                        <p className="text-xs text-gray-400">{selectedStylist.specialties}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Odabrane Usluge:</h4>
                    <ul className="space-y-3">
                      {selectedServices.map(service => (
                        <li key={service.id} className="flex items-start">
                          <div className="relative w-10 h-10 mr-3 flex-shrink-0">
                            <Image
                              src={service.imageUrl || '/images/service-placeholder.jpg'}
                              alt={service.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">{service.name}</span>
                              <span className="text-amber-500">{service.price} KM</span>
                            </div>
                            <p className="text-xs text-gray-500">{service.duration} min</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between mt-4 pt-3 border-t border-gray-700 text-white">
                      <span className="font-medium">Ukupna Cijena:</span>
                      <span className="font-bold text-amber-500 text-lg">{totalPrice} KM</span>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span>Ukupno Trajanje:</span>
                      <span className="text-gray-300">{totalDuration} minuta</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Termin:</span>
                      <span className="text-white font-medium">
                        {selectedSlot.start.toLocaleDateString('hr-HR')} u {formatTime(selectedSlot.start)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // Render navigation buttons
  const renderNavigation = () => {
    switch (step) {
      case 1:
        return null
      case 2:
        return (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(1)}
              className="flex items-center text-amber-500 hover:text-amber-400 px-4 py-2 rounded-md border border-amber-500/30 hover:bg-amber-500/10"
            >
              <FaArrowLeft className="mr-2" />
              Nazad
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedStylist || selectedServices.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${!selectedStylist || selectedServices.length === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black font-medium'}`}
            >
              Dalje
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        )
      case 3:
        return (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(2)}
              className="flex items-center text-amber-500 hover:text-amber-400 px-4 py-2 rounded-md border border-amber-500/30 hover:bg-amber-500/10"
            >
              <FaArrowLeft className="mr-2" />
              Nazad
            </button>
            <button
              onClick={handleBookAppointment}
              disabled={!selectedSlot || isLoading}
              className={`px-6 py-3 rounded-md flex items-center ${!selectedSlot || isLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black font-bold'}`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Rezerviram...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Potvrdi Termin
                </>
              )}
            </button>
          </div>
        )
      default:
        return null
    }
  }

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
      
      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 pt-60 relative z-10">
        <div className="w-full max-w-5xl">
          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-8 shadow-2xl">
            {isLoading && step === 1 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Učitavanje salona...</p>
              </div>
            ) : error && step === 1 ? (
              <div className="text-center py-8 text-red-400">
                <p>{error}</p>
                <p className="text-sm text-gray-400 mt-2">Koristim zamjenske podatke</p>
              </div>
            ) : (
              <>
                {renderStep()}
                {renderContent()}
                {renderNavigation()}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}