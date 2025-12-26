// =============================================
// Admin Model - Invite-only stakeholder
// =============================================

import mongoose, { type Document, Schema } from 'mongoose';

export interface IAdminDocument extends Document {
    fullName: string;
    email: string;
    password: string;
    avatarLink?: string;
    invitedBy?: mongoose.Types.ObjectId; // tracks who invited this admin
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true, select: false },
        avatarLink: { type: String },
        invitedBy: { type: Schema.Types.ObjectId, ref: 'Administrator' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export const AdminModel = mongoose.model<IAdminDocument>('Admin', AdminSchema);
