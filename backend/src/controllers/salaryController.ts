import { Response } from 'express';
import Salary from '../models/Salary';
import { AuthRequest } from '../middleware/authMiddleware';

export const getSalaries = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.companyId) {
      filter.companyId = req.companyId;
    }
    const salaries = await Salary.find(filter).sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createSalary = async (req: AuthRequest, res: Response) => {
  try {
    const pay = new Salary({
      ...req.body,
      companyId: req.companyId,
      ownerId: req.userId,
    });
    await pay.save();
    res.status(201).json(pay);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateSalary = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.companyId) {
      filter.companyId = req.companyId;
    }
    const updated = await Salary.findOneAndUpdate(filter, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteSalary = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.companyId) {
      filter.companyId = req.companyId;
    }
    const deleted = await Salary.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }
    res.json({ message: 'Salary record removed.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
