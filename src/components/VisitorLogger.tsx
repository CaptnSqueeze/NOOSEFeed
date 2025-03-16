// /src/components / VisitorLogger.tsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const VisitorLogger = () => {
    const location = useLocation();

    useEffect(() => {
        const logVisit = async () => {
            console.log('Attempting to log visit:', location.pathname);
            try {
                // Use the full URL to your API
                const response = await fetch('https://warriorlife.ca:3000/visitor-log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit', // Don't send cookies
                    mode: 'cors', // Explicitly set CORS mode
                    body: JSON.stringify({
                        path: location.pathname,
                        timestamp: new Date().toISOString()
                    }),
                });

                console.log('Log response:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error logging visit:', errorText);
                } else {
                    const data = await response.json();
                    console.log('Log successful:', data);
                }
            } catch (error) {
                console.error('Failed to log visit:', error);
            }
        };

        logVisit();
    }, [location]);

    return null;
};

export default VisitorLogger;