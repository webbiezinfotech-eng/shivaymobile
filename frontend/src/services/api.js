const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, config);
  } catch {
    throw new ApiError('Unable to connect to server.', 0);
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('Unable to connect to server.', response.status);
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message || 'Request failed.',
      response.status,
      payload.errors || {}
    );
  }

  return payload;
}

export { API_BASE_URL, ApiError, request };
