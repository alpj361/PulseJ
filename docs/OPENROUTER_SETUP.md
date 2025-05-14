# OpenRouter AI Integration Setup

This guide explains how to set up and configure the OpenRouter AI integration for processing trends data in your news dashboard.

## Overview

The OpenRouter AI integration uses GPT-4 Turbo to process raw trends data into structured JSON for your dashboard visualizations. This processing happens in a secure Netlify serverless function, which keeps your API key safe.

## 1. OpenRouter Account Setup

1. Sign up for an account at [OpenRouter.ai](https://openrouter.ai/)
2. Go to your dashboard and create an API key
3. Copy your API key for later use

## 2. Netlify Environment Variables

You need to set up your OpenRouter API key in Netlify:

1. Log in to your Netlify dashboard
2. Go to your site > Site settings > Environment variables
3. Add a new environment variable:
   - Key: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key

## 3. Update HTTP-Referer in the Netlify Function

OpenRouter requires the HTTP-Referer header to match your deployed site. Open the `netlify/functions/processTrends.js` file and update the following line:

```javascript
'HTTP-Referer': 'https://your-netlify-site.netlify.app/', // Replace with your Netlify site URL
```

Replace the URL with your actual Netlify site URL.

## 4. Choose Your AI Model

By default, the integration uses `anthropic/claude-3-opus` for high quality results, but you can change to any OpenRouter-supported model. To change the model, modify the `model` field in `processTrends.js`:

```javascript
model: 'openai/gpt-4-turbo', // Or any other OpenRouter-supported model
```

Popular options include:
- `anthropic/claude-3-opus` (highest quality)
- `anthropic/claude-3-sonnet` (balanced)
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`

## 5. Testing the Integration

After deployment, you can test the integration by:

1. Going to your dashboard
2. Clicking the "Search Trends" button
3. Checking the browser console for log messages from the function
4. Viewing the visualizations to confirm they display properly

If you encounter issues, check your Netlify function logs:

1. In your Netlify dashboard, go to Functions
2. Find the `processTrends` function
3. View the logs to see any errors

## 6. Customizing the AI Prompt

To customize how the AI processes your data, you can modify the system message in `processTrends.js`. Find the section with:

```javascript
role: 'system',
content: `You are an AI that processes trending data...`
```

You can adjust this prompt to provide more specific instructions for your trends data format. 