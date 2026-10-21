// Netlify Function: Fetch JSON from GitHub
// Called by admin.js to load gallery, shop, and workshops data
// Uses GitHub PAT stored as repository secret in Netlify

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { file, token } = JSON.parse(event.body);

    if (!file) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing file parameter' })
      };
    }

    // Use provided token, fall back to environment variable
    const githubToken = token || process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GitHub token not configured. Please provide a GitHub PAT.' })
      };
    }

    const owner = 'callumbrown01';
    const repo = 'julieannbrown-website';

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `GitHub API error: ${response.statusText}` })
      };
    }

    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: content,
        sha: data.sha
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
