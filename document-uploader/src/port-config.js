// This file contains the default server port configuration
// This is only used as a fallback if environment variables are not set
// and if dynamic port detection fails.
//
// The actual server port is determined in the following order:
// 1. SERVER_PORT environment variable
// 2. PORT environment variable
// 3. This default value (64970)

export const DEFAULT_SERVER_PORT = 64970;

// Function to test if a port is working
export const testPort = async (port) => {
  try {
    const axios = require("axios");
    const response = await axios.get(`http://localhost:${port}/api/test`, {
      timeout: 2000,
    });
    return (
      response.data && response.data.message === "Server is running correctly"
    );
  } catch (e) {
    return false;
  }
};
