import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { asyncHandler } from '../middleware/async-handler.js';

export const healthRouter = Router();

healthRouter.get('/health', asyncHandler(getHealth));
