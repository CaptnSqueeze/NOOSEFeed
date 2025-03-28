﻿import { useParams, Link } from "react-router-dom";
import { FeedItem } from './App.tsx';
import { useState, useEffect } from 'react';

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const ArticlePage = ({ feedItems, isLocal }: { feedItems: FeedItem[]; isLocal: boolean; }) => {
    const { slug } = useParams<{ slug: string; }>();
    const article = feedItems.find(item => slugify(item.title) === slug);
    const [highQualityImage, setHighQualityImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fullArticleText, setFullArticleText] = useState<string | null>(null);
    const [isLoadingFullText, setIsLoadingFullText] = useState(false);
    const [fullTextError, setFullTextError] = useState<string | null>(null);
    const [isContentVisible, setIsContentVisible] = useState(false);

    const formatPublishedDate = (pubDateStr: string): string => {
        try {
            const date = new Date(pubDateStr);
            if (isNaN(date.getTime())) {
                return pubDateStr;
            }
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            return new Intl.DateTimeFormat('en-US', options).format(date);
        } catch (error) {
            console.error("Error formatting published date:", error);
            return pubDateStr;
        }
    };





    useEffect(() => {
        if (article) {
            const loadingTimeout = setTimeout(() => {
                setIsLoading(false);
            }, 800);
            return () => clearTimeout(loadingTimeout);
        }
    }, [article]);

    useEffect(() => {
        if (article) {
            const extractArticleImage = async () => {
                try {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const proxyBaseUrl = isLocal
                        ? `https://cors-anywhere.herokuapp.com`
                        : `https://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ':3000'}/proxy`;

                    const proxiedUrl = `${proxyBaseUrl}/${article.link}`;
                    const response = await fetch(proxiedUrl);
                    const htmlText = await response.text();
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(htmlText, "text/html");

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

    const loadFullArticleText = async () => {
        if (!article) return;
        setIsLoadingFullText(true);
        setFullTextError(null);
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBaseUrl = isLocal
                ? `https://cors-anywhere.herokuapp.com`
                : `https://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ':3000'}/proxy`;

            const proxiedUrl = `${proxyBaseUrl}/${article.link}`;
            const response = await fetch(proxiedUrl);
            const htmlText = await response.text();
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(htmlText, "text/html");

            const contentSelectors = [
                'article',
                '.article-content',
                '.entry-content',
                '.post-content',
                '.content-area',
                'main',
                '#article-body',
                '.article-body',
                '.story-body'
            ];

            let articleContent = null;
            for (const selector of contentSelectors) {
                const element = htmlDoc.querySelector(selector);
                if (element) {
                    const unwantedSelectors = [
                        '.advertisement',
                        '.ads',
                        '.share-buttons',
                        '.social-share',
                        '.related-posts',
                        '.comments',
                        'aside',
                        'nav',
                        'footer',
                        '.footer',
                        '.nav',
                        '.sidebar',
                        '.input'
                    ];
                    unwantedSelectors.forEach(unwanted => {
                        const elements = element.querySelectorAll(unwanted);
                        elements.forEach(el => el.remove());
                    });
                    articleContent = element.innerHTML;
                    break;
                }
            }

            if (!articleContent) {
                const body = htmlDoc.querySelector('body');
                if (body) {
                    const bodyClone = body.cloneNode(true) as HTMLElement;
                    const elementsToRemove = [
                        'header', 'footer', 'nav', 'aside',
                        '.header', '.footer', '.nav', '.sidebar',
                        '.menu', '.navigation', '.comments',
                        '.advertisement', '.ads', '.ad-container', '.sponsored', '.sponsor',
                        '.share-buttons', '.social-share', '.social-buttons', '.social-media',
                        '.share-container', '.share-tools', '.sharing', '.share-bar',
                        '.save-button', '.bookmark', '.save-for-later',
                        '.image-gallery', '.slideshow', '.carousel', '.media-container',
                        '.featured-media', '.article-media', '.post-media',
                        'img', 'svg', 'figure', 'video', 'audio', 'iframe', 'canvas',
                        '.image', '.picture', '.photo', '.thumbnail', '.media',
                        'button', '.button', '.btn', '.cta', '.call-to-action',
                        '.form', 'form', 'input', 'select', 'textarea',
                        '.modal', '.dialog', '.popup',
                        '.icon', '.fa', '.fas', '.fab', '.far', '.material-icons', '.symbols',
                        '.emoji', '.avatar', '.badge', '.star', '.rating',
                        '.newsletter', '.subscription', '.paywall', '.popup',
                        '.related-articles', '.recommended', '.suggestions',
                        '.author-bio', '.author-profile', '.tags', '.categories',
                        '.toolbar', '.actions', '.utilities', '.preferences',
                        '.pagination', '.pager', '.load-more', '.next-prev',
                        '.link', '.url', '.source', '.credit', '.source-link', '.indput',
                    ];
                    elementsToRemove.forEach(selector => {
                        const elements = bodyClone.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    });
                    articleContent = bodyClone.innerHTML;
                }
            }

            if (articleContent) {
                const processedContent = processArticleContent(articleContent);
                setFullArticleText(processedContent);
            } else {
                setFullTextError("Could not extract article content. Try visiting the original site.");
            }
        } catch (error) {
            console.error('Error loading full article text:', error);
            setFullTextError("Failed to load the article. Try visiting the original site.");
        } finally {
            setIsLoadingFullText(false);
        }
    };

    const processArticleContent = (htmlContent: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const allImages = tempDiv.querySelectorAll('img, svg, figure, iframe, canvas, video, audio');
        allImages.forEach(el => el.remove());
        const allButtons = tempDiv.querySelectorAll('button, .btn, .button');
        allButtons.forEach(el => el.remove());
        const allIcons = tempDiv.querySelectorAll('[class*="icon"], [class*="fa-"]');
        allIcons.forEach(el => el.remove());
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            const textNode = document.createTextNode(link.textContent || '');
            link.parentNode?.replaceChild(textNode, link);
        });
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.classList.add('text-gray-300', 'mb-4');
        });
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.classList.add('text-white', 'font-bold', 'mb-3', 'mt-6');
        });
        const inputBoxes = tempDiv.querySelectorAll('input');
        inputBoxes.forEach(el => el.remove());
        return tempDiv.innerHTML;
    };

    const LoadingSpinner = () => (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-white">Loading article...</p>
            </div>
        </div>
    );

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

    const imageToShow = highQualityImage || article.imageUrl;

    return (
        <div
            className="min-h-screen p-0 sm:p-6 opacity-100"
            style={{
                backgroundColor: '#1a202c',  // Set the dark background color immediately on load
                transition: "opacity 0.2s ease-in-out",
            }}
            >
            <div className="w-full sm:max-w-3xl mx-auto bg-gray-800 p-4 sm:p-6 rounded-none sm:rounded-lg shadow-lg">
                <div className="mb-4 px-2 sm:px-0">
                    <Link to="/" className="text-blue-400 hover:underline flex items-center">
                        <span>← Back to articles</span>
                    </Link>
                </div>

                <div className="mb-6 relative w-full bg-gray-700 rounded overflow-hidden" style={{ height: "315px" }}>
                    {/* Image (Fades in) */}
                    {imageToShow && (
                        <img
                            src={imageToShow}
                            alt={article.title}
                            className="w-full h-full object-cover object-center absolute top-0 left-0"
                            onLoad={(e) => e.currentTarget.style.opacity = '1'}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                            style={{ opacity: 0, transition: 'opacity 0.3s ease-in' }}
                        />
                    )}
                </div>

                <div className="px-2 sm:px-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{article.title}</h1>
                    <div className="mb-6 text-sm text-gray-500 italic">
                        <p>{article.category} | {article.source}</p>
                        <p className="mt-1">Published: {formatPublishedDate(article.pubDate)}</p>
                    </div>
                    <div className="text-gray-300 mb-8 leading-relaxed">{cleanDescription}</div>
                    {!fullArticleText && !isLoadingFullText && (
                        <button
                            onClick={loadFullArticleText}
                            className="bg-gray-700 text-white px-5 py-2 rounded shadow-md hover:bg-gray-600 transition-colors mb-6">
                            Load Full Article Text
                        </button>
                    )}
                    {isLoadingFullText && (
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="text-gray-300">Loading full article text...</p>
                        </div>
                    )}
                    {fullTextError && (
                        <div className="bg-red-900 bg-opacity-30 border border-red-800 rounded p-3 mb-6">
                            <p className="text-red-300">{fullTextError}</p>
                        </div>
                    )}
                    {fullArticleText && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Full Article</h2>
                            <div
                                className="article-content text-gray-300"
                                dangerouslySetInnerHTML={{ __html: fullArticleText }}
                            />
                        </div>
                    )}
                    <div className="mt-8">
                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                            <button className="bg-gray-700 text-white px-5 py-2 rounded shadow-md hover:bg-gray-600 transition-colors mb-6">
                                Read Full Article on {article.source}
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );



}

export default ArticlePage;
