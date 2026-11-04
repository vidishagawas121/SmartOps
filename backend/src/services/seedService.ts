import bcrypt from 'bcryptjs';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Trip from '../models/Trip';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Attendance from '../models/Attendance';
import Salary from '../models/Salary';
import POD from '../models/POD';

export const seedCompanyData = async (
  companyId: string,
  ownerId?: string,
  ownerEmail?: string,
  companyName: string = 'SmartOps Logistics'
) => {
  // Demo data seeding disabled for clean workspace operation
  return;
};

