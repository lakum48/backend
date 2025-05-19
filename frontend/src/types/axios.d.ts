import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

declare module 'axios' {
  export function create(config?: AxiosRequestConfig): AxiosInstance;
  export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
} 