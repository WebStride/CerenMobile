"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerPricingInfo = getCustomerPricingInfo;
exports.getExclusiveProducts = getExclusiveProducts;
exports.getCustomerPreferredProducts = getCustomerPreferredProducts;
exports.getAllProducts = getAllProducts;
exports.getNewProducts = getNewProducts;
exports.getBestSellingProducts = getBestSellingProducts;
exports.getCategories = getCategories;
exports.getSubCategoriesByCategoryId = getSubCategoriesByCategoryId;
exports.getProductsBySubCategory = getProductsBySubCategory;
exports.getProductsByCatalogOfProduct = getProductsByCatalogOfProduct;
exports.getSimilarProducts = getSimilarProducts;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get customer pricing info based on userId and optional selectedCustomerId
 * Priority: selectedCustomerId > userId lookup
 * @param userId - User ID from token
 * @param selectedCustomerId - Optional selected customer/store ID
 * @returns Pricing information including whether to show prices
 */
function getCustomerPricingInfo(userId, selectedCustomerId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[getCustomerPricingInfo] userId: ${userId}, selectedCustomerId: ${selectedCustomerId}`);
        // If a specific customerID is provided (from store selection), use it
        if (selectedCustomerId) {
            const customer = yield prisma.cUSTOMERMASTER.findFirst({
                where: { CUSTOMERID: selectedCustomerId }
            });
            if (customer) {
                const priceGroup = yield prisma.pRICEGROUPMASTER.findUnique({
                    where: { PriceGroupID: customer.PRICEGROUPID || 1 }
                });
                console.log(`[getCustomerPricingInfo] Found customer ${selectedCustomerId}, priceColumn: ${priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn}`);
                return {
                    customerPresent: true,
                    customerId: customer.CUSTOMERID,
                    priceColumn: (priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn) || 'RetailPrice',
                    showPricing: true // Show pricing when customer is selected
                };
            }
        }
        // Fallback: try to find customer by userId
        const customer = yield prisma.cUSTOMERMASTER.findFirst({
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
        const priceGroup = yield prisma.pRICEGROUPMASTER.findUnique({
            where: { PriceGroupID: customer.PRICEGROUPID || 1 }
        });
        console.log(`[getCustomerPricingInfo] Found customer via userId, priceColumn: ${priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn}`);
        return {
            customerPresent: true,
            customerId: customer.CUSTOMERID,
            priceColumn: (priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn) || 'RetailPrice',
            showPricing: true // Show pricing when customer exists
        };
    });
}
function getProductImage(productId) {
    return __awaiter(this, void 0, void 0, function* () {
        const productImage = yield prisma.productImages.findFirst({
            where: { ProductID: productId },
            select: {
                ImageID: true
            }
        });
        if (!productImage)
            return null;
        const imageData = yield prisma.imageMaster.findUnique({
            where: { ImageID: productImage.ImageID },
            select: {
                Url: true
            }
        });
        return (imageData === null || imageData === void 0 ? void 0 : imageData.Url) || null;
    });
}
function getExclusiveProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                OfferEnabled: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
function getCustomerPreferredProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        if (!customerId) {
            return [];
        }
        // Fetch product preferences for the customer, sorted by SortID
        const customerPreferences = yield prisma.customerProductPreferenceMaster.findMany({
            where: { CustomerID: customerId },
            orderBy: { SortID: 'asc' },
            select: { ProductID: true }
        });
        const productIds = customerPreferences.map((preference) => preference.ProductID);
        // Fetch product details for the preferred products
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                ProductID: { in: productIds }, // Filter by preferred product IDs
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
function getAllProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
function getNewProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                IsNewProduct: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
function getBestSellingProducts(customerId_1, priceColumn_1, sortOrderLimit_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, sortOrderLimit, showPricing = true) {
        const products = yield prisma.productMaster.findMany({
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
            select: Object.assign(Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true }, (priceColumn ? { [priceColumn]: true } : {})), { MinimumQty: true })
        });
        const productsWithImages = yield Promise.all(products.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
function getCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        const categories = yield prisma.productCategoryMaster.findMany({
            where: {
                Active: 1
            },
            select: {
                CategoryID: true,
                CategoryName: true
            }
        });
        const categoriesWithImages = yield Promise.all(categories.map((category) => __awaiter(this, void 0, void 0, function* () {
            const categoryImage = yield prisma.productCategoryImages.findFirst({
                where: { CategoryID: category.CategoryID },
                select: {
                    ImageID: true
                }
            });
            let imageUrl = null;
            if (categoryImage) {
                const imageData = yield prisma.imageMaster.findUnique({
                    where: { ImageID: categoryImage.ImageID },
                    select: {
                        Url: true
                    }
                });
                imageUrl = imageData === null || imageData === void 0 ? void 0 : imageData.Url;
            }
            return {
                categoryId: category.CategoryID,
                categoryName: category.CategoryName,
                categoryImage: imageUrl
            };
        })));
        return categoriesWithImages;
    });
}
// ...existing code...
function getSubCategoriesByCategoryId(categoryId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch subcategories for the given categoryId
        const subCategories = yield prisma.productSubCategoryMaster.findMany({
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
        const subCategoriesWithImages = yield Promise.all(subCategories.map((subCategory) => __awaiter(this, void 0, void 0, function* () {
            const subCategoryImage = yield prisma.productSubCategoryImages.findFirst({
                where: { SubCategoryID: subCategory.SubCategoryID },
                select: { ImageID: true }
            });
            let imageUrl = null;
            if (subCategoryImage) {
                const imageData = yield prisma.imageMaster.findUnique({
                    where: { ImageID: subCategoryImage.ImageID },
                    select: { Url: true }
                });
                imageUrl = (imageData === null || imageData === void 0 ? void 0 : imageData.Url) || null;
            }
            return {
                subCategoryId: subCategory.SubCategoryID,
                subCategoryName: subCategory.SubCategoryName,
                description: subCategory.Description,
                subCategoryImage: imageUrl
            };
        })));
        return subCategoriesWithImages;
    });
}
function getProductsBySubCategory(subCategoryId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                CatalogDefault: 1,
                SubCategoryID: subCategoryId,
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {})),
        });
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
// Given a productId, find its CatalogID and return all products under that CatalogID
function getProductsByCatalogOfProduct(productId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find the product to get its CatalogID
        const source = yield prisma.productMaster.findUnique({
            where: { ProductID: productId },
            select: { CatalogID: true }
        });
        if (!source || !source.CatalogID)
            return [];
        const catalogId = source.CatalogID;
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                CatalogID: catalogId,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
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
        })));
        return productsWithImages;
    });
}
// Returns products similar to a given product (by CategoryID). Excludes the source product.
function getSimilarProducts(productId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find the product to get its CategoryID
        const source = yield prisma.productMaster.findUnique({
            where: { ProductID: productId },
            select: { CategoryID: true }
        });
        if (!source || !source.CategoryID)
            return [];
        const categoryId = source.CategoryID;
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                CatalogDefault: 1,
                CategoryID: categoryId,
                ProductID: { not: productId }
            },
            take: 50,
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl,
                minimumOrderQuantity: product.MinimumQty || 1
            };
        })));
        return productsWithImages;
    });
}
