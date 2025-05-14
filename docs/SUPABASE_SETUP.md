# Supabase Setup with Bolt.new and Netlify

This guide explains how to set up Supabase for your news dashboard with Bolt.new and Netlify integration.

## 1. Setting Up Supabase

### Create a Supabase Project

1. Sign up or log in at [https://supabase.com](https://supabase.com)
2. Create a new project and provide:
   - Project name (e.g., "news-dashboard")
   - Database password (save this securely)
   - Region (choose one close to your users)
3. Wait for your project to be created (usually takes a few minutes)

### Get Your API Keys

1. In your Supabase project dashboard, go to Project Settings > API
2. You'll need:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public** key (not the secret key)

## 2. Creating the Database Schema

### Create the Trends Table

1. In your Supabase dashboard, go to SQL Editor
2. Create a new query and paste the following SQL:

```sql
CREATE TABLE IF NOT EXISTS trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  timestamp timestamp with time zone NOT NULL,
  word_cloud_data jsonb NOT NULL,
  top_keywords jsonb NOT NULL,
  category_data jsonb NOT NULL
);

-- Create an index on the timestamp for faster queries
CREATE INDEX IF NOT EXISTS trends_timestamp_idx ON trends (timestamp DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone with the anon key to read
CREATE POLICY "Allow anonymous read access" 
  ON trends FOR SELECT 
  USING (true);

-- Create a policy that only allows authenticated users to insert
CREATE POLICY "Allow authenticated insert" 
  ON trends FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
```

3. Run the query to create the table and security policies

## 3. Integrating with Bolt.new

Bolt.new provides a Supabase integration that makes connecting to Netlify easier:

1. Log in to your Bolt.new account
2. Connect your GitHub repository
3. Go to Integrations and select Supabase
4. Follow the prompts to connect your Supabase project
5. The integration will automatically set up:
   - Environment variables in Netlify
   - Authentication redirects
   - Security policies

## 4. Manual Configuration for Netlify

If you're not using Bolt.new's integration or need to configure manually:

1. Log in to your Netlify dashboard
2. Go to your site > Site settings > Environment variables
3. Add the following environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## 5. Installing Supabase Client

To use Supabase in your project, you need to install the client library:

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

## 6. Configuring the Client

After installing the Supabase client, you need to uncomment the client creation code in `src/services/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Also uncomment the implementation in the `insertTrendData` and `getLatestTrendData` functions.

## 7. Testing the Connection

To test if your Supabase connection is working:

1. Run your project locally:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Check browser console logs when you click the "Search Trends" button
3. You should see a successful response from your Supabase database

## 8. Monitoring

You can monitor your Supabase database usage:

1. In the Supabase dashboard, go to Database > API
2. You can see:
   - API requests
   - Database size
   - Table statistics

This helps you track how your data is growing and optimize if needed. 