import { Router } from 'express';
import { getHotels } from '../controllers/hotel.controller';
import { asyncHandler } from '../middleware/async-handler.js';

export const hotelRouter = Router();

hotelRouter.get('/hotels', asyncHandler(getHotels));
