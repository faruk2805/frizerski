'use client';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroSection from './components/sections/HeroSection';
import Services from './components/sections/Services';
import Gallery from './components/sections/Gallery';
import Team from './components/sections/Team';
import Contact from './components/sections/Contact';
import AboutUs from './components/sections/aboutus';

export default function Home() {
  return (
    <div className="bg-primary-black">
      <Navbar />
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* About Us */}
        <AboutUs />
        
        {/* Services Section */}
        <Services />

        {/* Team Section */}
        <Team />

        {/* Gallery Section */}
        <Gallery />

        {/* Contact Section */}
        <Contact />
      </main>
      <Footer />
    </div>
  );
}