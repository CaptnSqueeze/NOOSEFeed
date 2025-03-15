import { useParams, Link } from "react-router-dom";
import { FeedItem } from './App.tsx';
import { useState, useEffect } from 'react';

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const ArticlePage = ({ feedItems, isLocal }: { feedItems: FeedItem[]; isLocal: boolean; }) => {
    const { slug } = useParams<{ slug: string; }>();
    const article = feedItems.find(item => slugify(item.title) === slug);
    const [highQualityImage, setHighQualityImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);

        // Also set up a slightly delayed second scroll for reliability
        const timeoutId = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [slug]);

    // Handle initial loading state
    useEffect(() => {
        if (article) {
            // Set a small delay to avoid flash of loading state
            const loadingTimeout = setTimeout(() => {
                setIsLoading(false);
            }, 800); // 800ms delay for a smoother experience

            return () => clearTimeout(loadingTimeout);
        }
    }, [article]);

    // Image fetching effect
    useEffect(() => {
        if (article) {
            const extractArticleImage = async () => {
                try {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                    let proxyBaseUrl: string;
                    if (isLocal) {
                        proxyBaseUrl = `https://cors-anywhere.herokuapp.com`;
                    } else {
                        const port = window.location.port ? `:${window.location.port}` : ':3000';
                        proxyBaseUrl = `https://${window.location.hostname}${port}/proxy`;
                    }

                    const proxiedUrl = `${proxyBaseUrl}/${article.link}`;
                    const response = await fetch(proxiedUrl);
                    const htmlText = await response.text();

                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(htmlText, "text/html");

                    // Look for high-quality images in priority order
                    const ogImage = htmlDoc.querySelector('meta[property="og:image"]');
                    if (ogImage && ogImage.getAttribute('content')) {
                        setHighQualityImage(ogImage.getAttribute('content'));
                        return;
                    }

                    const twitterImage = htmlDoc.querySelector('meta[name="twitter:image"]');
                    if (twitterImage && twitterImage.getAttribute('content')) {
                        setHighQualityImage(twitterImage.getAttribute('content'));
                        return;
                    }

                    const articleImage = htmlDoc.querySelector('article img, .article-content img, .entry-content img');
                    if (articleImage && articleImage.getAttribute('src')) {
                        let imgSrc = articleImage.getAttribute('src') || '';
                        if (imgSrc.startsWith('/')) {
                            const url = new URL(article.link);
                            imgSrc = `${url.origin}${imgSrc}`;
                        }
                        setHighQualityImage(imgSrc);
                        return;
                    }

                    const images = Array.from(htmlDoc.querySelectorAll('img'));
                    const largeImages = images.filter(img => {
                        const width = parseInt(img.getAttribute('width') || '0', 10);
                        const height = parseInt(img.getAttribute('height') || '0', 10);
                        return (width > 300 || height > 300);
                    });

                    if (largeImages.length > 0) {
                        let imgSrc = largeImages[0].getAttribute('src') || '';
                        if (imgSrc.startsWith('/')) {
                            const url = new URL(article.link);
                            imgSrc = `${url.origin}${imgSrc}`;
                        }
                        setHighQualityImage(imgSrc);
                    }
                } catch (error) {
                    console.error('Error extracting article image:', error);
                }
            };

            extractArticleImage();
        }
    }, [article, isLocal]);

    // Loading spinner component
    const LoadingSpinner = () => (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-white">Loading article...</p>
            </div>
        </div>
    );

    // Show loading spinner while article is loading
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Show "article not found" if no article is found
    if (!article) return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
            <p className="text-white">Article not found.</p>
        </div>
    );

    const cleanDescription = article.description
        .replace("Continue reading...", "")
        .replace(/<\/p><p>/g, ". ")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\.{2,}/g, ".")
        .trim();

    // Use high-quality image if available, otherwise fall back to RSS image
    const imageToShow = highQualityImage || article.imageUrl;

    return (
        <div className="bg-gray-900 min-h-screen p-0 sm:p-6">
            <div className="w-full sm:max-w-3xl mx-auto bg-gray-800 p-4 sm:p-6 rounded-none sm:rounded-lg shadow-lg">
                <div className="mb-4 px-2 sm:px-0">
                    <Link to="/" className="text-blue-400 hover:underline flex items-center">
                        <span>← Back to articles</span>
                    </Link>
                </div>

                {imageToShow && (
                    <div className="mb-6">
                        <img
                            src={imageToShow}
                            alt={article.title}
                            className="w-full max-h-80 object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    </div>
                )}

                <div className="px-2 sm:px-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{article.title}</h1>

                    <div className="mb-6 text-sm text-gray-500 italic">
                        <p>{article.category} | {article.source} | {article.timeAgo}</p>
                    </div>

                    <div className="text-gray-300 mb-8 leading-relaxed">{cleanDescription}</div>

                    <div className="mt-8">
                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                            <button className="bg-blue-600 text-white px-5 py-2 rounded shadow-md hover:bg-blue-700 transition-colors">
                                Read Full Article on {article.source}
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticlePage;