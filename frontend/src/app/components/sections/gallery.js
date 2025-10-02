'use client';

import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const galleryImages = [
  { src: '/images/gallery/g1.jpg', category: 'šišanje', featured: false },
  { src: '/images/gallery/g2.jpg', category: 'styling', featured: false },
  { src: '/images/gallery/g3.jpg', category: 'šišanje', featured: false },
  { src: '/images/gallery/g4.jpg', category: 'brijanje', featured: false },
  { src: '/images/gallery/g5.jpg', category: 'interijer', featured: false },
  { src: '/images/gallery/brada.jpg', category: 'šišanje', featured: false },
  { src: '/images/gallery/g7.jpg', category: 'šišanje', featured: false },
  { src: '/images/gallery/g8.jpg', category: 'šišanje', featured: false }
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('sve');
  const [filteredImages, setFilteredImages] = useState(galleryImages);
  const [loadedImages, setLoadedImages] = useState(8);
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  useEffect(() => {
    if (activeFilter === 'sve') {
      setFilteredImages(galleryImages.slice(0, loadedImages));
    } else {
      setFilteredImages(
        galleryImages
          .filter(img => img.category === activeFilter)
          .slice(0, loadedImages)
      );
    }
  }, [activeFilter, loadedImages]);

  const loadMore = () => {
    setLoadedImages(prev => prev + 4);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      transition: {
        duration: 0.3
      }
    }
  };

  const buttonVariants = {
    hover: {
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderColor: 'rgba(212, 175, 55, 0.8)',
      transition: {
        duration: 0.3
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const categories = ['sve', 'šišanje', 'brijanje', 'styling', 'interijer'];

  return (
    <section 
      ref={ref}
      className="relative py-16 bg-black"
      id="galerija"
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Naslov sekcije */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl md:text-4xl text-white mb-3"
          >
            Naša <span className="text-gold">Galerija</span>
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"
          />
        </div>

        {/* Filter kategorija */}
        <div className="flex justify-center mb-8 overflow-x-auto py-2 px-4">
          <div className="flex space-x-2">
            {categories.map((kategorija, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                  setActiveFilter(kategorija);
                  setLoadedImages(8);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === kategorija
                    ? 'bg-gold text-black font-bold shadow-gold-sm'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {kategorija.charAt(0).toUpperCase() + kategorija.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Grid galerije */}
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <AnimatePresence>
            {filteredImages.map((slika, index) => (
              <motion.div
                key={`${slika.src}-${index}`}
                layout
                variants={itemVariants}
                whileHover="hover"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-sm"
              >
                <Image
                  src={slika.src}
                  alt={`Barber shop - ${slika.category}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-110"
                  quality={90}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-3 group">
                  <span className="text-white text-xs bg-black/70 px-3 py-1 rounded-full font-medium tracking-wide group-hover:bg-gold group-hover:text-black transition-all duration-300">
                    {slika.category.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Dugme za više */}
        {loadedImages < galleryImages.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <motion.button
              onClick={loadMore}
              className="px-8 py-3 border border-gold/50 text-gold text-sm font-medium tracking-wider relative overflow-hidden"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <span className="relative z-10 flex items-center justify-center">
                UČITAJ VIŠE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}