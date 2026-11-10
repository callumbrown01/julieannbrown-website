const https = require('https');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Use Formspree as email backend
    const formspreeId = process.env.FORMSPREE_ID || 'f/YOUR_FORMSPREE_ID';
    
    const postData = JSON.stringify({
      name: name,
      email: email,
      subject: subject || 'No subject',
      message: message,
      _replyto: email
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'formspree.io',
        path: `/${formspreeId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode === 200 ? 200 : 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: res.statusCode === 200,
              message: res.statusCode === 200 
                ? 'Thank you for your message. We will get back to you soon.'
                : 'Error sending message. Please try again.'
            })
          });
        });
      });

      req.on('error', (error) => {
        console.error('Error submitting to Formspree:', error);
        resolve({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            success: false,
            message: 'Error sending message. Please try again.'
          })
        });
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false,
        message: 'Error processing request'
      })
    };
  }
};
