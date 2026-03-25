import prisma from '../../lib/prisma';

const pricingCache = new Map<string, { data: any; expiresAt: number }>();
const PRICING_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCustomerPricingInfo(userId: number, selectedCustomerId?: number | null) {
    const cacheKey = `${userId}_${selectedCustomerId ?? 'null'}`;
    const cached = pricingCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }

    const cache = (data: any) => {
        pricingCache.set(cacheKey, { data, expiresAt: Date.now() + PRICING_TTL_MS });
        return data;
    };

    // If a specific customerID is provided (from store selection), use it
    if (selectedCustomerId) {
        const customer = await prisma.cUSTOMERMASTER.findFirst({
            where: { CUSTOMERID: selectedCustomerId }
        });

        if (customer) {
            const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
                where: { PriceGroupID: customer.PRICEGROUPID || 1 }
            });

            return cache({
                customerPresent: true,
                customerId: customer.CUSTOMERID,
                priceColumn: priceGroup?.PriceColumn || 'RetailPrice',
                showPricing: true
            });
        }
    }

    // Fallback: try to find customer by userId
    const customer = await prisma.cUSTOMERMASTER.findFirst({
        where: { USERID: userId }
    });

    if (!customer) {
        return cache({
            customerPresent: false,
            customerId: null,
            priceColumn: null,
            showPricing: false
        });
    }

    const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
        where: { PriceGroupID: customer.PRICEGROUPID || 1 }
    });

    return cache({
        customerPresent: true,
        customerId: customer.CUSTOMERID,
        priceColumn: priceGroup?.PriceColumn || 'RetailPrice',
        showPricing: true
    });
}

async function getProductImage(productId: number) {
    const productImage = await prisma.productImages.findFirst({
        where: { ProductID: productId },
        select: {
            ImageID: true
        }
    });

    if (!productImage) return null;

    const imageData = await prisma.imageMaster.findUnique({
        where: { ImageID: productImage.ImageID },
        select: {
            Url: true
        }
    });

    if (!imageData?.Url) return null;
    
    // Prepend base URL if the URL is relative
    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
    const imageUrl = imageData.Url;
    
    // Check if URL is already absolute (starts with http:// or https://)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Prepend base URL to relative path
    return `${imageBaseUrl}${imageUrl}`;
}

async function getBatchProductImages(productIds: number[]): Promise<Map<number, string | null>> {
    if (productIds.length === 0) return new Map();
    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';

    const productImages = await prisma.productImages.findMany({
        where: { ProductID: { in: productIds } },
        select: { ProductID: true, ImageID: true },
    });

    const imageIds = productImages.map(pi => pi.ImageID);
    if (imageIds.length === 0) return new Map(productIds.map(id => [id, null]));

    const images = await prisma.imageMaster.findMany({
        where: { ImageID: { in: imageIds } },
        select: { ImageID: true, Url: true },
    });

    const imageIdToUrl = new Map<number, string>();
    images.forEach(img => {
        if (img.Url) {
            const url = img.Url.startsWith('http://') || img.Url.startsWith('https://')
                ? img.Url
                : `${imageBaseUrl}${img.Url}`;
            imageIdToUrl.set(img.ImageID, url);
        }
    });

    const result = new Map<number, string | null>();
    productIds.forEach(id => result.set(id, null));
    productImages.forEach(pi => result.set(pi.ProductID, imageIdToUrl.get(pi.ImageID) ?? null));
    return result;
}

export async function getExclusiveProducts(customerId: number | null, priceColumn: string | null, showPricing: boolean = true) {
    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            OfferEnabled: 1,
            CatalogDefault: 1
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn && showPricing ? { [priceColumn]: true } : {})
        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null, // null = don't show price
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1,
        showPricing // Flag to indicate if pricing should be displayed
    }));

    return productsWithImages;
}


