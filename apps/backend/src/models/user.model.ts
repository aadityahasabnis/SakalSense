// =============================================
// User Model - Primary frontend stakeholder
// =============================================

import mongoose, { type Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
    fullName: string;
    email: string;
    mobile?: string;
    password: string;
    avatarLink?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        mobile: { type: String, sparse: true },
        password: { type: String, required: true, select: false }, // never returned by default
        avatarLink: { type: String },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
