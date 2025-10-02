'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const usluge = [
  {
    slika: '/images/gallery/vip.jpg',
    naslov: 'Premium Šišanje',
    opis: 'Precizno šišanje sa italijanskim tehnikama i vrhunskom opremom za savršen stil',
    cijena: '25KM',
    istaknuto: false,
    trajanje: '45 min'
  },
  {
    slika: '/images/gallery/hot.jpg',
    naslov: 'Luksuzno Brijanje',
    opis: 'Topli ručnici, masaža sa argan uljem i precizno oblikovanje brade',
    cijena: '20KM',
    istaknuto: true,
    trajanje: '30 min'
  },
  {
    slika: '/images/gallery/brada.jpg',
    naslov: 'Klasično Brijanje',
    opis: 'Tradicionalno brijanje žiletom sa toplom pjenom i negom nakon tretmana',
    cijena: '30KM',
    istaknuto: false,
    trajanje: '40 min'
  },
  {
    slika: '/images/gallery/vipp.jpg',
    naslov: 'VIP Tretman',
    opis: 'Ekskluzivan paket uključujući šišanje, tretman lica, masažu i osvježenje',
    cijena: '60KM',
    istaknuto: true,
    trajanje: '90 min'
  }
];

export default function Usluge() {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const hoverVariants = {
    hover: {
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      ref={ref}
      className="relative py-28 bg-black overflow-hidden"
      id="usluge"
    >
      {/* Dekorativni elementi pozadine */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Naslov sekcije */}
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants}>
            <span className="text-gold font-medium tracking-[0.3em] text-xs mb-4 inline-block">
              PREMIUM USLUGE
            </span>
            <motion.h2 
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6"
              whileHover={{ letterSpacing: '0.05em' }}
              transition={{ duration: 0.3 }}
            >
              Naši <span className="text-gold">ekskluzivni</span> tretmani
            </motion.h2>
            <div className="flex justify-center">
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            </div>
          </motion.div>
        </motion.div>

        {/* Grid usluga */}
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {usluge.map((usluga, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              className={`relative group overflow-hidden ${usluga.istaknuto ? 'lg:row-span-2 lg:col-span-1' : ''}`}
            >
              <motion.div
                variants={hoverVariants}
                className="h-full flex flex-col border border-gray-800/50 bg-gray-900/80 backdrop-blur-sm transition-all duration-500 group-hover:border-gold/30"
              >
                {/* Slika usluge */}
                <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden">
                  <Image
                    src={usluga.slika}
                    alt={usluga.naslov}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    quality={100}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  {/* Istaknuta oznaka */}
                  {usluga.istaknuto && (
                    <div className="absolute top-4 right-4 bg-gold text-black px-3 py-1 text-xs font-bold rounded-full tracking-wider z-10">
                      PREMIUM
                    </div>
                  )}
                </div>
                
                {/* Sadržaj usluge */}
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-medium text-white mb-3 group-hover:text-gold transition-colors duration-300">
                    {usluga.naslov}
                  </h3>
                  
                  <p className="text-gray-400 mb-6 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300 flex-grow">
                    {usluga.opis}
                  </p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-800 group-hover:border-gold/30 transition-colors duration-500">
                    <div>
                      <span className="text-gold font-medium text-lg block">
                        {usluga.cijena}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {usluga.trajanje}
                      </span>
                    </div>
                    <button className="text-white hover:text-gold text-sm font-medium tracking-wide transition-colors duration-300">
                      REZERVIŠI →
                    </button>
                  </div>
                </div>
              </motion.div>
              
              {/* Efekat sjaja */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gold/10"></div>
                <div className="absolute -inset-1 bg-gold/5 rounded-lg filter blur-md"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dugme za sve usluge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center mt-16"
        >
          <button className="relative px-8 py-3 border border-gold text-gold font-medium rounded-sm hover:bg-gold/10 transition-all duration-300 group overflow-hidden">
            <span className="relative z-10 flex items-center gap-2 tracking-wider">
              SVE USLUGE
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}