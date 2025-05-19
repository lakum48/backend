import { UseQueryResult, UseMutationResult, UseQueryClient } from '@tanstack/react-query';

declare module '@tanstack/react-query' {
  export function useQuery<TData = unknown, TError = Error>(
    options: {
      queryKey: unknown[];
      queryFn: () => Promise<TData>;
      onSuccess?: (data: TData) => void;
      onError?: (error: TError) => void;
    }
  ): UseQueryResult<TData, TError>;

  export function useMutation<TData = unknown, TError = Error, TVariables = unknown>(
    options: {
      mutationFn: (variables: TVariables) => Promise<TData>;
      onSuccess?: (data: TData) => void;
      onError?: (error: TError) => void;
    }
  ): UseMutationResult<TData, TError, TVariables> & {
    isPending: boolean;
  };

  export function useQueryClient(): UseQueryClient;
} 