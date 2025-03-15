// App.tsx
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import ArticlePage from "./ArticlePage.tsx";
import './index.css';
import { getBestImageForFeedItem } from './ImageExtractor';


const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center p-4 bg-gray-900 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

function formatTimeAgo(pubDateStr: string): string {
    try {
        // Print raw string for debugging
        // console.log("Raw pubDate string:", pubDateStr);

        // Try to parse the date - first attempt with native Date
        let pubDate = new Date(pubDateStr);

        // Check if the date is valid
        if (isNaN(pubDate.getTime())) {
            // If not valid, try to clean up the string and parse again
            // RSS feeds often have non-standard formats
            const cleanDateStr = pubDateStr.replace(/[A-Za-z]{3},\s/, '').trim();
            pubDate = new Date(cleanDateStr);

            if (isNaN(pubDate.getTime())) {
                return "Unknown date";
            }
        }

        // For debugging - log parsed date and current time
        // console.log("Parsed pubDate:", pubDate);
        // console.log("Current time:", new Date());

        // For dates older than a week, return the formatted date
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 6) {
            return pubDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }

        // Calculate manually for more accurate relative time
        const timeDiff = now.getTime() - pubDate.getTime();
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (minutes > 0) {
            return minutes === 1 ? '1m' : `${minutes}m`;
        } else {
            return 'just now';
        }
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Unknown date";
    }
}

const ITEMS_PER_PAGE = 20; // Number of items to load at a time

const Banner = () => {
    return (
        <div className="bg-blue-600 text-white p-4 flex items-center justify-start">
            <img src="logo.png" alt="Logo" className="h-8 md:h-12 mr-4" />
            <div className="flex flex-col ml-auto text-right">
                <h1 className="text-lg md:text-2xl font-bold">Welcome to NOOSEFeed</h1>
                <h2 className="text-xs md:text-sm font-bold">no app, no paywalls, no algorithms... just news</h2>
            </div>
        </div>
    );
};

const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

interface Feed {
    title: string;   // The source name (e.g., "CBC", "Global News")
    link: string;
    category: string; // Category (e.g., "News - Canada")
}
export interface FeedItem {
    title: string;
    link: string;
    description: string;
    source: string; // Source is the title of the feed (e.g., "CBC", "BBC")
    category: string; // Category (e.g., "News - Canada")
    pubDate: string;  // Publication date of the article
    timeAgo: string;
    imageUrl?: string | null;
}

const FeedItemComponent = ({ title, description, source, category, pubDate, imageUrl }: FeedItem) => {
    const slug = slugify(title);

    // clean the description by removing html tags, etc
    const cleanDescription = description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\.{2,}/g, ".")
        .replace("&#8217;", "'")
        .replace("&#8212;", "-")
        .replace("&#8230;", "...")
        .trim();

    const truncatedDescription = cleanDescription.length > 70
        ? cleanDescription.substring(0, 40) + "..."
        : cleanDescription;

    // Format timeAgo here
    const timeAgo = pubDate ? formatTimeAgo(pubDate) : "Unknown";

    return (
        <div className="bg-gray-800 p-2 md:p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow w-full h-24 md:h-44">
            <Link to={`/articles/${slug}`} className="flex flex-row gap-2 md:gap-4 hover:no-underline h-full">
                {/* Image container with fixed size */}
                <div className="flex-shrink-0 w-20 h-20 md:w-36 md:h-36 self-start" style={{ marginTop: "0.25rem" }}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
                        </div>
                    )}
                </div>
                {/* Content container with fixed layout */}
                <div className="flex-grow flex flex-col justify-between h-full overflow-hidden">
                    <div className="overflow-hidden">
                        <h3 className="font-semibold text-sm md:text-lg text-white mb-1 md:mb-2">
                            {title}
                        </h3>
                        {/* Different description handling for mobile vs desktop */}
                        <p className="text-xs text-gray-300">
                            <span className="block md:hidden line-clamp-1">{truncatedDescription}</span>
                            <span className="hidden md:block overflow-auto max-h-20">{cleanDescription}</span>
                        </p>
                    </div>
                    <div className="text-xs text-gray-500 italic mt-auto">
                        <p>{category} | {source} | {timeAgo}</p>
                    </div>
                </div>
            </Link>
        </div>
    );
};

