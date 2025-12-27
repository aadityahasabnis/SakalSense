// =============================================
// Administrator Authentication Controller
// Handles login, logout, session management (no registration - seeded accounts)
// =============================================

import { STAKEHOLDER } from 'sakalsense-core';

import { AdministratorModel, type IAdministratorDocument } from '../../models';
import { createAuthController } from './base.auth.controller';

const controller = createAuthController<IAdministratorDocument>({
    role: STAKEHOLDER.ADMINISTRATOR,
    model: AdministratorModel,
    supportsRegistration: false,
});

export const { login, logout, getSessions, terminateSession, updatePassword } = controller;
