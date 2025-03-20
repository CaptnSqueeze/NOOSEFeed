// App.tsx - fixed implementation

import { formatDistanceToNow, parseISO } from 'date-fns';
import { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import ArticlePage from "./ArticlePage.tsx";
import './index.css';
import { getBestImageForFeedItem, extractImageFromItem } from './ImageExtractor';
import VisitorLogger from './components/VisitorLogger';
import Sidebar from './components/Navigation/Sidebar';
import BurgerButton from './components/Navigation/BurgerButton';
import AboutPage from './pages/AboutPage';
import SourcesPage from './pages/SourcesPage';
import SidebarOverlay from './components/Navigation/SidebarOverlay';
import './App.css';

const fetchFeeds = async (onImageLoaded?: (index: number, imageUrl: string) => void) => {
    try {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const proxyBaseUrl = isLocal
            ? `https://cors-anywhere.herokuapp.com`
            : `https://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ':3000'}/proxy`;

        const response = await fetch("/default-feeds.json");
        const data = await response.json();

        let feedItemsArray: FeedItem[] = [];
        let pendingFeedFetches: Promise<void>[] = [];

        data.forEach((category: { category: string; feeds: Feed[] }) => {
            category.feeds.forEach((feed: Feed) => {
                const proxiedUrl = `${proxyBaseUrl}/${feed.link}`;

                const feedFetchPromise = fetch(proxiedUrl)
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
                                const feedItem: FeedItem = {
                                    title,
                                    link,
                                    description,
                                    source: feed.title,
                                    category: category.category,
                                    pubDate: pubDate,
                                    timeAgo: formatTimeAgo(pubDate),
                                    imageUrl: null,
                                };

                                // Store the index before pushing
                                const itemIndex = feedItemsArray.length;
                                feedItemsArray.push(feedItem);

                                // First try to get an image directly from the RSS item
                                const directImageUrl = extractImageFromItem(item);
                                if (directImageUrl) {
                                    feedItem.imageUrl = directImageUrl;
                                    if (onImageLoaded) {
                                        onImageLoaded(itemIndex, directImageUrl);
                                    }
                                } else {
                                    // If no direct image, asynchronously fetch from article
                                    getBestImageForFeedItem(item, feed.title, true)
                                        .then(imageUrl => {
                                            if (imageUrl) {
                                                // Update the image URL in the feed item
                                                feedItem.imageUrl = imageUrl;

                                                // Notify the caller about the image loading
                                                if (onImageLoaded) {
                                                    onImageLoaded(itemIndex, imageUrl);
                                                }
                                            }
                                        })
                                        .catch(error => {
                                            console.error(`Error getting image for ${title}:`, error);
                                        });
                                }
                            }
                        });
                    })
                    .catch((error) => console.error("Error loading RSS feed:", error));

                pendingFeedFetches.push(feedFetchPromise);
            });
        });

        // Wait for all feed fetches to complete
        await Promise.all(pendingFeedFetches);

        // Sort feed items by date
        feedItemsArray.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        // Return feed items without waiting for images to load
        return feedItemsArray;
    } catch (error) {
        console.error("Error loading feeds:", error);
        throw error;
    }
};

const isArticleVisited = (slug: string) => {
    try {
        const visitedArticles = JSON.parse(localStorage.getItem('visitedArticles') || '[]');
        return visitedArticles.includes(slug);
    } catch (e) {
        return false;
    }
};

// Add this function to mark an article as visited
const markArticleVisited = (slug: string) => {
    try {
        const visitedArticles = JSON.parse(localStorage.getItem('visitedArticles') || '[]');
        if (!visitedArticles.includes(slug)) {
            visitedArticles.push(slug);
            localStorage.setItem('visitedArticles', JSON.stringify(visitedArticles));
        }
    } catch (e) {
        console.error("Error marking article as visited:", e);
    }
};

const LoadingSpinner = () => {
    return (
        <div className="bg-gray-900 bg-opacity-80 flex justify-center items-center h-full w-full">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                <p className="text-white mt-4 font-semibold">Loading NOOSEFeed... Hang in there</p>
            </div>
        </div>
    );
};



