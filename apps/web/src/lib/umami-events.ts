/** Umami custom event names (no PII in payloads). */
export const UmamiEvents = {
  authLogin: 'auth_login',
  authLoginFailed: 'auth_login_failed',
  authRegister: 'auth_register',
  authRegisterFailed: 'auth_register_failed',
  authLogout: 'auth_logout',
  sneakerCreate: 'sneaker_create',
  sneakerUpdate: 'sneaker_update',
  sneakerDelete: 'sneaker_delete',
} as const;

export type UmamiEventData = Record<string, string | number | boolean>;
