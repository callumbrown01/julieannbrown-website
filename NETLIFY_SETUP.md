# Netlify Setup Guide

This site uses **Netlify Functions** to securely manage your GitHub repository secrets. Your GitHub Personal Access Token (PAT) is stored as a Netlify environment variable and never exposed in client-side code.

## Setup Instructions

### 1. Create a GitHub Personal Access Token
- Go to: https://github.com/settings/tokens?type=beta
- Click "Generate new token (beta)"
- Choose a name: `julieannbrown-website`
- Select scopes: Check `repo` (Full control of private repositories)
- Click "Generate token"
- **Copy the token** (you'll only see it once!)

### 2. Deploy to Netlify
Option A: Using GitHub (Recommended)
- Go to: https://app.netlify.com
- Click "Add new site" → "Import an existing project"
- Connect your GitHub account
- Select your `julieannbrown-website` repository
- Click "Deploy"

Option B: Manual deployment
- Install Netlify CLI: `npm install -g netlify-cli`
- In your project folder: `netlify deploy --prod`

### 3. Add GitHub Token as Environment Variable
After deployment:
1. Go to your Netlify site dashboard
2. Click "Site settings"
3. Go to "Build & deploy" → "Environment"
4. Click "Edit variables"
5. Add new variable:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: Paste your GitHub PAT (from step 1)
6. Click "Save"

### 4. Redeploy
- Go to "Deploys"
- Click "Trigger deploy" → "Deploy site"
- Wait for the green checkmark ✅

### 5. Test
- Go to your site's admin page (e.g., `https://yoursite.netlify.app/admin.html`)
- Login with your password
- Try uploading an item to gallery/shop - it should save to GitHub automatically!

## How It Works
- Your GitHub PAT is stored securely in Netlify (never in code)
- When you save changes, your browser calls Netlify Functions
- The functions authenticate your request using your password
- The functions use the GitHub token from environment variables
- Your data is updated in the GitHub repository
- No secret is ever exposed in client-side code ✅

## Troubleshooting

**"GitHub token not configured"**
- Check that the `GITHUB_TOKEN` environment variable is set in Netlify
- Redeploy your site after adding the variable

**"Unauthorized: Invalid password"**
- Make sure you're entering the correct admin password
- The default password is: `CallumIsKing1401`

**"Could not save file"**
- Check that your GitHub token has `repo` scope
- Verify the repository name is correct (`callumbrown01/julieannbrown-website`)
- Check that the token hasn't expired

**Functions returning 404**
- Make sure `netlify.toml` is in your repository root
- Check that the `netlify/functions/` directory exists with the function files
- Redeploy the site
