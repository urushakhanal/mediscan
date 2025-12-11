import React from 'react';
import MediScanSplash from '../components/homepage/MediScanSplash';
import Hero from '../components/homepage/Hero';
import HowItWorks from '../components/homepage/HowItWorks';
import WhyChooseUs from '../components/homepage/WhyChooseUs';
import Testimonials from '../components/homepage/Testimonials';
import FinalCta from '../components/homepage/FinalCta'

const HomePage = () => {
    return (
        <div className="flex flex-col gap-0">
            <MediScanSplash duration={3500} />
            <Hero />
            <HowItWorks />
            <WhyChooseUs />
            <Testimonials/>
            <FinalCta/>
        </div>
    );
};

export default HomePage;
