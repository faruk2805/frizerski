'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaCut } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black pt-24 pb-16 overflow-hidden">
      {/* Gold gradient background elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gold to-transparent filter blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-1"
          >
            <div className="flex flex-col items-center md:items-start">
              <div className="relative w-24 h-24 mb-6">
                <Image 
                  src="/images/logo.png" 
                  alt="BlackGold Logo" 
                  fill
                  className="object-contain filter brightness-0 invert"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 text-center md:text-left">BarberShop Fraga</h2>
              <p className="text-gray-400 mb-6 text-center md:text-left max-w-md">
                Premium muški frizerski salon koji kombinira tradiciju sa savremenim trendovima u srcu Sarajeva.
              </p>
              
              <div className="flex space-x-4">
                <motion.a 
                  href="https://facebook.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-gold hover:bg-gray-800 transition-all"
                >
                  <FaFacebookF className="text-xl" />
                </motion.a>
                <motion.a 
                  href="https://instagram.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-gold hover:bg-gray-800 transition-all"
                >
                  <FaInstagram className="text-xl" />
                </motion.a>
                <motion.a 
                  href="https://twitter.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-gold hover:bg-gray-800 transition-all"
                >
                  <FaTwitter className="text-xl" />
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Navigation Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <FaCut className="text-gold mr-3" />
              Navigacija
            </h3>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-4">
              <motion.li whileHover={{ x: 5 }}>
                <Link href="/" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  Početna
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link href="#services" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  Usluge
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link href="#gallery" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  Galerija
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link href="#team" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  Tim
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link href="#about" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  O Nama
                </Link>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <Link href="#contact" className="text-gray-400 hover:text-gold transition-colors text-lg">
                  Kontakt
                </Link>
              </motion.li>
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <FaCut className="text-gold mr-3" />
              Kontakt
            </h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="text-gold mt-1 mr-4">
                  <FaMapMarkerAlt className="text-xl" />
                </div>
                <div>
                  <h4 className="text-gray-300 font-medium mb-1">Adresa</h4>
                  <p className="text-gray-400">Zmaja od Bosne bb</p>
                  <p className="text-gray-400">71000 Sarajevo</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-gold mt-1 mr-4">
                  <FaPhoneAlt className="text-xl" />
                </div>
                <div>
                  <h4 className="text-gray-300 font-medium mb-1">Telefon</h4>
                  <a href="tel:+38733123456" className="text-gray-400 hover:text-gold transition-colors block text-lg">
                    +387 33 123 456
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-gold mt-1 mr-4">
                  <FaClock className="text-xl" />
                </div>
                <div>
                  <h4 className="text-gray-300 font-medium mb-1">Radno vrijeme</h4>
                  <p className="text-gray-400">Pon-Pet: 08:00 - 20:00</p>
                  <p className="text-gray-400">Subota: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Copyright Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 mb-4 md:mb-0">
              &copy; {currentYear} DevHeist. Sva prava zadržana.
            </p>
            
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-gold transition-colors">
                Uslovi korištenja
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gold transition-colors">
                Politika privatnosti
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}