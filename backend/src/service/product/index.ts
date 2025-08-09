import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCustomerPricingInfo(userId: number) {
    const customer = await prisma.cUSTOMERMASTER.findFirst({
        where: { USERID: userId }
    });

    if (!customer) {
        return {
            customerPresent: false,
            customerId: null,
            priceColumn: null
        };
    }

    const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
        where: { PriceGroupID: customer.PRICEGROUPID || 1 }
    });

    return {
        customerPresent: true,
        customerId: customer.CUSTOMERID,
        priceColumn: priceGroup?.PriceColumn || 'RetailPrice' // Default to RetailPrice if no price group found
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

export async function getExclusiveProducts(customerId: number | null, priceColumn: string | null) {
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
            ...(priceColumn ? { [priceColumn]: true } : {})
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
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })
    );

    return productsWithImages;
}


export async function getCustomerPreferredProducts(customerId: number | null, priceColumn: string | null) {
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
            ...(priceColumn ? { [priceColumn]: true } : {})
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
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })
    );

    return productsWithImages;
}


export async function getNewProducts(customerId: number | null, priceColumn: string | null) {
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
            ...(priceColumn ? { [priceColumn]: true } : {})
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
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })
    );

    return productsWithImages;
}
export async function getBestSellingProducts(customerId: number | null, priceColumn: string | null, sortOrderLimit: number) {
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
            ...(priceColumn ? { [priceColumn]: true } : {})

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
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
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
