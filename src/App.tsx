import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ArticlePage from "./ArticlePage";

const ITEMS_PER_PAGE = 20; // Number of items to load at a time

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
}

const FeedItemComponent = ({ title, description, source, category, pubDate }: FeedItem) => {
    const slug = slugify(title); // Generate slug from title

    // Clean the description by removing HTML tags, handling </p><p> properly, and cleaning extra dots
    const cleanDescription = description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")   // Replace paragraph breaks with a period and space
        .replace(/<\/?[^>]+(>|$)/g, "") // Remove all HTML tags
        .replace(/\.{2,}/g, ".")       // Replace consecutive dots with a single dot
        .trim();  // Trim any leading/trailing whitespace

    // responsible for rendering the UI of a single feed item
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="font-semibold text-xl text-white mb-2">
                <Link to={`/articles/${slug}`} className="text-blue-400 hover:underline">
                    {title}
                </Link>
            </h3>
            <p className="text-sm text-gray-300 mb-2">
                {cleanDescription}
            </p>
            <div className="mt-4 text-xs text-gray-500 italic">
                <p>{category} | {source} | {pubDate}</p>
            </div>
        </div>
    );
};


function App() {
    const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]); // Full dataset
    const [visibleFeedItems, setVisibleFeedItems] = useState<FeedItem[]>([]); // Items shown
    const [loadedItems, setLoadedItems] = useState(0); // Tracks how many items are shown

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
                                        feedItemsArray.push({
                                            title,
                                            link,
                                            description,
                                            source: feed.title,
                                            category: category.category,
                                            pubDate: new Date(pubDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadMoreItems();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loadedItems, allFeedItems]);

    return (
        <Router>
            <div className="p-4 max-w-4xl mx-auto">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <div className="bg-gray-900 p-6 min-h-screen">  {/* Dark background for the body */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {visibleFeedItems.map((item, index) => (
                                        <FeedItemComponent key={index} {...item} />
                                    ))}
                                </div>
                            </div>
                        }
                    />
                    <Route path="/articles/:slug" element={<ArticlePage feedItems={allFeedItems} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