export async function getCustomerPreferredProducts(customerId: number | null, priceColumn: string | null, showPricing: boolean = true) {
    if (!customerId) {
        return [];
    }

    // Fetch product preferences for the customer, sorted by SortID
    const customerPreferences = await prisma.customerProductPreferenceMaster.findMany({
        where: { CustomerID: customerId },
        orderBy: { SortID: 'asc' },
        select: { ProductID: true }
    });

    const productIds = customerPreferences.map((preference) => preference.ProductID);

    // Fetch product details for the preferred products
    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            ProductID: { in: productIds }, // Filter by preferred product IDs
            CatalogDefault: 1
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn && showPricing ? { [priceColumn]: true } : {})
        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1,
        showPricing
    }));

    return productsWithImages;
}

export async function getAllProducts(customerId: number | null, priceColumn: string | null, showPricing: boolean = true, take = 500, skip = 0) {

    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            CatalogDefault: 1
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn && showPricing ? { [priceColumn]: true } : {})
        },
        take,
        skip,
        orderBy: { ProductID: 'asc' }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1,
        showPricing
    }));

    return productsWithImages;
}


export async function getNewProducts(customerId: number | null, priceColumn: string | null, showPricing: boolean = true) {
    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            IsNewProduct: 1,
            CatalogDefault: 1
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn && showPricing ? { [priceColumn]: true } : {})
        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1,
        showPricing
    }));

    return productsWithImages;
}
export async function getBestSellingProducts(customerId: number | null, priceColumn: string | null, sortOrderLimit: number, showPricing: boolean = true) {
    const products = await prisma.productMaster.findMany({
        where: {
            Active: 1,
            SortOrder: {
                lte: sortOrderLimit,
                not: null
            }
        },
        orderBy: {
            SortOrder: 'asc'
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            ...(priceColumn ? { [priceColumn]: true } : {}),
            MinimumQty : true

        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(products.map((p: any) => p.ProductID));
    const productsWithImages = products.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1,
        showPricing
    }));

    return productsWithImages;
}

export async function getCategories() {
    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
    
    const categories = await prisma.productCategoryMaster.findMany({
        where: {
            Active: 1
        },
        select: {
            CategoryID: true,
            CategoryName: true
        }
    });

    // Batch fetch: 3 queries instead of 2N+1
    const categoryIds = categories.map(c => c.CategoryID);
    const catImgRows = await prisma.productCategoryImages.findMany({
        where: { CategoryID: { in: categoryIds } },
        select: { CategoryID: true, ImageID: true }
    });
    const catImgIds = catImgRows.map(r => r.ImageID);
    const imgRows = catImgIds.length > 0 ? await prisma.imageMaster.findMany({
        where: { ImageID: { in: catImgIds } },
        select: { ImageID: true, Url: true }
    }) : [];
    const imgMap = new Map(imgRows.map(r => [r.ImageID, r.Url]));
    const catImgMap = new Map(catImgRows.map(r => [r.CategoryID, imgMap.get(r.ImageID) ?? null]));

    return categories.map(c => {
        const rawUrl = catImgMap.get(c.CategoryID);
        const categoryImage = rawUrl
            ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${imageBaseUrl}${rawUrl}`)
            : null;
        return { categoryId: c.CategoryID, categoryName: c.CategoryName, categoryImage };
    });
}




// ...existing code...

export async function getSubCategoriesByCategoryId(categoryId: number) {
    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
    
    // Fetch subcategories for the given categoryId
    const subCategories = await prisma.productSubCategoryMaster.findMany({
        where: {
            CategoryID: categoryId,
            Active: 1
        },
        select: {
            SubCategoryID: true,
            SubCategoryName: true,
            Description: true
        }
    });

    // Batch fetch: 3 queries instead of 2N queries
    const subCategoryIds = subCategories.map(s => s.SubCategoryID);
    const subCatImgRows = await prisma.productSubCategoryImages.findMany({
        where: { SubCategoryID: { in: subCategoryIds } },
        select: { SubCategoryID: true, ImageID: true }
    });
    const subCatImgIds = subCatImgRows.map(r => r.ImageID);
    const subImgRows = subCatImgIds.length > 0 ? await prisma.imageMaster.findMany({
        where: { ImageID: { in: subCatImgIds } },
        select: { ImageID: true, Url: true }
    }) : [];
    const subImgUrlMap = new Map(subImgRows.map(r => [r.ImageID, r.Url]));
    const subCatImgMap = new Map(subCatImgRows.map(r => [r.SubCategoryID, subImgUrlMap.get(r.ImageID) ?? null]));

    return subCategories.map(s => {
        const rawUrl = subCatImgMap.get(s.SubCategoryID);
        const subCategoryImage = rawUrl
            ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${imageBaseUrl}${rawUrl}`)
            : null;
        return { subCategoryId: s.SubCategoryID, subCategoryName: s.SubCategoryName, description: s.Description, subCategoryImage };
    });
}





