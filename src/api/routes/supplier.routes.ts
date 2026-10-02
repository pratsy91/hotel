import { Router } from 'express';
import { getSupplierAHotels, getSupplierBHotels } from '../controllers/supplier.controller';
import { asyncHandler } from '../middleware/async-handler.js';

export const supplierRouter = Router();

supplierRouter.get('/supplierA/hotels', asyncHandler(getSupplierAHotels));
supplierRouter.get('/supplierB/hotels', asyncHandler(getSupplierBHotels));
