'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/context/authcontext';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope, FaUser, FaSignInAlt, FaArrowRight, FaCheckCircle, FaPhone } from 'react-icons/fa';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Šifre se ne poklapaju');
      return;
    }

    // Poboljšana validacija telefona
    const phoneRegex = /^[0-9\s\-+]{6,15}$/;
    if (!phoneRegex.test(phone)) {
      setError('Unesite ispravan broj telefona (npr. 061234567 ili 061 234 567)');
      return;
    }

    setIsLoading(true);

    try {
      // Očisti broj telefona prije slanja na server
      const cleanedPhone = phone.replace(/[\s\-+]/g, '');
      
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone: cleanedPhone, 
          password 
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setError(error || 'Greška pri registraciji.');
        return;
      }

      const { token, user } = await res.json();
      
      setSuccessMessage('Uspešno ste registrovani! Možete se prijaviti na svoj nalog.');
      
      sessionStorage.setItem('registrationSuccess', 'true');
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (err) {
      console.error('Registration error:', err);
      setError('Došlo je do greške. Pokušaj ponovo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="flex flex-col min-h-screen bg-black relative">
        <div className="fixed inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg" 
            alt="Pozadina"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 pt-60 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-gray-900/80 backdrop-blur-md border border-green-800 rounded-xl p-8 shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-green-900/20 flex items-center justify-center">
                  <FaCheckCircle className="text-green-400 text-4xl" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-green-400 mb-4">Registracija uspješna!</h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 mb-6 text-lg"
              >
                {successMessage}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400 mt-4">Preusmjeravanje na stranicu za prijavu...</p>
              </motion.div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg" 
          alt="Pozadina"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>
      
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 pt-60 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <FaUser className="text-gold text-2xl" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Napravite nalog</h2>
              <p className="text-gray-400">Popunite podatke za registraciju</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-800 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                  Ime i prezime
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Vaše ime i prezime"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email adresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="vas@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-500" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="npr. 061234567 ili 061 234 567"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Možete unijeti broj sa ili bez razmaka</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Šifra
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Vaša šifra"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                  Potvrdite šifru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Ponovite šifru"
                  />
                </div>
              </div>

              <div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-black bg-gold hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registracija...
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="mr-2" />
                      Registrujte se
                      <FaArrowRight className="ml-2" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Već imate nalog?</span>
                </div>
              </div>

              <div className="mt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-700 rounded-lg shadow-sm text-lg font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold"
                >
                  Prijavite se
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}