// pages/SourcesPage.tsx
import React, { useState, useEffect } from 'react';

interface Feed {
    title: string;
    link: string;
}

interface FeedCategory {
    category: string;
    feeds: Feed[];
}

const SourcesPage = () => {
    const [feedCategories, setFeedCategories] = useState<FeedCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch the default feeds
        fetch("/default-feeds.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch sources');
                }
                return response.json();
            })
            .then(data => {
                setFeedCategories(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error loading sources:", error);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="bg-gray-800 p-4 md:p-6 min-h-screen text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 md:p-6 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-6">News Sources</h1>

            {feedCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                        {category.category}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {category.feeds.map((feed, feedIndex) => (
                            <div key={feedIndex} className="bg-gray-900 p-4 rounded">
                                <h3 className="font-bold mb-2">{feed.title}</h3>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs mb-3 break-all">
                                        {feed.link}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SourcesPage;