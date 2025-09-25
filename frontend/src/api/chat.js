// API configuration and chat endpoint
const API_BASE_URL = import.meta.env.PROD
    ? 'https://aayushbot-1.onrender.com'  // Production backend
    : 'http://localhost:8000';            // Development backend

/**
 * Send a chat message to the backend
 * @param {string} message - The message to send
 * @returns {Promise<Object>} - The response from the backend
 */
export const sendChatMessage = async (message) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

