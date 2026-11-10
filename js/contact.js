document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('/.netlify/functions/contact-form', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Thank you for your message! We will get back to you soon.');
        form.reset();
      } else {
        alert('Error: ' + (result.error || 'Failed to send message'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error sending message. Please try again.');
    }
  });
});
