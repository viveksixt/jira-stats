export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = 'Request failed';
    let errorDetails: any = null;

    try {
      errorDetails = await response.json();
      errorMessage = errorDetails.error || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(response.status, errorMessage, errorDetails);
  }

  return response.json();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof APIError) {
    return error.status;
  }

  return 500;
}
