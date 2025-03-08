import { Secret } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
  }

  export type StringValue = string | undefined;
}
