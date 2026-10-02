import { Router } from 'express';
import { healthRouter } from './api/routes/health.routes';
import { hotelRouter } from './api/routes/hotel.routes';
import { supplierRouter } from './api/routes/supplier.routes';

export const routes = Router();

routes.use(healthRouter);
routes.use(supplierRouter);
routes.use('/api', hotelRouter);
