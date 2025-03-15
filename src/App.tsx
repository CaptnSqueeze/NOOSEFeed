import { useEffect, useState} from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import ArticlePage from "./ArticlePage.tsx";
import './index.css';

const ITEMS_PER_PAGE = 20; // Number of items to load at a time

const Banner = () => {
    return (
        <div className="bg-blue-600 text-white p-4 flex items-center justify-start">
            <img src="logo.png" alt="Logo" className="h-8 md:h-12 mr-4" />
            <div className="flex flex-col ml-auto text-right">
                <h1 className="text-lg md:text-2xl font-bold">Welcome to NOOSEFeed</h1>
                <h2 className="text-xs md:text-sm font-bold">no paywalls, no algorithms... just news</h2>
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
    imageUrl?: string | null;
}

const FeedItemComponent = ({ title, description, source, category, pubDate, imageUrl }: FeedItem) => {
    const slug = slugify(title); // Generate slug from title

    // Clean the description by removing HTML tags, handling </p><p> properly, and cleaning extra dots
    const cleanDescription = description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")   // Replace paragraph breaks with a period and space
        .replace(/<\/?[^>]+(>|$)/g, "") // Remove all HTML tags
        .replace(/\.{2,}/g, ".")       // Replace consecutive dots with a single dot
        .trim();  // Trim any leading/trailing whitespace

    // Truncate description for mobile devices
    const truncatedDescription = cleanDescription.length > 50 ? cleanDescription.substring(0, 50) + "..." : cleanDescription;

    // responsible for rendering the UI of a single feed item
    return (
        <div className="bg-gray-800 p-2 md:p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow w-full">
            <Link to={`/articles/${slug}`} className="flex flex-row gap-2 md:gap-4 hover:no-underline">
                {imageUrl && (
                    <div className="flex-shrink-0 flex items-center">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-16 h-16 md:w-32 md:h-32 object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                )}
                <div className="flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-xs md:text-lg text-white mb-1 md:mb-2">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-300 mb-1 md:mb-2 md:line-clamp-none line-clamp-3">
                            <span className="block md:hidden">{truncatedDescription}</span>
                            <span className="hidden md:block">{cleanDescription}</span>
                        </p>
                    </div>
                    <div className="text-xs text-gray-500 italic">
                        <p>{category} | {source} | {pubDate}</p>
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
    const location = useLocation();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
            // Modify your existing code to extract images
            .then((data) => {
                let feedItemsArray: FeedItem[] = [];
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

                                    // Extract image URL using multiple methods
                                    let imageUrl = null;

                                    // Method 1: Look for media:content element
                                    const mediaContent = item.querySelector("media\\:content, content");
                                    if (mediaContent && mediaContent.getAttribute("url")) {
                                        imageUrl = mediaContent.getAttribute("url");
                                    }

                                    // Method 2: Look for enclosure with image type
                                    if (!imageUrl) {
                                        const enclosure = item.querySelector("enclosure");
                                        if (enclosure &&
                                            enclosure.getAttribute("type")?.startsWith("image/") &&
                                            enclosure.getAttribute("url")) {
                                            imageUrl = enclosure.getAttribute("url");
                                        }
                                    }

                                    // Method 3: Parse image from description HTML
                                    if (!imageUrl && description) {
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = description;
                                        const img = tempDiv.querySelector('img');
                                        if (img && img.src) {
                                            imageUrl = img.src;
                                        }
                                    }

                                    // Method 4: Look for image tag within item
                                    if (!imageUrl) {
                                        const itemImage = item.querySelector("image");
                                        if (itemImage && itemImage.querySelector("url")) {
                                            imageUrl = itemImage.querySelector("url")?.textContent || null;
                                        }
                                    }

                                    if (title && link && description && pubDate) {
                                        feedItemsArray.push({
                                            title,
                                            link,
                                            description,
                                            source: feed.title,
                                            category: category.category,
                                            pubDate: new Date(pubDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                                            imageUrl: imageUrl, // Add the image URL to your feed item
                                        });
                                    }
                                });
                                // Once all feed items are fetched, update state
                                setAllFeedItems(feedItemsArray);
                                setVisibleFeedItems(feedItemsArray.slice(0, ITEMS_PER_PAGE)); // Load first batch
                                setLoadedItems(ITEMS_PER_PAGE);
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
    useEffect(() => {
        if (location.pathname === '/') {
            // Increase timeout slightly to ensure DOM is ready
            setTimeout(() => {
                window.scrollTo(0, scrollPositions['/'] || 0);
            }, 200);
        }
    }, [location.pathname, scrollPositions]);

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
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-0 md:gap-6">
                            {visibleFeedItems.map((item, index) => (
                                <FeedItemComponent key={index} {...item} />
                            ))}
                        </div>
                    </div>
                } />
                <Route path="/articles/:slug" element={<ArticlePage feedItems={allFeedItems} isLocal={isLocal} />} />
            </Routes>
        </div>
    );
}

export default App;
