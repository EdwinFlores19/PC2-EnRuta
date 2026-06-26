export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message: string;
  pagination?: Pagination;
}

export const buildResponse = <T>(data: T, message = 'Operación exitosa', pagination: Pagination | null = null): ApiResponse<T> => {
  const response: ApiResponse<T> = { status: 'success', data, message };
  if (pagination) response.pagination = pagination;
  return response;
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<T[]> => {
  const totalPages = Math.ceil(total / limit);
  return {
    status: 'success',
    data,
    message: message || 'Listado obtenido correctamente',
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const buildErrorResponse = (message: string, _statusCode = 500): ApiResponse<null> => ({
  status: 'error',
  message,
});
