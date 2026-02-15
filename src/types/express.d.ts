import { JWTPayload } from './index';

declare global {
  namespace Express {
    // Unified User interface that supports both JWT and OAuth
    interface User {
      // JWT fields (always present after authentication)
      userId: string;
      email: string;
      
      // OAuth fields (optional, only present for OAuth users)
      id?: string;
      displayName?: string;
      picture?: string;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};

