document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const serviceNumber = document.getElementById('service-number').value;
  
      try {
        const response = await fetch('/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, serviceNumber })
        });
        const data = await response.json();
  
        if (response.ok) {
          document.getElementById('new-password-result').textContent = `New Password: ${data.newPassword}`;
          document.getElementById('copy-password-button').style.display = 'block';
          document.getElementById('copy-password-button').addEventListener('click', () => {
            navigator.clipboard.writeText(data.newPassword).then(() => {
              alert('Password copied to clipboard');
            });
          });
        } else {
          document.getElementById('new-password-result').textContent = data.message;
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });
  