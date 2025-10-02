'use client';

import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export default function HeroSection() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      controls.start('hidden');
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        yoyo: Infinity
      }
    }
  };

  return (
    <section 
      ref={ref}
      className="relative h-screen flex items-center justify-center bg-primary-black overflow-hidden pt-[80px] md:pt-[120px]"
      id="home"
    >
      {/* Parallax Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Background Image with Multi-layer Gradient Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Premium Barber Shop"
            fill
            className="object-cover opacity-40"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-black via-primary-black/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary-black/80 via-transparent to-primary-black/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary-black/70 to-primary-black"></div>
        </div>

        {/* Decorative Elements */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-gold"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-3 h-3 rounded-full bg-gold"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
      
      {/* Content Container */}
      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="container mx-auto px-6 z-10 text-center"
      >
        {/* Main Heading with Decorative Elements */}
        <motion.div
          variants={itemVariants}
          className="mb-8 relative"
        >
          {/* Decorative Lines */}
          <div className="hidden lg:block absolute left-0 top-1/2 w-16 h-px bg-gold/50"></div>
          <div className="hidden lg:block absolute right-0 top-1/2 w-16 h-px bg-gold/50"></div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-gold mb-4 leading-tight tracking-tight">
            <motion.span 
              className="block font-light tracking-wider"
              whileHover={{ letterSpacing: '0.1em' }}
              transition={{ duration: 0.3 }}
            >
              IZRAZI
            </motion.span>
            <motion.span 
              className="block font-medium italic"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              SVOJ STIL
            </motion.span>
          </h1>
          
          <motion.div 
            className="w-32 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto my-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
        </motion.div>
        
        {/* Description Text */}
        <motion.p
          variants={itemVariants}
          className="text-gray-light text-lg md:text-xl lg:text-2xl max-w-2xl lg:max-w-3xl mx-auto mb-12 font-sans font-light leading-relaxed tracking-wide"
        >
          <span className="text-gold font-medium">Premium</span> brijački salon gdje se tradicija susreće s modernim trendovima. Naši majstori će vam pružiti <span className="italic">iskustvo</span> koje ćete pamtiti.
        </motion.p>
        
        {/* Buttons with Enhanced Interactions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-6"
        >
          <motion.button 
            className="relative px-8 py-3 sm:px-10 sm:py-4 bg-gold text-primary-black font-medium hover:bg-gold-light transition-all duration-300 group overflow-hidden rounded-sm"
            variants={buttonVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider font-medium">
              REZERVISI TERMIN
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="absolute inset-0 border border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </motion.button>
          
          <motion.button 
            className="relative px-8 py-3 sm:px-10 sm:py-4 border border-gold text-gold font-medium hover:bg-gold/10 transition-all duration-300 group rounded-sm"
            variants={buttonVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 tracking-wider font-medium">VIŠE O NAMA</span>
            <span className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Animated Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div 
          className="flex flex-col items-center cursor-pointer"
          animate={{
            y: [0, 15, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-gold/80 text-xs tracking-[0.3em] mb-3">SCROLL DOWN</span>
          <svg className="w-5 h-5 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Social Media Links - Desktop Only */}
      <motion.div 
        className="hidden lg:flex flex-col items-center gap-6 absolute left-12 bottom-1/4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <a href="#" className="text-gold/60 hover:text-gold transition-colors duration-300">
          <span className="vertical-text tracking-widest text-xs">FOLLOW US</span>
        </a>
        <div className="h-16 w-px bg-gold/40"></div>
        {['Instagram', 'Facebook', 'Twitter'].map((social) => (
          <a 
            key={social}
            href="#"
            className="text-gold/60 hover:text-gold transition-colors duration-300 text-xs"
          >
            {social}
          </a>
        ))}
      </motion.div>
    </section>
  );
}