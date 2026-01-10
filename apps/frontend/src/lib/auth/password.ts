// =============================================
// Password Utilities - Argon2id hashing
// =============================================

import * as argon2 from 'argon2';

// hashPassword: Hash password using Argon2id (recommended for security)
export const hashPassword = async (password: string): Promise<string> => argon2.hash(password, { type: argon2.argon2id });

// verifyPassword: Verify password against hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => argon2.verify(hash, password);
