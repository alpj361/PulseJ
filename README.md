# News Dashboard with Trends Scraper Integration

A React-based dashboard for viewing trending news topics with integration to a VPS-based scraper, OpenRouter AI processing, and Supabase database.

## Features

- View trending keywords in a word cloud visualization
- See news distribution by category with bar charts
- Track top keywords with frequency counts
- Button to trigger trend scraping from your VPS
- AI-powered trend processing using OpenRouter (GPT-4 Turbo)
- Integration with Supabase for data storage and retrieval

## Setup Instructions

### 1. Dependencies Installation

```bash
npm install
# or
yarn
```

### 2. VPS Scraper Configuration

1. Create a `.env.local` file in the root directory with your VPS API URL:

```
VITE_VPS_API_URL=https://your-vps-domain.com/api
```

2. Ensure your VPS scraper API returns data in the following format:

```typescript
{
  wordCloudData: Array<{
    text: string;
    value: number;
    color: string;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  categoryData: Array<{
    category: string;
    count: number;
  }>;
  timestamp: string;
}
```

### 3. Supabase Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Create a `trends` table with the following structure:
   - `id`: uuid (primary key, generated)
   - `created_at`: timestamp with time zone (default now())
   - `timestamp`: timestamp with time zone (when the trend data was collected)
   - `word_cloud_data`: jsonb (array of WordCloudItem)
   - `top_keywords`: jsonb (array of KeywordCount)
   - `category_data`: jsonb (array of CategoryCount)

4. Install the Supabase client:

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

5. Add your Supabase credentials to the `.env.local` file:

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Uncomment the Supabase client implementation in `src/services/supabase.ts`.

### 4. Bolt.new and Netlify Integration

This project is designed to work with Bolt.new and Netlify for deployment:

1. The `netlify.toml` file configures environment variables for different deployment contexts
2. Set up your environment variables in the Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add the following variables:
     - `VITE_VPS_API_URL`: URL of your VPS scraper API
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

3. If using Bolt.new's Supabase integration:
   - Connect your GitHub repository to Bolt.new
   - Enable the Supabase integration in Bolt.new
   - The integration will automatically configure Supabase with Netlify

4. Deploy your site:
   - Bolt.new will automatically deploy to Netlify
   - The environment variables will be used in the production build

### 5. OpenRouter AI Integration

This project uses OpenRouter's AI (GPT-4 Turbo or Claude) to process and analyze trends:

1. Sign up for an account at [OpenRouter.ai](https://openrouter.ai/)
2. Create an API key in your OpenRouter dashboard
3. Add your API key to the Netlify environment variables:
   - Go to Site settings > Environment variables
   - Add `OPENROUTER_API_KEY` with your OpenRouter API key
4. Update the HTTP-Referer in `netlify/functions/processTrends.js` to match your Netlify site URL

For more details, see the [OpenRouter Integration](./docs/OPENROUTER_SETUP.md) documentation.

## Development

```bash
npm run dev
# or
yarn dev
```

## Build for Production

```bash
npm run build
# or
yarn build
```

## Usage

1. Navigate to the Trends page in the dashboard
2. Click the "Search Trends" button to trigger a scrape from your VPS
3. The data will be fetched, stored in Supabase, and displayed in the dashboard
4. The dashboard will show the latest trend data from Supabase on initial load

## Customization

- Modify the visualizations in the `src/components/ui` directory
- Adjust the API endpoints and data processing in `src/services/api.ts`
- Customize the Supabase integration in `src/services/supabase.ts`

## Documentation

For detailed instructions, see:

- [VPS Scraper Setup](./docs/SCRAPER_SETUP.md) - How to set up and deploy your scraper
- [Supabase Integration](./docs/SUPABASE_SETUP.md) - How to configure Supabase with Bolt.new and Netlify
- [OpenRouter AI Integration](./docs/OPENROUTER_SETUP.md) - How to set up AI processing for trends