import type { Session, User } from 'lucia';

export type ApiEnv = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};
