import { NavigateFunction, Params } from 'react-router-dom';

declare module 'react-router-dom' {
  export * from '@types/react-router-dom';
  export function useNavigate(): NavigateFunction;
  export function useParams<T extends Record<string, string>>(): T;
  export function Link(props: any): JSX.Element;
} 