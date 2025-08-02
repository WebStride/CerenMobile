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
exports.getBestSellingProducts = getBestSellingProducts;
exports.getCategories = getCategories;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getCustomerPricingInfo(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const customer = yield prisma.cUSTOMERMASTER.findFirst({
            where: { USERID: userId }
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const priceGroup = yield prisma.pRICEGROUPMASTER.findUnique({
            where: { PriceGroupID: customer.PRICEGROUPID || 1 }
        });
        return {
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
        const productsWithImages = yield Promise.all(catalogProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: product[priceColumn] || 0,
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
            select: {
                ProductID: true,
                ProductName: true,
                Units: true,
                UnitsOfMeasurement: true,
                [priceColumn]: true
            }
        });
        const productsWithImages = yield Promise.all(products.map((product) => __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield getProductImage(product.ProductID);
            return {
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: product[priceColumn] || 0,
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
