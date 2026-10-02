import type { Request, Response } from 'express';
import { listSupplierAHotels } from '../../suppliers/supplierA.js';
import { listSupplierBHotels } from '../../suppliers/supplierB.js';
import { parseCity } from '../validators/hotel-query.validator';

export async function getSupplierAHotels(req: Request, res: Response): Promise<void> {
  const city = parseCity(req.query.city);
  res.status(200).json(listSupplierAHotels(city));
}

export async function getSupplierBHotels(req: Request, res: Response): Promise<void> {
  const city = parseCity(req.query.city);
  res.status(200).json(listSupplierBHotels(city));
}
