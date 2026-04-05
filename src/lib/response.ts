/**
 * Standard API response wrapper for consistent response format.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Create a success response object.
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create a paginated success response object.
 */
export function paginatedResponse<T>(
  data: T,
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create an error response object.
 */
export function errorResponse(message: string, errors?: any[]): ApiResponse {
  return {
    success: false,
    message,
    errors,
  };
}
