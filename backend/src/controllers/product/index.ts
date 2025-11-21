import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
    getCustomerPricingInfo,
    getExclusiveProducts,
    getBestSellingProducts,
    getCategories,
    getNewProducts,
    getCustomerPreferredProducts,
    getAllProducts,
    getSubCategoriesByCategoryId,
    getProductsBySubCategory
} from '../../service/product';
import { getProductsByCatalogOfProduct } from '../../service/product';
import { getSimilarProducts } from '../../service/product';

export async function getExclusiveProductsList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get selected customerID from query param or header (from store selection)
        const selectedCustomerId = req.query.customerId 
            ? parseInt(req.query.customerId as string) 
            : req.headers['x-customer-id'] 
            ? parseInt(req.headers['x-customer-id'] as string)
            : null;

        console.log(`[getExclusiveProductsList] userId: ${req.user.userId}, selectedCustomerId: ${selectedCustomerId}`);

        const { customerId, priceColumn, showPricing } = await getCustomerPricingInfo(
            parseInt(req.user.userId), 
            selectedCustomerId
        );
        
        const products = await getExclusiveProducts(customerId, priceColumn, showPricing);

        res.json({
            success: true,
            products,
            showPricing, // Let frontend know whether to display prices
            customerId   // Return which customer context is being used
        });
    } catch (error: any) {
        console.error('Error fetching exclusive products:', error);
        res.status(500).json({
            error: 'Failed to fetch exclusive products',
            details: error.message
        });
    }
}


export async function newProductsList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const selectedCustomerId = req.query.customerId 
            ? parseInt(req.query.customerId as string) 
            : req.headers['x-customer-id'] 
            ? parseInt(req.headers['x-customer-id'] as string)
            : null;

        const { customerId, priceColumn, showPricing } = await getCustomerPricingInfo(
            parseInt(req.user.userId), 
            selectedCustomerId
        );
        
        const products = await getNewProducts(customerId, priceColumn, showPricing);

        res.json({
            success: true,
            products,
            showPricing,
            customerId
        });
    } catch (error: any) {
        console.error('Error fetching exclusive products:', error);
        res.status(500).json({
            error: 'Failed to fetch exclusive products',
            details: error.message
        });
    }
}

export async function allProductsList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const selectedCustomerId = req.query.customerId 
            ? parseInt(req.query.customerId as string) 
            : req.headers['x-customer-id'] 
            ? parseInt(req.headers['x-customer-id'] as string)
            : null;

        const { customerId, priceColumn, showPricing } = await getCustomerPricingInfo(
            parseInt(req.user.userId), 
            selectedCustomerId
        );
        
        const products = await getAllProducts(customerId, priceColumn, showPricing);

        res.json({
            success: true,
            products,
            showPricing,
            customerId
        });
    } catch (error: any) {
        console.error('Error fetching exclusive products:', error);
        res.status(500).json({
            error: 'Failed to fetch exclusive products',
            details: error.message
        });
    }
}


export async function buyAgainProductsList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const selectedCustomerId = req.query.customerId 
            ? parseInt(req.query.customerId as string) 
            : req.headers['x-customer-id'] 
            ? parseInt(req.headers['x-customer-id'] as string)
            : null;

        const { customerId, priceColumn, showPricing } = await getCustomerPricingInfo(
            parseInt(req.user.userId), 
            selectedCustomerId
        );
        
        const products = await getCustomerPreferredProducts(customerId, priceColumn, showPricing);

        res.json({
            success: true,
            products,
            showPricing,
            customerId
        });
    } catch (error: any) {
        console.error('Error fetching exclusive products:', error);
        res.status(500).json({
            error: 'Failed to fetch exclusive products',
            details: error.message
        });
    }
}

export async function getBestSelling(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const sortOrderLimit = parseInt(req.query.limit as string) || 10;
        
        const selectedCustomerId = req.query.customerId 
            ? parseInt(req.query.customerId as string) 
            : req.headers['x-customer-id'] 
            ? parseInt(req.headers['x-customer-id'] as string)
            : null;

        const { customerId, priceColumn, showPricing } = await getCustomerPricingInfo(
            parseInt(req.user.userId), 
            selectedCustomerId
        );
        
        const products = await getBestSellingProducts(customerId, priceColumn, sortOrderLimit, showPricing);

        res.json({
            success: true,
            products,
            showPricing,
            customerId
        });
    } catch (error: any) {
        console.error('Error fetching best selling products:', error);
        res.status(500).json({
            error: 'Failed to fetch best selling products',
            details: error.message
        });
    }
}

export async function getCategoryList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const categories = await getCategories();

        res.json({
            success: true,
            categories
        });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            details: error.message
        });
    }
}

export async function getSubCategories(req: Request, res: Response) {
    try {
        const categoryId = parseInt(req.params.categoryId);
        if (isNaN(categoryId)) {
            return res.status(400).json({ error: 'Invalid categoryId' });
        }

        const subCategories = await getSubCategoriesByCategoryId(categoryId);

        res.json({
            success: true,
            subCategories
        });
    } catch (error: any) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({
            error: 'Failed to fetch subcategories',
            details: error.message
        });
    }
}



export async function productsBySubCategory(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subCategoryId = parseInt(req.params.subCategoryId);
    if (isNaN(subCategoryId)) {
      return res.status(400).json({ error: 'Invalid subCategoryId' });
    }

    const { customerId, priceColumn } = await getCustomerPricingInfo(parseInt(req.user.userId));
    const products = await getProductsBySubCategory(subCategoryId, priceColumn);

    res.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('Error fetching products by subcategory:', error);
    res.status(500).json({
      error: 'Failed to fetch products by subcategory',
      details: error.message,
    });
  }
}

export async function productsByCatalog(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' });

        const { customerId, priceColumn } = await getCustomerPricingInfo(parseInt(req.user.userId));
        const products = await getProductsByCatalogOfProduct(productId, priceColumn);

        res.json({ success: true, products });
    } catch (error: any) {
        console.error('Error fetching products by catalog:', error);
        res.status(500).json({ error: 'Failed to fetch products by catalog', details: error.message });
    }
}

export async function similarProductsList(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' });

        const { customerId, priceColumn } = await getCustomerPricingInfo(parseInt(req.user.userId));
        const products = await getSimilarProducts(productId, priceColumn);

        res.json({ success: true, products });
    } catch (error: any) {
        console.error('Error fetching similar products:', error);
        res.status(500).json({ error: 'Failed to fetch similar products', details: error.message });
    }
}