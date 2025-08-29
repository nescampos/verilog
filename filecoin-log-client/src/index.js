// For Node.js environments, you might need to install and import node-fetch
// import fetch from 'node-fetch'; // Uncomment if needed for Node.js

class FilecoinLogClient {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    if (!this.apiEndpoint) {
      throw new Error('API endpoint is required.');
    }
  }

  async sendLog(logData) {
    try {
      const response = await fetch(`${this.apiEndpoint}/upload-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending log to API:', error);
      throw error; // Re-throw for caller to handle
    }
  }
}

// Default export
export default FilecoinLogClient;

// Named export for destructuring
export { FilecoinLogClient };