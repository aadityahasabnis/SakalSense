// =============================================
// Mail Routes - Email API endpoints
// =============================================

import { Router, type Router as IRouter } from 'express';

import { sendTestMailController, getMailLogsController, getMailStatsController } from '@/controllers/mail/mail.controller.js';
import { asyncHandler, authenticateAdministrator } from '@/middlewares/index.js';

const router: IRouter = Router();

// All routes protected by Administrator authentication
router.post('/test', authenticateAdministrator, asyncHandler(sendTestMailController));
router.get('/logs', authenticateAdministrator, asyncHandler(getMailLogsController));
router.get('/stats', authenticateAdministrator, asyncHandler(getMailStatsController));

export { router as mailRouter };
