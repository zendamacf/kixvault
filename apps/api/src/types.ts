import type { Session, User } from 'lucia';

export type ApiEnv = {
  Variables: {
    user: User | null;
    session: Session | null;
    requestId: string;
    /** Language negotiated from `Accept-Language`. Used for emails. */
    locale: string;
  };
};
