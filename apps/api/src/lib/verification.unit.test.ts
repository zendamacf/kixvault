import { beforeEach, describe, expect, mock, test } from 'bun:test';

let selectResults: unknown[][] = [];

const mockDeleteWhere = mock(async () => undefined);
const mockInsertValues = mock(async () => undefined);
const mockUpdateWhere = mock(async () => undefined);

const mockDelete = mock(() => ({ where: mockDeleteWhere }));
const mockInsert = mock(() => ({ values: mockInsertValues }));
const mockUpdate = mock(() => ({
  set: mock(() => ({
    where: mockUpdateWhere,
  })),
}));
const mockSelect = mock(() => ({
  from: mock(() => ({
    where: mock(async () => selectResults.shift() ?? []),
  })),
}));

mock.module('./db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

mock.module('lucia', () => ({
  generateIdFromEntropySize: () => 'token-id-1',
}));

const mockSendVerificationEmail = mock(async () => undefined);

mock.module('./email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
}));

const { createVerificationToken, resendVerificationEmail, verifyEmailToken } = await import(
  './verification'
);

describe('createVerificationToken', () => {
  beforeEach(() => {
    mockDeleteWhere.mockClear();
    mockInsertValues.mockClear();
    selectResults = [];
  });

  test('stores a hashed token and returns the raw value', async () => {
    const rawToken = await createVerificationToken('user-1');

    expect(rawToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalled();
  });
});

describe('verifyEmailToken', () => {
  beforeEach(() => {
    mockDeleteWhere.mockClear();
    mockUpdateWhere.mockClear();
    selectResults = [];
  });

  test('rejects an unknown token', async () => {
    selectResults = [[]];

    const result = await verifyEmailToken('missing-token');

    expect(result).toEqual({
      success: false,
      error: 'Invalid or expired verification link',
    });
    expect(mockUpdateWhere).not.toHaveBeenCalled();
  });

  test('rejects an expired token and deletes it', async () => {
    selectResults = [
      [
        {
          id: 'token-1',
          userId: 'user-1',
          expiresAt: new Date(Date.now() - 60_000),
        },
      ],
    ];

    const result = await verifyEmailToken('expired-token');

    expect(result).toEqual({
      success: false,
      error: 'Verification link has expired',
    });
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockUpdateWhere).not.toHaveBeenCalled();
  });

  test('marks the user verified and clears tokens', async () => {
    selectResults = [
      [
        {
          id: 'token-1',
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],
    ];

    const result = await verifyEmailToken('valid-token');

    expect(result).toEqual({ success: true });
    expect(mockUpdateWhere).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();
  });
});

describe('resendVerificationEmail', () => {
  beforeEach(() => {
    mockDeleteWhere.mockClear();
    mockInsertValues.mockClear();
    mockSendVerificationEmail.mockClear();
    selectResults = [];
  });

  test('returns without sending when the user does not exist', async () => {
    selectResults = [[]];

    const result = await resendVerificationEmail('missing@example.com');

    expect(result).toEqual({ sent: false, rateLimited: false });
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  test('returns without sending when the user is already verified', async () => {
    selectResults = [[{ id: 'user-1', emailVerified: true }]];

    const result = await resendVerificationEmail('verified@example.com');

    expect(result).toEqual({ sent: false, rateLimited: false });
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  test('creates a token and sends email for unverified users', async () => {
    selectResults = [[{ id: 'user-1', emailVerified: false }]];

    const result = await resendVerificationEmail('pending-1@example.com');

    expect(result).toEqual({ sent: true, rateLimited: false });
    expect(mockInsertValues).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      to: 'pending-1@example.com',
      token: expect.any(String),
    });
  });

  test('rate limits repeated resend requests for the same email', async () => {
    selectResults = [[{ id: 'user-1', emailVerified: false }]];

    await resendVerificationEmail('ratelimit@example.com');

    const secondAttempt = await resendVerificationEmail('ratelimit@example.com');

    expect(secondAttempt).toEqual({ sent: false, rateLimited: true });
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
