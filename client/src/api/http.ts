export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** fetch wrapper: JSON in/out, timeouts, and one error type for network and HTTP failures. */
export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = 10_000 } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: combined,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timeout.aborted) throw new ApiError('The request timed out.', 0, 'TIMEOUT');
    throw new ApiError('Could not reach the server. Check your connection.', 0, 'NETWORK');
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as { error?: { message?: string; code?: string } } | null)?.error;
    // No JSON error body on a 5xx means a proxy/gateway answered, not our API.
    const fallback =
      response.status >= 500
        ? 'The server is unavailable right now. Try again in a moment.'
        : `Request failed (${response.status})`;
    throw new ApiError(error?.message ?? fallback, response.status, error?.code ?? 'HTTP_ERROR');
  }
  return payload as T;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}
