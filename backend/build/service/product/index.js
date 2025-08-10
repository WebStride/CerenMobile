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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getCustomerPricingInfo(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const customer = yield prisma.cUSTOMERMASTER.findFirst({
            where: { USERID: userId }
        });
        if (!customer) {
            return {
                customerPresent: false,
                customerId: null,
                priceColumn: null
            };
        }
        const priceGroup = yield prisma.pRICEGROUPMASTER.findUnique({
            where: { PriceGroupID: customer.PRICEGROUPID || 1 }
        });
        return {
            customerPresent: true,
            customerId: customer.CUSTOMERID,
            priceColumn: (priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn) || 'RetailPrice' // Default to RetailPrice if no price group found
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
function getExclusiveProducts(customerId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                OfferEnabled: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })));
        return productsWithImages;
    });
}
function getCustomerPreferredProducts(customerId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
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
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })));
        return productsWithImages;
    });
}
function getAllProducts(customerId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })));
        return productsWithImages;
    });
}
function getNewProducts(customerId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const catalogProducts = yield prisma.productMaster.findMany({
            where: {
                IsNewProduct: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in parallel
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
            };
        })));
        return productsWithImages;
    });
}
function getBestSellingProducts(customerId, priceColumn, sortOrderLimit) {
    return __awaiter(this, void 0, void 0, function* () {
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
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        const productsWithImages = yield Promise.all(products.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: imageUrl
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
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true }, (priceColumn ? { [priceColumn]: true } : {})),
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
            };
        })));
        return productsWithImages;
    });
}
