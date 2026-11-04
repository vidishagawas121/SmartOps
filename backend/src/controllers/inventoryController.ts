import { Response } from 'express';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── GET /inventory ────────────────────────────────────────────────────────────
export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }

    const items = await Inventory.find({ companyId })
      .populate('productId')
      .sort({ createdAt: -1 });

    const flatItems = items.map((inv: any) => {
      const prod = inv.productId || {};
      return {
        id: String(inv._id),
        _id: String(inv._id),
        productId: prod._id ? String(prod._id) : '',
        itemName: prod.productName || inv.itemName || 'Unknown Item',
        category: prod.category || inv.category || 'Raw Materials',
        sku: prod.sku || inv.sku || '',
        barcode: prod.barcode || '',
        subCategory: prod.subCategory || '',
        brand: prod.brand || '',
        unit: prod.unit || inv.unit || 'Pieces',
        warehouse: inv.warehouse || 'Primary Warehouse',
        storageLocation: inv.storageLocation || '',
        supplier: inv.supplier || '',
        purchasePrice: prod.purchasePrice !== undefined ? prod.purchasePrice : (inv.purchasePrice || 0),
        sellingPrice: prod.sellingPrice !== undefined ? prod.sellingPrice : (inv.sellingPrice || 0),
        quantity: inv.quantity !== undefined ? inv.quantity : 0,
        reservedStock: inv.reservedStock || 0,
        availableStock: (inv.quantity || 0) - (inv.reservedStock || 0),
        minimumQuantity: prod.minimumStockLevel !== undefined ? prod.minimumStockLevel : (inv.minimumQuantity || 0),
        maximumStockLevel: prod.maximumStockLevel || 1000,
        batchNumber: inv.batchNumber || '',
        expiryDate: inv.expiryDate || '',
        manufacturingDate: inv.manufacturingDate || '',
        lastRestockedDate: inv.lastRestockedDate || '',
        description: inv.remarks || inv.description || '',
        remarks: inv.remarks || '',
        status: inv.status || prod.status || 'Active',
        companyId: inv.companyId,
        ownerId: inv.ownerId,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      };
    });

    res.json(flatItems);
  } catch (err: any) {
    console.error('[Inventory] getInventory error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /inventory ───────────────────────────────────────────────────────────
export const createInventory = async (req: AuthRequest, res: Response) => {
  try {
    const {
      itemName,
      category,
      sku,
      barcode,
      subCategory,
      brand,
      unit,
      purchasePrice,
      sellingPrice,
      minimumQuantity,
      maximumStockLevel,
      reorderLevel,
      quantity,
      reservedStock,
      warehouse,
      storageLocation,
      supplier,
      batchNumber,
      expiryDate,
      manufacturingDate,
      lastRestockedDate,
      description,
      remarks,
      status
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────
    if (!itemName || !String(itemName).trim()) {
      return res.status(422).json({ message: 'Item name is required.' });
    }
    if (!category || !String(category).trim()) {
      return res.status(422).json({ message: 'Category is required.' });
    }

    const companyId = req.companyId;
    const ownerId = req.userId;

    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }

    // Auto-generate SKU if not provided
    const effectiveSku = sku && String(sku).trim()
      ? String(sku).trim()
      : `SKU-${Date.now()}`;

    // ── Check if product with this SKU already exists for this company ─
    let product = await Product.findOne({ sku: effectiveSku, companyId });

    if (!product) {
      product = new Product({
        productName: String(itemName).trim(),
        sku: effectiveSku,
        barcode: barcode || effectiveSku,
        category: String(category).trim(),
        subCategory: subCategory || 'General',
        brand: brand || '',
        unit: unit || 'Pieces',
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        minimumStockLevel: Number(minimumQuantity) || 0,
        maximumStockLevel: Number(maximumStockLevel) || 1000,
        reorderLevel: Number(reorderLevel) || 10,
        status: status || 'Active',
        companyId,
        ownerId,
        createdBy: req.userId
      });
      await product.save();
    }

    // ── Create the Inventory document ─────────────────────────────────
    const inventory = new Inventory({
      productId: product._id,
      quantity: Number(quantity) || 0,
      reservedStock: Number(reservedStock) || 0,
      warehouse: warehouse || 'Primary Warehouse',
      storageLocation: storageLocation || 'Warehouse Floor',
      supplier: supplier && String(supplier).trim() ? String(supplier).trim() : 'General Supplier',
      batchNumber: batchNumber || '',
      expiryDate: expiryDate || '',
      manufacturingDate: manufacturingDate || '',
      lastRestockedDate: lastRestockedDate || '',
      remarks: remarks || description || '',
      status: status || 'Active',
      companyId,
      ownerId,
      // Legacy mirror fields for backward compatibility
      itemName: String(itemName).trim(),
      category: String(category).trim(),
      sku: effectiveSku,
      minimumQuantity: Number(minimumQuantity) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      description: remarks || description || ''
    });

    await inventory.save();

    const resultObj = {
      id: String(inventory._id),
      _id: String(inventory._id),
      productId: String(product._id),
      itemName: product.productName,
      category: product.category,
      sku: product.sku,
      barcode: product.barcode || '',
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      unit: product.unit || 'Pieces',
      warehouse: inventory.warehouse,
      storageLocation: inventory.storageLocation || '',
      supplier: inventory.supplier || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: inventory.quantity,
      reservedStock: inventory.reservedStock || 0,
      availableStock: (inventory.quantity || 0) - (inventory.reservedStock || 0),
      minimumQuantity: product.minimumStockLevel || 0,
      maximumStockLevel: product.maximumStockLevel || 1000,
      reorderLevel: product.reorderLevel || 10,
      batchNumber: inventory.batchNumber || '',
      expiryDate: inventory.expiryDate || '',
      manufacturingDate: inventory.manufacturingDate || '',
      lastRestockedDate: inventory.lastRestockedDate || '',
      description: inventory.remarks || '',
      remarks: inventory.remarks || '',
      status: product.status || 'Active',
      companyId: inventory.companyId,
      ownerId: inventory.ownerId,
      createdAt: (inventory as any).createdAt,
      updatedAt: (inventory as any).updatedAt
    };

    res.status(201).json(resultObj);
  } catch (err: any) {
    console.error('[Inventory] createInventory error:', err.message);
    // E11000 = duplicate key (SKU conflict)
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An inventory item with this SKU already exists. Please use a different SKU.'
      });
    }
    res.status(400).json({ message: err.message });
  }
};

