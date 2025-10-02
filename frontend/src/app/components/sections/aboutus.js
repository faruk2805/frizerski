'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { FaCut, FaShower } from 'react-icons/fa';

export default function AboutUs() {
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
        staggerChildren: 0.2,
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

  return (
    <section 
      ref={ref}
      className="relative py-28 bg-black overflow-hidden"
      id="about"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold rounded-full filter blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="flex flex-col lg:flex-row gap-12 items-center"
        >
          {/* Image Section */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2 relative"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/gallery/interijerr.jpg"
                alt="BarberShop Fraga interijer"
                fill
                className="object-cover"
                quality={100}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-black/80 text-gold px-6 py-3 rounded-lg"
                >
                  <FaCut className="text-4xl mb-2 mx-auto" />
                  <h3 className="text-xl font-bold text-center">BarberShop Fraga</h3>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Content Section */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2"
          >
            <motion.div variants={itemVariants}>
              <span className="text-gold font-medium tracking-[0.3em] text-xs mb-4 inline-block">
                NAŠA PRIČA
              </span>
              <motion.h2 
                className="font-serif text-4xl md:text-5xl text-white mb-6"
                whileHover={{ letterSpacing: '0.05em' }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-gold">Dobrodošli</span> u BarberShop Fraga
              </motion.h2>
              <div className="w-24 h-[2px] bg-gradient-to-r from-gold via-gold-dark to-transparent mb-8"></div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <p className="text-gray-300 leading-relaxed">
                BarberShop Fraga je premium muški salon osnovan 2015. godine sa vizijom da ponudi nešto više od običnog šišanja. Naša filozofija je kombinacija tradicije, kvaliteta i modernih trendova u svijetu muške njege.
              </p>

              <p className="text-gray-300 leading-relaxed">
                Sa sjedištem u srcu grada, naš salon predstavlja oazu mira gdje svaki klijent dobija personalizovano iskustvo prilagođeno njegovim potrebama i željama. Naš tim vrhunskih majstora stalno se usavršava kako bi vam pružio najbolje usluge.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <motion.div 
                  className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-gold/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-gold text-3xl mb-4">
                    <FaCut />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Premium usluge</h3>
                  <p className="text-gray-400">
                    Koristimo isključivo vrhunsku opremu i preparate vodećih svjetskih brendova.
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-gold/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-gold text-3xl mb-4">
                    <FaCut />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Tradicionalne tehnike</h3>
                  <p className="text-gray-400">
                    Kombiniramo tehnike sa modernim pristupom za savršene rezultate.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}