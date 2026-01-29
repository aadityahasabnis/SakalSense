// =============================================
// Create Admin Account Script - Seed admin creator account
// Usage: pnpm --filter @sakalsense/frontend tsx scripts/create-admin.ts
// =============================================

import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

// Load .env.local from parent directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
}

// Use accelerateUrl for the Prisma client (required by this project's setup)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ accelerateUrl: DATABASE_URL } as any);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (prompt: string): Promise<string> => new Promise((resolve) => rl.question(prompt, resolve));

const questionHidden = (prompt: string): Promise<string> =>
    new Promise((resolve) => {
        process.stdout.write(prompt);
        const stdin = process.stdin;
        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let password = '';
        const onData = (char: string): void => {
            if (char === '\n' || char === '\r') {
                stdin.setRawMode?.(false);
                stdin.removeListener('data', onData);
                console.log();
                resolve(password);
            } else if (char === '\u0003') {
                process.exit();
            } else if (char === '\u007F') {
                password = password.slice(0, -1);
                process.stdout.write('\b \b');
            } else {
                password += char;
                process.stdout.write('*');
            }
        };
        stdin.on('data', onData);
    });

const main = async (): Promise<void> => {
    console.log('\n👨‍💼 Create Admin Content Creator\n');
    console.log('─'.repeat(40));

    try {
        const fullName = await question('Full Name: ');
        const email = await question('Email: ');
        const password = await questionHidden('Password: ');
        const confirmPassword = await questionHidden('Confirm Password: ');

        if (!fullName.trim()) {
            console.error('\n❌ Full name is required');
            process.exit(1);
        }

        if (!email.trim() || !email.includes('@')) {
            console.error('\n❌ Valid email is required');
            process.exit(1);
        }

        if (password.length < 8) {
            console.error('\n❌ Password must be at least 8 characters');
            process.exit(1);
        }

        if (password !== confirmPassword) {
            console.error('\n❌ Passwords do not match');
            process.exit(1);
        }

        const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

        if (existing) {
            console.log(`\n⚠️  Admin with email "${email}" already exists.`);
            const updateChoice = await question('Do you want to update the password? (y/n): ');

            if (updateChoice.toLowerCase() !== 'y') {
                console.log('\n❌ Operation cancelled.');
                process.exit(0);
            }

            await prisma.admin.update({
                where: { id: existing.id },
                data: { password: await argon2.hash(password, { type: argon2.argon2id }) },
            });

            console.log('\n✅ Password updated successfully!');
            console.log('─'.repeat(40));
            console.log(`   ID: ${existing.id}`);
            console.log(`   Name: ${existing.fullName}`);
            console.log(`   Email: ${existing.email}`);
            console.log('─'.repeat(40));
            console.log('\n💡 Use these credentials to login at /admin/login');
        } else {
            const admin = await prisma.admin.create({
                data: {
                    fullName: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    password: await argon2.hash(password, { type: argon2.argon2id }),
                    isActive: true,
                },
            });

            console.log('\n✅ Admin Creator account created successfully!');
            console.log('─'.repeat(40));
            console.log(`   ID: ${admin.id}`);
            console.log(`   Name: ${admin.fullName}`);
            console.log(`   Email: ${admin.email}`);
            console.log('─'.repeat(40));
            console.log('\n💡 Use these credentials to login at /admin/login');
            console.log('💡 After logging in, you can create content, series, courses, etc.');
        }
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
};

main();
