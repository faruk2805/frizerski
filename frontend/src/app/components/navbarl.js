'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from './context/authcontext';
import { useRouter } from 'next/navigation';


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener('routeChange', handleRouteChange);
    return () => window.removeEventListener('routeChange', handleRouteChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  const baseNavItems = [
    { name: 'Početna', href: '/' },
    { name: 'O nama', href: '#o-nama' },
    { name: 'Usluge', href: '#usluge' },
    { name: 'Tim', href: '#tim' },
    { name: 'Galerija', href: '#galerija' },
    { name: 'Kontakt', href: '#kontakt' }
  ];

  const loggedInNavItems = [
    { name: 'Termini', href: '/termini' },
    { name: 'Recenzije', href: '/recenzije' },
    { name: 'Chat', href: '/chat' },
    { name: 'Shop', href: '/shop' }
  ];

  const leftNavItems = baseNavItems;
  const rightNavItems = user ? loggedInNavItems : [];

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed w-full py-4 px-4 sm:px-6 lg:px-28 flex justify-between items-center z-50 transition-all duration-500 ease-in-out ${scrolled
          ? 'bg-background/95 backdrop-blur-md py-3 shadow-lg border-b border-foreground/5'
          : 'bg-transparent'
          }`}
      >
        {/* Logo - Mobile */}
        <Link
          href="/"
          className="md:hidden relative w-16 h-16 transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </Link>

        {/* Left Navigation - Desktop */}
        <nav className="hidden md:flex space-x-8 lg:space-x-10">
          {leftNavItems.map((item) => (
            <Link key={item.name} href={item.href} className="relative group">
              <span className="text-foreground/90 group-hover:text-gold transition-all duration-300 font-medium text-lg tracking-wider">
                {item.name}
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-gold to-gold-dark transition-all duration-500 group-hover:w-full"></span>
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-foreground/10"></span>
            </Link>
          ))}
        </nav>

        {/* Animated Logo Center - Desktop */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <Link
            href="/"
            className="relative w-24 h-24 md:w-32 md:h-32 transition-all duration-700 hover:duration-300 group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              className={`absolute inset-0 rounded-full bg-gold/10 blur-md group-hover:bg-gold/20 transition-all duration-1000 ${isHovering ? 'opacity-100 scale-110' : 'opacity-0 scale-95'
                }`}
            ></div>
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className={`object-contain filter brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-700 group-hover:duration-300 ${isHovering ? 'rotate-[8deg] scale-105' : ''
                }`}
              priority
            />
          </Link>
        </div>

        {/* Right Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
          {/* Navigation links for logged in users */}
          {rightNavItems.map((item) => (
            <Link key={item.name} href={item.href} className="relative group">
              <span className="text-foreground/90 group-hover:text-gold transition-all duration-300 font-medium text-lg tracking-wider">
                {item.name}
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-gold to-gold-dark transition-all duration-500 group-hover:w-full"></span>
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-foreground/10"></span>
            </Link>
          ))}

          {/* User section */}
          <div className="flex items-center ml-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-foreground/90 font-medium">
                  {user.name.split(' ')[0]} {/* Display only first name */}
                </span>
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30">
                  <FiUser className="text-gold" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-foreground/90 hover:text-red-500 transition-colors"
                  aria-label="Odjava"
                >
                  <FiLogOut />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 text-foreground/90 hover:text-gold transition-colors"
              >
                <FiUser size={20} />
                <span className="text-lg">Prijava</span>
              </Link>
            )}
          </div>

          {/* Rezervacija button - Desktop (uvijek zadnji) */}
          <button onClick={() => {
            console.log('Kliknuto');
            router.push('/rezervacije');
          }} className="ml-4 relative px-6 py-3 bg-transparent text-gold font-medium rounded-md transition-all duration-300 group overflow-hidden border border-gold/30 hover:border-gold/50">
            <span className="relative z-10 flex items-center">
              Rezervacija
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 transition-all duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground/90 hover:text-gold transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
        >
          {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </button>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-28 px-6 transition-all duration-300 ease-in-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="flex flex-col space-y-6">
          {/* Base navigation items */}
          {baseNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-3xl font-medium text-foreground/90 hover:text-gold transition-colors py-3 border-b border-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {/* Additional items for logged in users */}
          {user && loggedInNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-3xl font-medium text-foreground/90 hover:text-gold transition-colors py-3 border-b border-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <div className="flex flex-col space-y-6 pt-8">
            {user ? (
              <>
                <div className="flex items-center space-x-4 text-2xl text-foreground/90">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30">
                    <FiUser size={24} className="text-gold" />
                  </div>
                  <span>{user.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xl text-left text-foreground/90 hover:text-red-500 transition-colors py-3 flex items-center"
                >
                  <FiLogOut className="mr-3" />
                  Odjava
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-4 text-2xl text-foreground/90 hover:text-gold transition-colors py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiUser size={28} />
                <span>Prijava</span>
              </Link>
            )}
            <button
              onClick={() => router.push('/rezervacije')}
              className="relative px-8 py-4 bg-transparent text-gold font-medium rounded-md transition-all duration-300 group overflow-hidden border border-gold/30 hover:border-gold/50 text-xl"
            >
              <span className="relative z-10 flex items-center justify-center">
                Rezervacija
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-3 h-6 w-6 transition-all duration-300 group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}