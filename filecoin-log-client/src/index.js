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
  
  /**
   * Verifies the status of an event stored on Filecoin using its CommP.
   * @param {string} commp - The CommP (Piece Commitment) of the stored log/event.
   * @returns {Promise<Object>} - A promise that resolves to the verification status object 
   *                              containing { exists, proofSetLastProven, proofSetNextProofDue }.
   */
  async verifyEvent(commp) {
    try {
      if (!commp || typeof commp !== 'string') {
        throw new Error('A valid "commp" string is required.');
      }
      
      const response = await fetch(`${this.apiEndpoint}/verify-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commp })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API verification request failed: ${response.status} ${errorText}`);
      }

      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Error verifying event with API:', error);
      throw error; // Re-throw for caller to handle
    }
  }
  
  /**
   * Downloads the log data stored on Filecoin using its CommP.
   * @param {string} commp - The CommP (Piece Commitment) of the stored log/event.
   * @returns {Promise<Object>} - A promise that resolves to the downloaded log data as a JSON object.
   */
  async downloadLog(commp) {
    try {
      if (!commp || typeof commp !== 'string') {
        throw new Error('A valid "commp" string is required.');
      }
      
      const response = await fetch(`${this.apiEndpoint}/download-log/${commp}`);
      
      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = `API download request failed: ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          // Ignore errors in getting error text
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response
      const logData = await response.json();
      return logData;
    } catch (error) {
      console.error('Error downloading log from API:', error);
      throw error; // Re-throw for caller to handle
    }
  }
}

// Default export
export default FilecoinLogClient;

// Named export for destructuring
export { FilecoinLogClient };