'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaPaperPlane, FaCut } from 'react-icons/fa';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-28 bg-black overflow-hidden" id="contact">
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl md:text-5xl text-white mb-4"
          >
            <span className="text-gold">Kontaktirajte</span> nas
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mt-6 max-w-2xl mx-auto"
          >
            Posjetite nas u salonu ili nas kontaktirajte putem telefona/emaila za dodatna pitanja.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:w-1/2 space-y-8"
          >
            <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 hover:border-gold/50 transition-colors">
              <div className="flex items-center mb-6">
                <FaCut className="text-3xl text-gold mr-4" />
                <h3 className="text-2xl font-bold text-white">BarberShop Fraga</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-gold mr-4 mt-1">
                    <FaMapMarkerAlt className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-bold mb-1">Adresa</h4>
                    <p className="text-gray-400">Zmaja od Bosne bb, Sarajevo</p>
                    <p className="text-gray-500 text-sm mt-1">(Narodnog pozorišta, iza BBI centra)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gold mr-4 mt-1">
                    <FaPhoneAlt className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-bold mb-1">Telefon</h4>
                    <a href="tel:+38733123456" className="text-gray-400 hover:text-gold transition-colors">
                      +387 33 123 456
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gold mr-4 mt-1">
                    <FaEnvelope className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-bold mb-1">Email</h4>
                    <a href="mailto:info@blackgold.ba" className="text-gray-400 hover:text-gold transition-colors">
                      info@blackgold.ba
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gold mr-4 mt-1">
                    <FaClock className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-bold mb-1">Radno vrijeme</h4>
                    <p className="text-gray-400">
                      Pon-Pet: 08:00 - 20:00<br />
                      Subota: 09:00 - 18:00<br />
                      Nedjelja: Zatvoreno
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 hover:border-gold/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-6">Hitna rezervacija?</h3>
              <p className="text-gray-400 mb-6">
                Za hitne rezervacije ili grupne dogovore, pozovite direktno na naš broj:
              </p>
              <a 
                href="tel:+38761123456" 
                className="inline-flex items-center px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold/90 transition-colors"
              >
                <FaPhoneAlt className="mr-2" />
                +387 61 123 456
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <form 
              onSubmit={handleSubmit}
              className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 hover:border-gold/50 transition-colors"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Pošaljite upit</h3>
              <p className="text-gray-400 mb-8">Popunite formu i javićemo vam se u najkraćem roku</p>

              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-900/50 text-green-400 rounded-lg border border-green-800"
                >
                  Hvala na poruci! Javićemo vam se uskoro.
                </motion.div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-300 font-medium mb-2">Ime i prezime *</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-gray-300 font-medium mb-2">Email *</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-gray-300 font-medium mb-2">Telefon</label>
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-300 font-medium mb-2">Poruka *</label>
                  <textarea 
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    required
                  ></textarea>
                </div>

                <motion.button 
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-8 py-4 bg-gold text-black font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Šaljem...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaPaperPlane className="mr-2" />
                      Pošalji poruku
                    </span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}