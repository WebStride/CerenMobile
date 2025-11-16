import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get customer pricing info based on userId and optional selectedCustomerId
 * Priority: selectedCustomerId > userId lookup
 * @param userId - User ID from token
 * @param selectedCustomerId - Optional selected customer/store ID
 * @returns Pricing information including whether to show prices
 */
export async function getCustomerPricingInfo(userId: number, selectedCustomerId?: number | null) {
    console.log(`[getCustomerPricingInfo] userId: ${userId}, selectedCustomerId: ${selectedCustomerId}`);

    // If a specific customerID is provided (from store selection), use it
    if (selectedCustomerId) {
        const customer = await prisma.cUSTOMERMASTER.findFirst({
            where: { CUSTOMERID: selectedCustomerId }
        });

        if (customer) {
            const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
                where: { PriceGroupID: customer.PRICEGROUPID || 1 }
            });

            console.log(`[getCustomerPricingInfo] Found customer ${selectedCustomerId}, priceColumn: ${priceGroup?.PriceColumn}`);

            return {
                customerPresent: true,
                customerId: customer.CUSTOMERID,
                priceColumn: priceGroup?.PriceColumn || 'RetailPrice',
                showPricing: true // Show pricing when customer is selected
            };
        }
    }

    // Fallback: try to find customer by userId
    const customer = await prisma.cUSTOMERMASTER.findFirst({
        where: { USERID: userId }
    });

    if (!customer) {
        console.log(`[getCustomerPricingInfo] No customer found - catalog mode (no pricing)`);
        return {
            customerPresent: false,
            customerId: null,
            priceColumn: null,
            showPricing: false // Don't show pricing in catalog mode
        };
    }

    const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
        where: { PriceGroupID: customer.PRICEGROUPID || 1 }
    });

    console.log(`[getCustomerPricingInfo] Found customer via userId, priceColumn: ${priceGroup?.PriceColumn}`);

    return {
        customerPresent: true,
        customerId: customer.CUSTOMERID,
        priceColumn: priceGroup?.PriceColumn || 'RetailPrice',
        showPricing: true // Show pricing when customer exists
    };
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

    return imageData?.Url || null;
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

    // Fetch images for all products in parallel
    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null, // null = don't show price
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing // Flag to indicate if pricing should be displayed
            };
        })
    );

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

    // Fetch images for all products in parallel
    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            };
        })
    );

    return productsWithImages;
}

export async function getAllProducts(customerId: number | null, priceColumn: string | null, showPricing: boolean = true) {

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
        }
    });

    // Fetch images for all products in parallel
    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            };
        })
    );

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

    // Fetch images for all products in parallel
    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            };
        })
    );

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

    const productsWithImages = await Promise.all(
        products.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            };
        })
    );

    return productsWithImages;
}

export async function getCategories() {
    const categories = await prisma.productCategoryMaster.findMany({
        where: {
            Active: 1
        },
        select: {
            CategoryID: true,
            CategoryName: true
        }
    });

    const categoriesWithImages = await Promise.all(
        categories.map(async (category) => {
            const categoryImage = await prisma.productCategoryImages.findFirst({
                where: { CategoryID: category.CategoryID },
                select: {
                    ImageID: true
                }
            });

            let imageUrl = null;
            if (categoryImage) {
                const imageData = await prisma.imageMaster.findUnique({
                    where: { ImageID: categoryImage.ImageID },
                    select: {
                        Url: true
                    }
                });
                imageUrl = imageData?.Url;
            }

            return {
                categoryId: category.CategoryID,
                categoryName: category.CategoryName,
                categoryImage: imageUrl
            };
        })
    );

    return categoriesWithImages;
}




// ...existing code...

export async function getSubCategoriesByCategoryId(categoryId: number) {
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

    // Fetch images for all subcategories in parallel
    const subCategoriesWithImages = await Promise.all(
        subCategories.map(async (subCategory) => {
            const subCategoryImage = await prisma.productSubCategoryImages.findFirst({
                where: { SubCategoryID: subCategory.SubCategoryID },
                select: { ImageID: true }
            });

            let imageUrl = null;
            if (subCategoryImage) {
                const imageData = await prisma.imageMaster.findUnique({
                    where: { ImageID: subCategoryImage.ImageID },
                    select: { Url: true }
                });
                imageUrl = imageData?.Url || null;
            }

            return {
                subCategoryId: subCategory.SubCategoryID,
                subCategoryName: subCategory.SubCategoryName,
                description: subCategory.Description,
                subCategoryImage: imageUrl
            };
        })
    );

    return subCategoriesWithImages;
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

  const productsWithImages = await Promise.all(
    catalogProducts.map(async (product: any) => {
      const imageUrl = await getProductImage(product.ProductID);
      return {
        productId: product.ProductID,
        productName: product.ProductName,
        productUnits: product.Units || 0,
        unitsOfMeasurement: product.UnitsOfMeasurement || '',
        price: priceColumn ? product[priceColumn] || 0 : '',
        catalogId: product.CatalogID,  
        image: imageUrl,
        minimumOrderQuantity: product.MinimumQty || 1
      };
    })
  );

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

    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                catalogId: product.CatalogID,
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1
            };
        })
    );

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

    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product: any) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1
            };
        })
    );

    return productsWithImages;
}