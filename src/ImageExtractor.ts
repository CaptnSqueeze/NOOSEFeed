// ComprehensiveImageExtractor.ts
export function extractImageFromItem(item: Element): string | null {
    let imageUrl = null;

    // Method 1: Look for media:thumbnail element (BBC and many other news sites use this)
    const mediaThumbnail = item.querySelector("media\\:thumbnail, thumbnail");
    if (mediaThumbnail && mediaThumbnail.getAttribute("url")) {
        imageUrl = mediaThumbnail.getAttribute("url");
    }

    // Method 2: Look for media:content element
    if (!imageUrl) {
        const mediaContent = item.querySelector("media\\:content, content");
        if (mediaContent && mediaContent.getAttribute("url")) {
            imageUrl = mediaContent.getAttribute("url");
        }
    }

    // Method 3: Look for enclosure with image type
    if (!imageUrl) {
        const enclosure = item.querySelector("enclosure");
        if (enclosure &&
            enclosure.getAttribute("type")?.startsWith("image/") &&
            enclosure.getAttribute("url")) {
            imageUrl = enclosure.getAttribute("url");
        }
    }

    // Method 4: Parse image from description HTML
    if (!imageUrl) {
        const description = item.querySelector("description")?.textContent;
        if (description) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;
            const img = tempDiv.querySelector('img');
            if (img && img.src) {
                imageUrl = img.src;
            }
        }
    }

    // Method 5: Look for image tag within item
    if (!imageUrl) {
        const itemImage = item.querySelector("image");
        if (itemImage && itemImage.querySelector("url")) {
            imageUrl = itemImage.querySelector("url")?.textContent || null;
        }
    }

    // Method 6: Look for itunes:image tag (commonly used in podcasts)
    if (!imageUrl) {
        const itunesImage = item.querySelector("itunes\\:image, image");
        if (itunesImage && itunesImage.getAttribute("href")) {
            imageUrl = itunesImage.getAttribute("href");
        }
    }

    // Method 7: Look for og:image in content
    if (!imageUrl) {
        const content = item.querySelector("content\\:encoded")?.textContent;
        if (content) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const metaOgImage = tempDiv.querySelector('meta[property="og:image"]');
            if (metaOgImage && metaOgImage.getAttribute("content")) {
                imageUrl = metaOgImage.getAttribute("content");
            }
        }
    }

    return imageUrl;
}

// Function to extract fallback images based on feed title
export function extractFallbackImage(feedTitle: string): string | null {
    // Provide fallback images for specific feeds that often have missing images
    const fallbackImages: Record<string, string> = {
        "BBC News": "https://m.files.bbci.co.uk/modules/bbc-morph-news-waf-page-meta/5.2.0/bbc_news_logo.png",
        "TechCrunch": "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
        "Wired": "https://www.wired.com/wp-content/themes/Phoenix/assets/images/favicon.ico",
        // Add more fallbacks as needed
    };

    return fallbackImages[feedTitle] || null;
}

// Function to extract an image from the actual article page
export async function extractImageFromArticlePage(articleLink: string): Promise<string | null> {
    try {
        // Determine if running locally
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Get the proxy URL based on environment
        let proxyBaseUrl: string;
        if (isLocal) {
            proxyBaseUrl = `https://cors-anywhere.herokuapp.com`; // Local proxy for local development
        } else {
            const port = window.location.port ? `:${window.location.port}` : ':3000';
            proxyBaseUrl = `https://${window.location.hostname}${port}/proxy`;
        }

        const proxiedUrl = `${proxyBaseUrl}/${articleLink}`;
        const response = await fetch(proxiedUrl);
        const htmlText = await response.text();

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(htmlText, "text/html");

        // Look for high-quality images in priority order
        // 1. Open Graph image (often the highest quality and most representative)
        const ogImage = htmlDoc.querySelector('meta[property="og:image"]');
        if (ogImage && ogImage.getAttribute('content')) {
            return ogImage.getAttribute('content');
        }

        // 2. Twitter image (also usually high quality)
        const twitterImage = htmlDoc.querySelector('meta[name="twitter:image"]');
        if (twitterImage && twitterImage.getAttribute('content')) {
            return twitterImage.getAttribute('content');
        }

        // 3. Article image from common containers
        const articleImage = htmlDoc.querySelector('article img, .article-content img, .entry-content img');
        if (articleImage && articleImage.getAttribute('src')) {
            let imgSrc = articleImage.getAttribute('src') || '';
            // Handle relative URLs
            if (imgSrc.startsWith('/')) {
                const url = new URL(articleLink);
                imgSrc = `${url.origin}${imgSrc}`;
            }
            return imgSrc;
        }

        // 4. Any large image
        const images = Array.from(htmlDoc.querySelectorAll('img'));
        const largeImages = images.filter(img => {
            const width = parseInt(img.getAttribute('width') || '0', 10);
            const height = parseInt(img.getAttribute('height') || '0', 10);
            return (width > 300 || height > 300);
        });

        if (largeImages.length > 0) {
            let imgSrc = largeImages[0].getAttribute('src') || '';
            // Handle relative URLs
            if (imgSrc.startsWith('/')) {
                const url = new URL(articleLink);
                imgSrc = `${url.origin}${imgSrc}`;
            }
            return imgSrc;
        }

        return null;
    } catch (error) {
        console.error('Error extracting article image:', error);
        return null;
    }
}

// Main function to get the best image for a feed item
export async function getBestImageForFeedItem(
    item: Element,
    feedTitle: string,
    fetchFromArticle: boolean = false
): Promise<string | null> {
    // First try to get image from the RSS feed
    let imageUrl = extractImageFromItem(item);

    // If no image found and we're allowed to fetch from article
    if (!imageUrl && fetchFromArticle) {
        const link = item.querySelector("link")?.textContent;
        if (link) {
            try {
                imageUrl = await extractImageFromArticlePage(link);
            } catch (error) {
                console.error("Error fetching article image:", error);
            }
        }
    }

    // If still no image, use fallback
    if (!imageUrl) {
        imageUrl = extractFallbackImage(feedTitle);
    }

    return imageUrl;
}

// For debugging purposes
export function debugImageExtraction(item: Element): Record<string, string | null> {
    const results: Record<string, string | null> = {};

    // Check media:thumbnail
    const mediaThumbnail = item.querySelector("media\\:thumbnail, thumbnail");
    results["mediaThumbnail"] = mediaThumbnail?.getAttribute("url") || null;

    // Check media:content
    const mediaContent = item.querySelector("media\\:content, content");
    results["mediaContent"] = mediaContent?.getAttribute("url") || null;

    // Check enclosure
    const enclosure = item.querySelector("enclosure");
    results["enclosure"] = enclosure?.getAttribute("url") || null;

    // Check description for img
    const description = item.querySelector("description")?.textContent;
    let descriptionImg = null;
    if (description) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        descriptionImg = tempDiv.querySelector('img')?.src || null;
    }
    results["descriptionImg"] = descriptionImg;

    return results;
}