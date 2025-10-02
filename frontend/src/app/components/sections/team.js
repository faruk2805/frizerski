'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FiInstagram, FiFacebook, FiTwitter, FiPhone, FiCalendar, FiAward } from 'react-icons/fi';
import { FaCut, FaShower, FaPalette, FaRegStar, FaStar } from 'react-icons/fa';

export default function Team() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBarber, setHoveredBarber] = useState(null);
  const [activeSpecialty, setActiveSpecialty] = useState('sve');

  // Helper function to get specialty icon
  const getSpecialtyIcon = (specialty) => {
    switch(specialty.toLowerCase()) {
      case 'šišanje': return <FaCut className="text-gold mr-2" />;
      case 'brijanje': return <FaShower className="text-gold mr-2" />;
      case 'stiliziranje': 
      case 'boja kose': 
        return <FaPalette className="text-gold mr-2" />;
      default: return <FiAward className="text-gold mr-2" />;
    }
  };

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/users');
        if (!response.ok) throw new Error('Failed to fetch barbers');
        const data = await response.json();
        
        // Transform API data to include additional details
        const enhancedBarbers = data
          .filter(user => user.role === 'STYLIST' && user.isActive)
          .map(barber => ({
            ...barber,
            experience: "5+ godina", // Default experience
            bio: "Profesionalni frizer sa dugogodišnjim iskustvom",
            rating: 4.8, // Default rating
            social: {
              instagram: "@barber_username",
              facebook: "/barber.username",
              twitter: "@barber_handle"
            }
          }));
        
        setBarbers(enhancedBarbers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  if (loading) {
    return (
      <section className="relative py-28 bg-black" id="team">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gold">Učitavam naš tim...</p>
          </motion.div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-28 bg-black" id="team">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="text-red-400 mb-4 text-lg">Došlo je do greške</div>
            <p className="text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gold text-black font-medium rounded-lg hover:bg-gold/90 transition-colors flex items-center mx-auto"
            >
              Pokušajte ponovo
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-28 bg-black overflow-hidden" id="team">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl md:text-5xl text-white mb-4"
          >
            Naš <span className="text-gold">tim</span>
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mt-6 max-w-2xl mx-auto"
          >
            Upoznajte naše majstore koji će vam pružiti nezaboravno iskustvo šišanja i brijanja
          </motion.p>
        </div>

        {barbers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400">Trenutno nema dostupnih frizera</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {barbers.map((barber) => (
                <motion.div
                  key={barber.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                  onMouseEnter={() => setHoveredBarber(barber.id)}
                  onMouseLeave={() => setHoveredBarber(null)}
                >
                  {/* Barber Image */}
                  <div className="relative h-80 w-full overflow-hidden">
                    <Image
                      src={barber.profilePhoto || '/images/barbers/barber1.jpg'}
                      alt={barber.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-black/80 text-gold px-3 py-1 rounded-full flex items-center text-sm">
                      <FaStar className="mr-1" />
                      {barber.rating}
                    </div>
                    
                    {/* Social Icons */}
                    <div className={`absolute bottom-4 left-0 right-0 flex justify-center space-x-4 transition-all duration-500 ${hoveredBarber === barber.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      {barber.social.instagram && (
                        <a href={`https://instagram.com/${barber.social.instagram}`} className="text-white hover:text-gold transition-colors">
                          <FiInstagram size={20} />
                        </a>
                      )}
                      {barber.social.facebook && (
                        <a href={`https://facebook.com${barber.social.facebook}`} className="text-white hover:text-gold transition-colors">
                          <FiFacebook size={20} />
                        </a>
                      )}
                      {barber.social.twitter && (
                        <a href={`https://twitter.com/${barber.social.twitter}`} className="text-white hover:text-gold transition-colors">
                          <FiTwitter size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Barber Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                        {barber.name}
                      </h3>
                      <span className="text-sm text-gray-400 flex items-center">
                        <FiCalendar className="mr-1" />
                        {new Date(barber.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gold font-medium mb-3 flex items-center">
                      <FiAward className="mr-2" />
                      {barber.experience} iskustva
                    </p>
                    
                    <p className="text-gray-300 text-sm mb-4">{barber.bio}</p>
                    
                    <div className="border-t border-gray-800 pt-4">
                      <h4 className="text-sm text-gray-400 mb-2">Specijalnosti:</h4>
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties?.split(',').map((specialty, index) => (
                          <span key={index} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full flex items-center">
                            {getSpecialtyIcon(specialty.trim())}
                            {specialty.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {barber.phone && (
                      <div className="mt-4 flex items-center text-gray-300">
                        <FiPhone className="mr-2 text-gold" />
                        <a href={`tel:${barber.phone}`} className="hover:text-white transition-colors">
                          {barber.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <h3 className="text-2xl font-serif text-white mb-6">
            Želite se pridružiti našem timu?
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative px-8 py-4 bg-gold text-black font-bold rounded-lg hover:bg-gold/90 transition-colors group overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider">
              POŠALJITE PRIJAVU
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}