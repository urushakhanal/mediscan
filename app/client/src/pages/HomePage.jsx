import React, { useState } from 'react';
import MediScanSplash from '../components/homepage/MediScanSplash';
import Hero from '../components/homepage/Hero';
import HowItWorks from '../components/homepage/HowItWorks';
import WhyChooseUs from '../components/homepage/WhyChooseUs';
import Testimonials from '../components/homepage/Testimonials';
import FinalCta from '../components/homepage/FinalCta'

const HomePage = () => {
    const [showSplash, setShowSplash] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('mediscan_splash_seen') !== 'true';
    });

    const handleSplashComplete = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('mediscan_splash_seen', 'true');
        }
        setShowSplash(false);
    };

    return (
        <div className="flex flex-col gap-0">
            {showSplash && <MediScanSplash duration={3500} onComplete={handleSplashComplete} />}
            <Hero />
            <HowItWorks />
            <WhyChooseUs />
            <Testimonials/>
            <FinalCta/>
        </div>
    );
};

export default HomePage;