// Create a wrapper component for the app content
function App() {
    const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
    const [visibleFeedItems, setVisibleFeedItems] = useState<FeedItem[]>([]);
    const [loadedItems, setLoadedItems] = useState(0);
    const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});
    const [initialHomeRender, setInitialHomeRender] = useState(true);
    const [contentVisible, setContentVisible] = useState(false);
    const location = useLocation();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Add this ref to track if we've already scrolled for the current article page view
    const hasScrolledToTop = useRef(false);

    // Save scroll position when navigating away
    useEffect(() => {
        const handleBeforeNavigate = () => {
            if (location.pathname === '/') {
                setScrollPositions(prev => ({
                    ...prev,
                    '/': window.scrollY
                }));
            }
        };

        // Listen for clicks on article links
        const articleLinks = document.querySelectorAll('a[href^="/articles/"]');
        articleLinks.forEach(link => {
            link.addEventListener('click', handleBeforeNavigate);
        });

        return () => {
            articleLinks.forEach(link => {
                link.removeEventListener('click', handleBeforeNavigate);
            });
        };
    }, [location.pathname, visibleFeedItems]);

    useEffect(() => {
        // Check if the app is running locally or in production
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        let proxyBaseUrl: string;
        if (isLocal) {
            proxyBaseUrl = `https://cors-anywhere.herokuapp.com`; // Local proxy for local development
        } else {
            const port = window.location.port ? `:${window.location.port}` : ':3000'; // Ensure correct port
            proxyBaseUrl = `https://${window.location.hostname}${port}/proxy`; // Production proxy URL
        }

        fetch("/default-feeds.json")
            .then((response) => response.json())
            .then((data) => {
                let feedItemsArray: FeedItem[] = [];
                let pendingImageFetches: Promise<void>[] = [];

                data.forEach((category: { category: string; feeds: Feed[] }) => {
                    category.feeds.forEach((feed: Feed) => {
                        const feedUrl = feed.link;
                        const proxiedUrl = `${proxyBaseUrl}/${feedUrl}`;
                        fetch(proxiedUrl)
                            .then((response) => response.text())
                            .then((xmlData) => {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(xmlData, "application/xml");
                                const items = xmlDoc.querySelectorAll("item");

                                items.forEach((item) => {
                                    const title = item.querySelector("title")?.textContent;
                                    const link = item.querySelector("link")?.textContent;
                                    const description = item.querySelector("description")?.textContent;
                                    const pubDate = item.querySelector("pubDate")?.textContent;

                                    if (title && link && description && pubDate) {
                                        // Create a feed item without an image initially
                                        const feedItem: FeedItem = {
                                            title,
                                            link,
                                            description,
                                            source: feed.title,
                                            category: category.category,
                                            pubDate: pubDate,
                                            timeAgo: formatTimeAgo(pubDate),
                                            imageUrl: null, // Will be populated later
                                        };

                                        // Add to array immediately (without image)
                                        feedItemsArray.push(feedItem);

                                        // Create a promise to fetch the image
                                        const imagePromise = getBestImageForFeedItem(item, feed.title, true)
                                            .then(imageUrl => {
                                                // Update the feed item with the image URL
                                                feedItem.imageUrl = imageUrl;
                                            })
                                            .catch(error => {
                                                console.error(`Error getting image for ${title}:`, error);
                                            });

                                        pendingImageFetches.push(imagePromise);
                                    }
                                });

                                // Wait for all image fetches to complete before updating state
                                Promise.allSettled(pendingImageFetches).then(() => {
                                    // Sort by date if needed (most recent first)
                                    feedItemsArray.sort((a, b) => {
                                        const dateA = new Date(a.pubDate);
                                        const dateB = new Date(b.pubDate);
                                        return dateB.getTime() - dateA.getTime();
                                    });

                                    setAllFeedItems(feedItemsArray);
                                    setVisibleFeedItems(feedItemsArray.slice(0, ITEMS_PER_PAGE));
                                    setLoadedItems(ITEMS_PER_PAGE);
                                });
                            })
                            .catch((error) => console.error("Error loading RSS feed:", error));
                    });
                });
            })
            .catch((error) => console.error("Error loading feeds:", error));

    }, []);

    // Function to load more items when scrolled to bottom
    const loadMoreItems = () => {
        const nextItems = allFeedItems.slice(loadedItems, loadedItems + ITEMS_PER_PAGE);
        setVisibleFeedItems((prev) => [...prev, ...nextItems]);
        setLoadedItems((prev) => prev + ITEMS_PER_PAGE);
    };

    // Scroll event listener to trigger `loadMoreItems`
    // Modify your scroll handling effect
    useEffect(() => {
        //console.log("Current path:", location.pathname);

        if (location.pathname === '/') {
            // Reset the scroll flag when going to home
            hasScrolledToTop.current = false;

            // Your existing home page logic...
            if (!initialHomeRender) {
                setContentVisible(false);

                setTimeout(() => {
                    const savedPosition = scrollPositions['/'] || 0;
                    //console.log("Restoring home scroll to:", savedPosition);
                    window.scrollTo(0, savedPosition);

                    setTimeout(() => {
                        setContentVisible(true);
                    }, 50);
                }, 10);
            } else {
                setContentVisible(true);
                setInitialHomeRender(false);
            }
        } else if (location.pathname.includes('/articles/')) {
            // For article pages - always show content
            setContentVisible(true);

            // Only scroll if we haven't already for this view
            if (!hasScrolledToTop.current) {
                //console.log("Article page detected - forcing scroll to top with delay");

                // Use a more reliable approach with RAF and timeout
                setTimeout(() => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'instant' // Use 'instant' instead of smooth for more reliable positioning
                    });
                    hasScrolledToTop.current = true;
                }, 100);
            }
        }

        // Cleanup function to reset the scroll flag when unmounting
        return () => {
            if (location.pathname.includes('/articles/')) {
                hasScrolledToTop.current = false;
            }
        };
    }, [location.pathname, scrollPositions, initialHomeRender]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight) {
                loadMoreItems();
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup the event listener when the component is unmounted
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadedItems, allFeedItems]);

    return (
        <div className="flex flex-col min-h-screen">
            <Banner />
            <Routes>
                <Route path="/" element={
                    <div className="bg-gray-900 p-0 md:p-6 min-h-screen w-full">
                        {/* Main content */}
                        <div className={`grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-0 md:gap-6 ${contentVisible ? '' : 'opacity-0'}`}
                            style={{ transition: "opacity 0.2s ease-in-out" }}>
                            {visibleFeedItems.map((item, index) => (
                                <FeedItemComponent key={index} {...item} />
                            ))}
                        </div>

                        {/* Loading spinner - shown when there are more items to load */}
                        {loadedItems < allFeedItems.length && (
                            <LoadingSpinner />
                        )}
                    </div>
                } />
                <Route path="/articles/:slug" element={<ArticlePage feedItems={allFeedItems} isLocal={isLocal} />} />
            </Routes>
        </div>
    );
}

export default App;