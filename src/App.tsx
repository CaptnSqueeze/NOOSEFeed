import { useEffect, useState } from "react";

interface Feed {
    title: string;   // The source name (e.g., "CBC", "Global News")
    link: string;
    category: string; // Category (e.g., "News - Canada")
}

interface FeedItem {
    title: string;
    link: string;
    description: string;
    source: string; // Source is the title of the feed (e.g., "CBC", "BBC")
    category: string; // Category (e.g., "News - Canada")
    pubDate: string;  // Publication date of the article
}

const FeedItemComponent = ({ title, link, description, source, category, pubDate }: FeedItem) => {
    // Clean the description by removing HTML tags, handling </p><p> properly, and cleaning extra dots
    const cleanDescription = description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")   // Replace paragraph breaks with a period and space
        .replace(/<\/?[^>]+(>|$)/g, "") // Remove all HTML tags
        .replace(/\.{2,}/g, ".")       // Replace consecutive dots with a single dot
        .trim();  // Trim any leading/trailing whitespace

    // responsible for rendering the UI of a single feed item
    return (
        <div className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-xl text-blue-600 mb-2">
                <a href={link} target="_blank" rel="noopener noreferrer">
                    {title}
                </a>
            </h3>
            <p className="text-sm text-gray-700 mb-2">{cleanDescription}</p>
            <div className="mt-4 text-xs text-gray-500 italic">
                <p>{category} | {source} | {pubDate}</p>
            </div>
        </div>
    );
};


function App() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]); // Store the feed items

    useEffect(() => {
        // Fetch the feeds list from your JSON file
        fetch("/default-feeds.json")
            .then((response) => response.json())
            .then((data) => {
                // Determine the correct proxy to use
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                // Ensure the correct proxy URL depending on the environment
                let proxyBaseUrl: string;
                if (isLocal) {
                    proxyBaseUrl = `https://cors-anywhere.herokuapp.com`; // Ensure using https
                } else {
                    const port = window.location.port ? `:${window.location.port}` : ':3000'; // Make sure to append the port if not local
                    proxyBaseUrl = `https://${window.location.hostname}${port}/proxy`; // Changed to https://
                }

                data.forEach((category: { category: string; feeds: Feed[] }) => {
                    category.feeds.forEach((feed: Feed) => {
                        const feedUrl = feed.link;
                        const proxiedUrl = `${proxyBaseUrl}/${feedUrl}`;

                        // Fetch the RSS feed
                        fetch(proxiedUrl)
                            .then((response) => response.text())
                            .then((data) => {
                                // Parse the XML and extract feed items
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(data, "application/xml");
                                const items = xmlDoc.querySelectorAll("item"); // Get all "item" elements

                                const feedItemsArray: FeedItem[] = [];
                                items.forEach((item) => {
                                    const title = item.querySelector("title")?.textContent;
                                    const link = item.querySelector("link")?.textContent;
                                    const description = item.querySelector("description")?.textContent;
                                    const pubDate = item.querySelector("pubDate")?.textContent; // Extract publication date

                                    console.log(description)

                                    if (title && link && description && pubDate) {
                                        // Add the source/category (feed title) to the feed item
                                        feedItemsArray.push({
                                            title,
                                            link,
                                            description, // Pass the raw description here
                                            source: feed.title,
                                            category: category.category,  // Get the category from the JSON
                                            pubDate: new Date(pubDate).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }), // Format the time
                                        });
                                    }
                                });

                                setFeedItems((prevItems) => [...prevItems, ...feedItemsArray]); // Append the feed items to the state
                            })
                            .catch((error) => console.error("Error loading RSS feed:", error));
                    });
                });
            })
            .catch((error) => console.error("Error loading feeds:", error));
    }, []);


    // fetches the list of items
    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Display the list of feed items */}
                {feedItems.map((item, index) => (
                    <FeedItemComponent
                        key={index}
                        title={item.title}
                        link={item.link}
                        description={item.description} // Raw description passed
                        source={item.source}
                        category={item.category}
                        pubDate={item.pubDate} // Pass the date to the component
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
