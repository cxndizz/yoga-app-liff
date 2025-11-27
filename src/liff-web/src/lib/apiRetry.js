/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 2)
 * @param {number} options.initialDelay - Initial delay in ms (default: 500)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 3000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 2,
    initialDelay = 500,
    maxDelay = 3000,
    shouldRetry = () => true,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        break;
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, error.message);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with max delay
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx errors)
 * @param {Error} error - The error to check
 * @returns {boolean} - True if error should be retried
 */
export function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Timeout errors
  if (error.message?.toLowerCase().includes('timeout')) {
    return true;
  }

  // 5xx server errors
  if (error.response?.status >= 500) {
    return true;
  }

  // 429 Too Many Requests
  if (error.response?.status === 429) {
    return true;
  }

  // Network failure (no response)
  if (!error.response && error.request) {
    return true;
  }

  return false;
}

/**
 * Wrapper for fetch with automatic retry
 * @param {Function} fetchFn - The fetch function to wrap
 * @param {Object} retryOptions - Options for retry logic
 * @returns {Function} - Wrapped function with retry logic
 */
export function withRetry(fetchFn, retryOptions = {}) {
  return async (...args) => {
    return retryWithBackoff(
      () => fetchFn(...args),
      {
        shouldRetry: isRetryableError,
        ...retryOptions,
      },
    );
  };
}