// ─── PUT /inventory/:id ────────────────────────────────────────────────────────
export const updateInventory = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }

    const inventory = await Inventory.findOne({ _id: req.params.id, companyId });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    const {
      itemName,
      category,
      sku,
      barcode,
      subCategory,
      brand,
      unit,
      purchasePrice,
      sellingPrice,
      minimumQuantity,
      maximumStockLevel,
      reorderLevel,
      quantity,
      reservedStock,
      warehouse,
      storageLocation,
      supplier,
      batchNumber,
      expiryDate,
      manufacturingDate,
      lastRestockedDate,
      description,
      remarks,
      status
    } = req.body;

    // Update the linked Product document
    if (inventory.productId) {
      const productUpdate: any = {};
      if (itemName !== undefined) productUpdate.productName = itemName;
      if (category !== undefined) productUpdate.category = category;
      if (sku !== undefined) productUpdate.sku = sku;
      if (barcode !== undefined) productUpdate.barcode = barcode;
      if (subCategory !== undefined) productUpdate.subCategory = subCategory;
      if (brand !== undefined) productUpdate.brand = brand;
      if (unit !== undefined) productUpdate.unit = unit;
      if (purchasePrice !== undefined) productUpdate.purchasePrice = Number(purchasePrice);
      if (sellingPrice !== undefined) productUpdate.sellingPrice = Number(sellingPrice);
      if (minimumQuantity !== undefined) productUpdate.minimumStockLevel = Number(minimumQuantity);
      if (maximumStockLevel !== undefined) productUpdate.maximumStockLevel = Number(maximumStockLevel);
      if (reorderLevel !== undefined) productUpdate.reorderLevel = Number(reorderLevel);
      if (status !== undefined) productUpdate.status = status;

      if (Object.keys(productUpdate).length > 0) {
        await Product.findByIdAndUpdate(inventory.productId, productUpdate, { new: true });
      }
    }

    // Update the Inventory document
    const inventoryUpdate: any = {};
    if (quantity !== undefined) inventoryUpdate.quantity = Number(quantity);
    if (reservedStock !== undefined) inventoryUpdate.reservedStock = Number(reservedStock);
    if (warehouse !== undefined) inventoryUpdate.warehouse = warehouse;
    if (storageLocation !== undefined) inventoryUpdate.storageLocation = storageLocation;
    if (supplier !== undefined) inventoryUpdate.supplier = supplier;
    if (batchNumber !== undefined) inventoryUpdate.batchNumber = batchNumber;
    if (expiryDate !== undefined) inventoryUpdate.expiryDate = expiryDate;
    if (manufacturingDate !== undefined) inventoryUpdate.manufacturingDate = manufacturingDate;
    if (lastRestockedDate !== undefined) inventoryUpdate.lastRestockedDate = lastRestockedDate;
    if (remarks !== undefined || description !== undefined) {
      inventoryUpdate.remarks = remarks || description;
      inventoryUpdate.description = remarks || description;
    }
    if (status !== undefined) inventoryUpdate.status = status;
    // Mirror legacy fields
    if (itemName !== undefined) inventoryUpdate.itemName = itemName;
    if (category !== undefined) inventoryUpdate.category = category;
    if (sku !== undefined) inventoryUpdate.sku = sku;
    if (minimumQuantity !== undefined) inventoryUpdate.minimumQuantity = Number(minimumQuantity);
    if (purchasePrice !== undefined) inventoryUpdate.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) inventoryUpdate.sellingPrice = Number(sellingPrice);

    const updatedInventory = await Inventory.findByIdAndUpdate(
      inventory._id,
      inventoryUpdate,
      { new: true }
    ).populate('productId');

    const prod: any = updatedInventory?.productId || {};
    const resultObj = {
      id: String(updatedInventory?._id),
      _id: String(updatedInventory?._id),
      productId: prod._id ? String(prod._id) : '',
      itemName: prod.productName || updatedInventory?.itemName || '',
      category: prod.category || updatedInventory?.category || '',
      sku: prod.sku || updatedInventory?.sku || '',
      unit: prod.unit || 'Pieces',
      warehouse: updatedInventory?.warehouse || '',
      storageLocation: updatedInventory?.storageLocation || '',
      supplier: updatedInventory?.supplier || '',
      purchasePrice: prod.purchasePrice !== undefined ? prod.purchasePrice : (updatedInventory?.purchasePrice || 0),
      sellingPrice: prod.sellingPrice !== undefined ? prod.sellingPrice : (updatedInventory?.sellingPrice || 0),
      quantity: updatedInventory?.quantity || 0,
      reservedStock: updatedInventory?.reservedStock || 0,
      availableStock: (updatedInventory?.quantity || 0) - (updatedInventory?.reservedStock || 0),
      minimumQuantity: prod.minimumStockLevel !== undefined ? prod.minimumStockLevel : (updatedInventory?.minimumQuantity || 0),
      maximumStockLevel: prod.maximumStockLevel || 1000,
      batchNumber: updatedInventory?.batchNumber || '',
      expiryDate: updatedInventory?.expiryDate || '',
      manufacturingDate: updatedInventory?.manufacturingDate || '',
      lastRestockedDate: updatedInventory?.lastRestockedDate || '',
      description: updatedInventory?.remarks || '',
      remarks: updatedInventory?.remarks || '',
      status: updatedInventory?.status || prod.status || 'Active',
      companyId: updatedInventory?.companyId,
      ownerId: updatedInventory?.ownerId,
      createdAt: (updatedInventory as any)?.createdAt,
      updatedAt: (updatedInventory as any)?.updatedAt
    };

    res.json(resultObj);
  } catch (err: any) {
    console.error('[Inventory] updateInventory error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// ─── DELETE /inventory/:id ─────────────────────────────────────────────────────
export const deleteInventory = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: 'Access denied: Company context required.' });
    }

    const deleted = await Inventory.findOneAndDelete({ _id: req.params.id, companyId });
    if (!deleted) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    // Also delete the associated Product document
    if (deleted.productId) {
      await Product.findByIdAndDelete(deleted.productId);
    }

    res.json({ message: 'Item deleted successfully.' });
  } catch (err: any) {
    console.error('[Inventory] deleteInventory error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
