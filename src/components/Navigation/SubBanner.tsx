import React, { useState, useCallback, useEffect } from 'react';

interface SubBannerProps {
    refreshFeed: () => Promise<void>;
}

const SubBanner: React.FC<SubBannerProps> = ({ refreshFeed }) => {
    // State to track the last refresh time
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
    const [refreshTimeDisplay, setRefreshTimeDisplay] = useState("Just now");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Function to update the time display
    const updateTimeDisplay = useCallback(() => {
        const now: number = Date.now();
        const diffMs: number = now - lastRefreshTime;
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) {
            setRefreshTimeDisplay("Just now");
        } else if (diffMins === 1) {
            setRefreshTimeDisplay("1 min ago");
        } else if (diffMins < 60) {
            setRefreshTimeDisplay(`${diffMins} mins ago`);
        } else {
            const hours = Math.floor(diffMins / 60);
            if (hours === 1) {
                setRefreshTimeDisplay("1 hour ago");
            } else {
                setRefreshTimeDisplay(`${hours} hours ago`);
            }
        }
    }, [lastRefreshTime]);

    // Update the time display every minute
    useEffect(() => {
        updateTimeDisplay();
        const intervalId = setInterval(updateTimeDisplay, 60000);
        return () => clearInterval(intervalId);
    }, [updateTimeDisplay]);

    // Wrapper for the refresh function
    const handleRefresh = () => {
        setIsRefreshing(true);

        // Call the refresh function
        refreshFeed()
            .then(() => {
                setLastRefreshTime(Date.now());
                setRefreshTimeDisplay("Just now");
                setIsRefreshing(false);
            })
            .catch(() => {
                setIsRefreshing(false);
            });
    };

    return (
        <div className="sub-banner w-full text-white p-1.5 flex items-center justify-between z-10 relative">
            <div className="text-xs md:text-sm font-medium ml-3 mt-1 med:mt-0 lg:mt-0">
                <span className="opacity-75">
                    {isRefreshing ? "Refreshing..." : `Last Refreshed: ${refreshTimeDisplay}`}
                </span>
            </div>
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`
                    ${isRefreshing
                        ? 'bg-blue-800 cursor-not-allowed'
                        : 'bg-blue-700 hover:bg-blue-600'
                    } 
                    text-white text-xs md:text-sm px-2 py-1 rounded-md flex items-center mr-1 md:translate-y-0.1 translate-y-0.5
                `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15 " />
                </svg>
                {isRefreshing ? "Refresh Feed" : "Refresh Feed"}
            </button>
        </div>
    );
};

export default SubBanner;