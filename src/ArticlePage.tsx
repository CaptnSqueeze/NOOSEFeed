import { useParams } from "react-router-dom";
import { FeedItem } from './App'; // Import FeedItem from App.tsx

const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const ArticlePage = ({ feedItems }: { feedItems: FeedItem[] }) => {
    const { slug } = useParams<{ slug: string }>(); // Get slug from URL

    // Find the article by its slug
    const article = feedItems.find(item => slugify(item.title) === slug);

    if (!article) return <p>Article not found.</p>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <p className="mt-4 text-gray-700">{article.description.replace(/<\/?[^>]+(>|$)/g, "")}</p>

            {/* Button to navigate to the full article */}
            <div className="mt-4">
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded shadow-md hover:bg-blue-700 transition-colors">
                        Go to Article Page
                    </button>
                </a>
            </div>
        </div>
    );
};

export default ArticlePage;
