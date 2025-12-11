import React from 'react';
import MediScanSplash from '../components/homepage/MediScanSplash';
import Hero from '../components/homepage/Hero';
import HowItWorks from '../components/homepage/HowItWorks';
import WhyChooseUs from '../components/homepage/WhyChooseUs';

const HomePage = () => {
    return (
        <div className="flex flex-col gap-0">
            <MediScanSplash duration={3500} />
            <Hero />
            <HowItWorks />
            <WhyChooseUs />
        </div>
    );
};

export default HomePage;
