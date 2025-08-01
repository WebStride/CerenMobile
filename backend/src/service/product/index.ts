import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCustomerPricingInfo(userId: number) {
    const customer = await prisma.cUSTOMERMASTER.findFirst({
        where: { USERID: userId }
    });
    
    if (!customer) {
        throw new Error('Customer not found');
    }

    const priceGroup = await prisma.pRICEGROUPMASTER.findUnique({
        where: {  PriceGroupID: customer.PRICEGROUPID || 1 }
    });


    return {
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

export async function getExclusiveProducts(customerId: number, priceColumn: string) {
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
            [priceColumn]: true,
            CatalogID: true
        }
    });

    // Fetch images for all products in parallel
    const productsWithImages = await Promise.all(
        catalogProducts.map(async (product) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: product[priceColumn] || 0,
                image: imageUrl
            };
        })
    );

    return productsWithImages;
}

export async function getBestSellingProducts(customerId: number, priceColumn: string, sortOrderLimit: number) {
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
            [priceColumn]: true
        }
    });

    const productsWithImages = await Promise.all(
        products.map(async (product) => {
            const imageUrl = await getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: product[priceColumn] || 0,
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
