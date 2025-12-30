// =============================================
// Administrator Authentication Controller
// Handles login, logout, session management (no registration - seeded accounts)
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants.js';
import { AdministratorModel, type IAdministratorDocument } from '../../models/index.js';
import { createAuthController } from './base.auth.controller.js';

export const administratorAuthController = createAuthController<IAdministratorDocument>({
    role: STAKEHOLDER.ADMINISTRATOR,
    model: AdministratorModel,
    supportsRegistration: false,
});