export async function getProductsBySubCategory(
  subCategoryId: number,
  priceColumn: string | null
) {
  const catalogProducts = await prisma.productMaster.findMany({
    where: {
      CatalogDefault: 1,
      SubCategoryID: subCategoryId,
    },
    select: {
      ProductID: true,
      ProductName: true,
      Units: true,
      UnitsOfMeasurement: true,
      CatalogID: true,
      MinimumQty : true,
      ...(priceColumn ? { [priceColumn]: true } : {}),
    },
  });

  // Fetch images for all products in a single batch
  const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
  const productsWithImages = catalogProducts.map((product: any) => ({
    productId: product.ProductID,
    productName: product.ProductName,
    productUnits: product.Units || 0,
    unitsOfMeasurement: product.UnitsOfMeasurement || '',
    price: priceColumn ? product[priceColumn] || 0 : '',
    catalogId: product.CatalogID,
    image: imageMap.get(product.ProductID) ?? null,
    minimumOrderQuantity: product.MinimumQty || 1
  }));

  return productsWithImages;
}

// Given a productId, find its CatalogID and return all products under that CatalogID
export async function getProductsByCatalogOfProduct(productId: number, priceColumn: string | null) {
    // Find the product to get its CatalogID
    const source = await prisma.productMaster.findUnique({
        where: { ProductID: productId },
        select: { CatalogID: true }
    });

    if (!source || !source.CatalogID) return [];

    const catalogId = source.CatalogID;

    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            CatalogID: catalogId,
            CatalogDefault: 1
        },
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn ? { [priceColumn]: true } : {})
        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: priceColumn ? (product[priceColumn] || 0) : "",
        catalogId: product.CatalogID,
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1
    }));

    return productsWithImages;
}

// Returns products similar to a given product (by CategoryID). Excludes the source product.
export async function getSimilarProducts(productId: number, priceColumn: string | null) {
    // Find the product to get its CategoryID
    const source = await prisma.productMaster.findUnique({
        where: { ProductID: productId },
        select: { CategoryID: true }
    });

    if (!source || !source.CategoryID) return [];

    const categoryId = source.CategoryID;

    const catalogProducts = await prisma.productMaster.findMany({
        where: {
            CatalogDefault: 1,
            CategoryID: categoryId,
            ProductID: { not: productId }
        },
        take: 50,
        select: {
            ProductID: true,
            ProductName: true,
            Units: true,
            UnitsOfMeasurement: true,
            CatalogID: true,
            MinimumQty: true,
            ...(priceColumn ? { [priceColumn]: true } : {})
        }
    });

    // Fetch images for all products in a single batch
    const imageMap = await getBatchProductImages(catalogProducts.map((p: any) => p.ProductID));
    const productsWithImages = catalogProducts.map((product: any) => ({
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: priceColumn ? (product[priceColumn] || 0) : "",
        image: imageMap.get(product.ProductID) ?? null,
        minimumOrderQuantity: product.MinimumQty || 1
    }));

    return productsWithImages;
}