function formatTimeAgo(pubDateStr: string): string {
    try {
        // Print raw string for debugging
        // console.log("Raw pubDate string:", pubDateStr);

        // First, try to extract timezone information if present
        let pubDate: Date;
        let originalTimezoneOffset: number | null = null;

        // Check if the date string contains timezone information
        const hasTimezone = /([+-]\d{4}|GMT|UTC|[A-Z]{3,4})/.test(pubDateStr);

        if (hasTimezone) {
            // Parse with timezone preserved
            pubDate = new Date(pubDateStr);
            // Store the original timezone offset in minutes
            originalTimezoneOffset = pubDate.getTimezoneOffset();
        } else {
            // If no timezone info, try parsing as UTC to preserve the exact time
            // First, try standard format
            pubDate = new Date(pubDateStr);

            // If invalid, try cleaning the string
            if (isNaN(pubDate.getTime())) {
                const cleanDateStr = pubDateStr.replace(/[A-Za-z]{3},\s/, '').trim();
                pubDate = new Date(cleanDateStr);

                if (isNaN(pubDate.getTime())) {
                    return "Unknown date";
                }
            }

            // Assume the date is in UTC if not specified
            originalTimezoneOffset = 0; // UTC has 0 offset
        }

        // Get current time in the same timezone as the publication date
        const now = new Date();
        let timeDiff: number;

        if (originalTimezoneOffset !== null) {
            // Adjust the time difference calculation to account for timezone differences
            // by ensuring both times are compared in the same timezone
            const pubDateMs = pubDate.getTime();
            const nowMs = now.getTime();
            timeDiff = nowMs - pubDateMs;
        } else {
            // Fallback to simple difference if we couldn't determine timezone
            timeDiff = now.getTime() - pubDate.getTime();
        }

        // Calculate the difference in days
        const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (diffDays > 6) {
            // For dates older than a week, use a timezone-aware date formatter
            // Use the Intl.DateTimeFormat for better timezone handling
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: hasTimezone ? undefined : 'UTC' // Use UTC if original had no timezone
            }).format(pubDate);
        }

        // Calculate relative time
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return hours === 1 ? '1h' : `${hours}h`;
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

// Define the prop types for the Banner component
interface BannerProps {
    toggleSidebar: () => void;  // Function that doesn't return anything
    isSidebarOpen: boolean;     // Boolean flag
}

const Banner = ({ toggleSidebar, isSidebarOpen }: BannerProps) => {
    return (
        <div className="fixed top-0 left-0 right-0 bg-blue-900 text-white p-2.5 flex z-50">
            <div className="flex items-center w-full justify-between">
                {/* Burger button on mobile, Logo on desktop */}
                <div className="flex items-center">
                    <div className="md:hidden">
                        <BurgerButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    </div>
                    <img src="logo2.png" alt="Logo" className="hidden md:block h-11 md:h-14 scale-[1.4]" />
                </div>

                {/* Text - right on mobile, left on desktop */}
                <div className="flex flex-col text-right md:text-left flex-grow px-0 md:px-1 md:ml-0">
                    <h1 className="text-lg md:text-2xl font-bold">NOOSEFeed</h1>
                    <h2 className="text-xs md:text-sm font-bold">no paywalls, no algorithms... just news</h2>
                </div>

                {/* Logo on mobile, Burger on desktop */}
                <div className="flex items-center">
                    <img src="logo2.png" alt="Logo" className="md:hidden h-11 ml-1 scale-[1.4]" />
                    <div className="hidden md:block">
                        <BurgerButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    </div>
                </div>
            </div>
        </div>
    );
};


