// =============================================
// Create Super Administrator Script
// Usage: pnpm create:sadmin
// =============================================

import * as readline from 'readline';
import mongoose from 'mongoose';
import argon2 from 'argon2';

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL ?? '';

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}

// Administrator Schema (inline to avoid import issues)
const AdministratorSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true, select: false },
        avatarLink: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const AdministratorModel = mongoose.model('Administrator', AdministratorSchema);

// Readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

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
    console.log('\n🔐 Create Super Administrator\n');
    console.log('─'.repeat(40));

    try {
        // Get inputs
        const fullName = await question('Full Name: ');
        const email = await question('Email: ');
        const password = await questionHidden('Password: ');
        const confirmPassword = await questionHidden('Confirm Password: ');

        // Validate
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

        console.log('\n⏳ Connecting to database...');
        await mongoose.connect(DATABASE_URL);

        // Check if admin exists
        const existing = await AdministratorModel.findOne({ email: email.toLowerCase() });

        if (existing) {
            console.log(`\n⚠️  Administrator with email "${email}" already exists.`);
            const updateChoice = await question('Do you want to update the password? (y/n): ');

            if (updateChoice.toLowerCase() !== 'y') {
                console.log('\n❌ Operation cancelled.');
                await mongoose.disconnect();
                process.exit(0);
            }

            // Update password
            const hashedPassword = await argon2.hash(password);
            await AdministratorModel.updateOne({ _id: existing._id }, { $set: { password: hashedPassword } });

            console.log('\n✅ Password updated successfully!');
            console.log('─'.repeat(40));
            console.log(`   ID: ${existing._id}`);
            console.log(`   Name: ${existing.fullName}`);
            console.log(`   Email: ${existing.email}`);
            console.log('─'.repeat(40));
        } else {
            // Hash password and create new
            const hashedPassword = await argon2.hash(password);
            const admin = await AdministratorModel.create({
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                isActive: true,
            });

            console.log('\n✅ Super Administrator created successfully!');
            console.log('─'.repeat(40));
            console.log(`   ID: ${admin._id}`);
            console.log(`   Name: ${admin.fullName}`);
            console.log(`   Email: ${admin.email}`);
            console.log('─'.repeat(40));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    } finally {
        rl.close();
    }
};

main();
