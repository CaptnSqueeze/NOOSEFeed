# NOOSEFeed

> No app, no paywalls, no algorithms... just news

NOOSEFeed is a lightweight news aggregator that displays content from various RSS feeds in a clean, ad-free interface. The application fetches RSS feeds directly, extracts images, and presents articles in a unified, chronological format.

If you'd like to see it in action, I am currently hosting it [my domain](https://warriorlife.ca/)

## Features

- Clean, distraction-free reading experience
- No algorithms - articles are shown in chronological order
- Mobile-responsive design
- Automatic image extraction from RSS feeds
- Infinite scrolling with loading indicators
- No tracking or personalization

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/noosefeed.git
   cd noosefeed
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. **Important**: Request temporary CORS access

   When running locally, you need to request temporary access to the CORS Anywhere server:
   - Visit [https://cors-anywhere.herokuapp.com/corsdemo](https://cors-anywhere.herokuapp.com/corsdemo)
   - Click the "Request temporary access to the demo server" button
   - This access is required for fetching RSS feeds during local development

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

## Project Structure

```
noosefeed/
├── public/
│   ├── default-feeds.json  # Configuration for RSS feeds
│   └── logo.png
├── src/
│   ├── App.tsx             # Main application component
│   ├── ArticlePage.tsx     # Article view component
│   ├── ImageExtractor.ts   # Image extraction utilities
│   └── ...                 # Other application files
├── index.html
├── package.json
└── vite.config.ts          # Vite configuration
```

## Customizing Feeds

You can customize the RSS feeds displayed by modifying the `public/default-feeds.json` file. The file structure is:

```json
[
  {
    "category": "Category Name",
    "feeds": [
      {
        "title": "Source Name",
        "link": "https://example.com/rss.xml"
      }
    ]
  }
]
```

## Deployment

The application can be built for production using:

```bash
npm run build
# or
yarn build
```

You'll need to set up a proxy server for CORS handling in production. The application automatically detects whether it's running in development or production and uses the appropriate proxy URL.

## Browser Support

NOOSEFeed supports all modern browsers, including:
- Chrome (and Chromium-based browsers)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- RSS parsing with the native [DOMParser API](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
- CORS proxy by [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)
