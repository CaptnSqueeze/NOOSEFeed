// pages/AboutPage.tsx
import React, { useEffect } from 'react';

const AboutPage = () => {

    useEffect(() => {
        window.scrollTo(0, 0); // Scrolls to the top when the component mounts
    }, []);


    return (
        <div className="bg-gray-800 p-4 md:p-6 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-4">About NOOSEFeed</h1>
            <p className="mb-4">
                NOOSEFeed is a simple RSS reader that aggregates news from various sources without
                algorithms, paywalls, or tracking. Our goal is to provide a clean, user-friendly
                interface to access news from around the world.
            </p>
            <p>
                No app, no paywalls, no algorithms... just news.
            </p>
        </div>
    );
};

export default AboutPage;