// Netlify Function: Save JSON to GitHub
// Called by admin.js to save gallery, shop, and workshops data
// Uses GitHub PAT stored as repository secret in Netlify
// Includes basic authentication via password hash

const crypto = require('crypto');

// Password hash (CallumIsKing1401)
const ADMIN_PASSWORD_HASH = 'c9374488070ef72bbc2b6a766efe60e2af03f27ac5d09d3e0fee87337a6ef928';

async function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { file, data, password } = JSON.parse(event.body);

    if (!file || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file or data parameter' })
      };
    }

    // Verify password
    const passwordHash = await sha256(password || '');
    if (passwordHash !== ADMIN_PASSWORD_HASH) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Invalid password' })
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

    // Get current file SHA
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (!getResponse.ok) {
      return {
        statusCode: getResponse.status,
        body: JSON.stringify({ error: `Could not fetch current file: ${getResponse.statusText}` })
      };
    }

    const currentFile = await getResponse.json();
    const sha = currentFile.sha;

    // Save new version
    const saveResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/${file}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Admin: update ${file}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
          sha: sha
        })
      }
    );

    if (!saveResponse.ok) {
      return {
        statusCode: saveResponse.status,
        body: JSON.stringify({ error: `Could not save file: ${saveResponse.statusText}` })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
