// =============================================
// Administrator Model - Seeded only, highest privilege
// =============================================

import mongoose, { type Document, Schema } from 'mongoose';

export interface IAdministratorDocument extends Document {
    fullName: string;
    email: string;
    password: string;
    avatarLink?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AdministratorSchema = new Schema<IAdministratorDocument>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, index: true },
        password: { type: String, required: true, select: false },
        avatarLink: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export const AdministratorModel = mongoose.model<IAdministratorDocument>('Administrator', AdministratorSchema);
