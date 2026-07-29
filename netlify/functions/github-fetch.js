// Netlify Function: Fetch JSON from GitHub
// Called by admin.js to load gallery, shop, and workshops data
// Uses GitHub PAT stored as repository secret in Netlify

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { file } = JSON.parse(event.body);

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file parameter' })
      };
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GitHub token not configured' })
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
        body: JSON.stringify({ error: `GitHub API error: ${response.statusText}` })
      };
    }

    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: content,
        sha: data.sha
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