const SubBanner = ({ refreshFeed }: { refreshFeed: () => Promise<void> }) => {
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
                {isRefreshing ? "Refreshing..." : "Refresh Feed"}
            </button>
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

// Update the FeedItemComponent to apply the visited class
const FeedItemComponent = ({ title, description, source, category, pubDate, imageUrl }: FeedItem) => {
    const slug = slugify(title);
    const visited = isArticleVisited(slug);

    // clean the description by removing html tags, etc
    const cleanDescription = description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\.{2,}/g, ".")
        .replace(/&#8217;/g, "'")
        .replace(/&#8212;/g, "-")
        .replace(/&#8230;/g, "...")
        .replace(/&#8220;/g, "\"")
        .replace(/&#8221;/g, "\"")
        .replace(/&#038;/g, "&")
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, "'")
        .replace(/&#38;/g, "&")
        .replace(/&#8211;/g, "-")
        .trim();

    const truncatedDescription = cleanDescription.length
        ? cleanDescription.substring(0, 40) + "..."
        : cleanDescription;

    const truncatedDescriptionLong = cleanDescription.length
        ? cleanDescription.substring(0, 900) + "..."
        : cleanDescription;

    // Format timeAgo here
    const timeAgo = pubDate ? formatTimeAgo(pubDate) : "Unknown";

    // Handle the click event to mark as visited
    const handleClick = () => {
        markArticleVisited(slug);
    };

    return (
        <Link
            to={`/articles/${slug}`}
            className={`bg-gray-900 p-2 md:p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow w-full h-24 md:h-44 ${visited ? 'opacity-70' : ''}`}
            onClick={handleClick}
        >
            <div className="flex flex-row gap-2 md:gap-4 hover:no-underline h-full">
                {/* Image container with fixed size */}
                <div className="flex-shrink-0 w-20 h-20 md:w-36 md:h-36 self-start" style={{ marginTop: "0.25rem" }}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className={`w-full h-full object-cover rounded ${visited ? 'brightness-75' : ''}`}
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
                        </div>
                    )}
                </div>

                {/* Content container */}
                <div className="flex-grow flex flex-col h-full relative">
                    {/* Title area with ellipsis */}
                    <div className="mb-1 md:mb-2">
                        <h3 className={`font-semibold text-sm md:text-lg text-white line-clamp-2 ${visited ? 'text-gray-400' : ''}`}>
                            {title}
                        </h3>
                    </div>

                    {/* Rest of the component remains the same */}
                    <div className="flex-grow relative overflow-hidden">
                        <p className={`text-xs ${visited ? 'text-gray-500' : 'text-gray-300'}`}>
                            {cleanDescription}
                        </p>

                        <div className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(to bottom, rgba(17, 24, 39, 0) 70%, rgba(17, 24, 39, 0.7) 85%, rgba(17, 24, 39, 1) 95%)`
                            }}>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 italic bg-gray-900 z-10">
                        <p className="truncate">{category} | {source} | {timeAgo}</p>
                    </div>
                </div>
            </div>
        </Link>
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
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasScrolledToTop = useRef(false);

    // Add this function INSIDE the App component to handle image updates
    const updateFeedItemImage = (allFeedItems: FeedItem[], setAllFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>,
        visibleFeedItems: FeedItem[], setVisibleFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>,
        index: number, imageUrl: string) => {
        // Update the all items state
        setAllFeedItems(prevItems => {
            const updatedItems = [...prevItems];
            if (updatedItems[index]) {
                updatedItems[index] = { ...updatedItems[index], imageUrl };
            }
            return updatedItems;
        });

        // Find the corresponding item in visibleFeedItems and update it if present
        setVisibleFeedItems(prevItems => {
            return prevItems.map(item => {
                // Match by link since that should be unique
                if (item.link === allFeedItems[index]?.link) {
                    return { ...item, imageUrl };
                }
                return item;
            });
        });
    };

    // Toggle sidebar function
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Modify refreshFeed function in App component to use the image update callback
    const refreshFeed = (): Promise<void> => {
        // Reset visible items to empty first to shrink the page height
        setVisibleFeedItems([]);

        // Reset loaded items count
        setLoadedItems(0);

        // Reset scroll position to top
        window.scrollTo({
            top: 0,
            behavior: 'instant' // Use instant for immediate effect
        });

        setIsLoading(true); // Set loading state to true

        return new Promise<void>((resolve, reject) => {
            fetchFeeds((index, imageUrl) => {
                // This callback will be triggered whenever an image is loaded
                updateFeedItemImage(allFeedItems, setAllFeedItems, visibleFeedItems, setVisibleFeedItems, index, imageUrl);
            })
                .then((feedItems) => {
                    setAllFeedItems(feedItems);
                    setVisibleFeedItems(feedItems.slice(0, ITEMS_PER_PAGE));
                    setLoadedItems(ITEMS_PER_PAGE);
                    setIsLoading(false);
                    resolve();
                })
                .catch((error) => {
                    setIsLoading(false);
                    reject(error);
                });
        });
    };

    // Close sidebar when changing routes on mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

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
        setIsLoading(true);

        fetchFeeds((index, imageUrl) => {
            // This callback will be triggered whenever an image is loaded
            updateFeedItemImage(allFeedItems, setAllFeedItems, visibleFeedItems, setVisibleFeedItems, index, imageUrl);
        })
            .then((feedItems) => {
                setAllFeedItems(feedItems);
                setVisibleFeedItems(feedItems.slice(0, ITEMS_PER_PAGE));
                setLoadedItems(ITEMS_PER_PAGE);
                setIsLoading(false);
                setContentVisible(true);
            })
            .catch(() => setIsLoading(false)); // Ensure loading state is reset even on failure
    }, []);


    // Function to load more items when scrolled to bottom
    const loadMoreItems = () => {
        if (loadedItems >= allFeedItems.length) {
            // No more items to load
            return;
        }

        const nextItems = allFeedItems.slice(loadedItems, loadedItems + ITEMS_PER_PAGE);
        setVisibleFeedItems((prev) => [...prev, ...nextItems]);
        setLoadedItems((prev) => prev + ITEMS_PER_PAGE);
    };

    // Scroll event listener to trigger `loadMoreItems`
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

    const EndOfContentIndicator = () => {
        return (
            <div className="py-8 text-center text-gray-500 bg-gray-800">
                <p>You've reached the end of the feed</p>
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-2 text-blue-400 hover:text-blue-300"
                >
                    ↑ Back to top
                </button>
            </div>
        );
    };

    // Modify the scroll event listener for better threshold detection
    useEffect(() => {
        const handleScroll = () => {
            // Calculate distance from bottom more precisely
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.offsetHeight - 100; // 100px buffer

            if (scrollPosition >= threshold && !isLoading && loadedItems < allFeedItems.length) {
                loadMoreItems();
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadedItems, allFeedItems, isLoading]);

    return (
        <div className="flex flex-col min-h-screen">
            <VisitorLogger />

            {/* Fixed Banner */}
            <Banner toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

            <SubBanner refreshFeed={refreshFeed} />

            {/* Spacer div to account for the fixed banner's height */}
            <div className="h-24 md:h-28"></div> {/* 6rem on mobile, 7rem on desktop */}

            <SidebarOverlay isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

            {/* Main content container */}



            <div className="flex flex-grow">
                {/* Sidebar - Update to use fixed positioning only on mobile */}
                <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:hidden fixed top-24 left-0 w-64 h-full bg-gray-900 z-20`}>
                    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                </div>

                {/* Desktop sidebar - always visible on larger screens */}
                <div className="hidden lg:block w-64 bg-gray-900 flex-shrink-0">
                    <Sidebar isOpen={true} toggleSidebar={toggleSidebar} />
                </div>

                {/* Main content area - doesn't get squished on mobile */}
                <div className="flex-grow overflow-y-auto relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-40 md:top-1">
                            <LoadingSpinner />
                        </div>
                    )}

                    <Routes>
                        <Route path="/" element={
                            <div className="bg-gray-800 p-0 md:p-6 min-h-full w-full">
                                {/* Main content */}
                                <div className={`grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-0 md:gap-6 ${contentVisible ? '' : 'opacity-0'}`}
                                    style={{ transition: "opacity 0.2s ease-in-out" }}>
                                    {visibleFeedItems.map((item, index) => (
                                        <FeedItemComponent key={index} {...item} />
                                    ))}
                                </div>

                                {/* End of content indicator */}
                                {!isLoading && loadedItems >= allFeedItems.length && allFeedItems.length > 0 && (
                                    <EndOfContentIndicator />
                                )}

                                {/* Add bottom padding to prevent content from appearing cut off */}
                                <div className="h-16 md:h-8"></div>
                            </div>
                        } />
                        <Route path="/articles/:slug" element={<ArticlePage feedItems={allFeedItems} isLocal={isLocal} />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/sources" element={<SourcesPage />} />
                    </Routes>
                </div>
            </div>

        </div>
    );
}

export default App;