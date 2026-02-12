// apiUtils.ts
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Sends API validation data to the backend
 */
export const sendApiValidation = async (apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'API validation recorded successfully',
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to record API validation',
      };
    }
  } catch (error) {
    console.error('Error sending API validation to backend:', error);
    return {
      success: false,
      error: 'Network error: Could not connect to the server',
    };
  }
};

/**
 * Fetches all API validations from the backend
 */
export const getAllApiValidations = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/validations`);
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    } else {
      console.error('Failed to fetch API validations:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching API validations:', error);
    return [];
  }
};