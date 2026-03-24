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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const prisma_1 = __importDefault(require("../../lib/prisma"));
const pricingCache = new Map();
const PRICING_TTL_MS = 5 * 60 * 1000; // 5 minutes
function getCustomerPricingInfo(userId, selectedCustomerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = `${userId}_${selectedCustomerId !== null && selectedCustomerId !== void 0 ? selectedCustomerId : 'null'}`;
        const cached = pricingCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const cache = (data) => {
            pricingCache.set(cacheKey, { data, expiresAt: Date.now() + PRICING_TTL_MS });
            return data;
        };
        // If a specific customerID is provided (from store selection), use it
        if (selectedCustomerId) {
            const customer = yield prisma_1.default.cUSTOMERMASTER.findFirst({
                where: { CUSTOMERID: selectedCustomerId }
            });
            if (customer) {
                const priceGroup = yield prisma_1.default.pRICEGROUPMASTER.findUnique({
                    where: { PriceGroupID: customer.PRICEGROUPID || 1 }
                });
                return cache({
                    customerPresent: true,
                    customerId: customer.CUSTOMERID,
                    priceColumn: (priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn) || 'RetailPrice',
                    showPricing: true
                });
            }
        }
        // Fallback: try to find customer by userId
        const customer = yield prisma_1.default.cUSTOMERMASTER.findFirst({
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
        const priceGroup = yield prisma_1.default.pRICEGROUPMASTER.findUnique({
            where: { PriceGroupID: customer.PRICEGROUPID || 1 }
        });
        return cache({
            customerPresent: true,
            customerId: customer.CUSTOMERID,
            priceColumn: (priceGroup === null || priceGroup === void 0 ? void 0 : priceGroup.PriceColumn) || 'RetailPrice',
            showPricing: true
        });
    });
}
function getProductImage(productId) {
    return __awaiter(this, void 0, void 0, function* () {
        const productImage = yield prisma_1.default.productImages.findFirst({
            where: { ProductID: productId },
            select: {
                ImageID: true
            }
        });
        if (!productImage)
            return null;
        const imageData = yield prisma_1.default.imageMaster.findUnique({
            where: { ImageID: productImage.ImageID },
            select: {
                Url: true
            }
        });
        if (!(imageData === null || imageData === void 0 ? void 0 : imageData.Url))
            return null;
        // Prepend base URL if the URL is relative
        const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
        const imageUrl = imageData.Url;
        // Check if URL is already absolute (starts with http:// or https://)
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        // Prepend base URL to relative path
        return `${imageBaseUrl}${imageUrl}`;
    });
}
function getBatchProductImages(productIds) {
    return __awaiter(this, void 0, void 0, function* () {
        if (productIds.length === 0)
            return new Map();
        const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
        const productImages = yield prisma_1.default.productImages.findMany({
            where: { ProductID: { in: productIds } },
            select: { ProductID: true, ImageID: true },
        });
        const imageIds = productImages.map(pi => pi.ImageID);
        if (imageIds.length === 0)
            return new Map(productIds.map(id => [id, null]));
        const images = yield prisma_1.default.imageMaster.findMany({
            where: { ImageID: { in: imageIds } },
            select: { ImageID: true, Url: true },
        });
        const imageIdToUrl = new Map();
        images.forEach(img => {
            if (img.Url) {
                const url = img.Url.startsWith('http://') || img.Url.startsWith('https://')
                    ? img.Url
                    : `${imageBaseUrl}${img.Url}`;
                imageIdToUrl.set(img.ImageID, url);
            }
        });
        const result = new Map();
        productIds.forEach(id => result.set(id, null));
        productImages.forEach(pi => { var _a; return result.set(pi.ProductID, (_a = imageIdToUrl.get(pi.ImageID)) !== null && _a !== void 0 ? _a : null); });
        return result;
    });
}
function getExclusiveProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                OfferEnabled: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null, // null = don't show price
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing // Flag to indicate if pricing should be displayed
            });
        });
        return productsWithImages;
    });
}
function getCustomerPreferredProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        if (!customerId) {
            return [];
        }
        // Fetch product preferences for the customer, sorted by SortID
        const customerPreferences = yield prisma_1.default.customerProductPreferenceMaster.findMany({
            where: { CustomerID: customerId },
            orderBy: { SortID: 'asc' },
            select: { ProductID: true }
        });
        const productIds = customerPreferences.map((preference) => preference.ProductID);
        // Fetch product details for the preferred products
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                ProductID: { in: productIds }, // Filter by preferred product IDs
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            });
        });
        return productsWithImages;
    });
}
function getAllProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true, take = 500, skip = 0) {
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {})),
            take,
            skip,
            orderBy: { ProductID: 'asc' }
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            });
        });
        return productsWithImages;
    });
}
function getNewProducts(customerId_1, priceColumn_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, showPricing = true) {
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                IsNewProduct: 1,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn && showPricing ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            });
        });
        return productsWithImages;
    });
}
function getBestSellingProducts(customerId_1, priceColumn_1, sortOrderLimit_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, priceColumn, sortOrderLimit, showPricing = true) {
        const products = yield prisma_1.default.productMaster.findMany({
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
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(products.map((p) => p.ProductID));
        const productsWithImages = products.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: (priceColumn && showPricing) ? (product[priceColumn] || 0) : null,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1,
                showPricing
            });
        });
        return productsWithImages;
    });
}
function getCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
        const categories = yield prisma_1.default.productCategoryMaster.findMany({
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
        const catImgRows = yield prisma_1.default.productCategoryImages.findMany({
            where: { CategoryID: { in: categoryIds } },
            select: { CategoryID: true, ImageID: true }
        });
        const catImgIds = catImgRows.map(r => r.ImageID);
        const imgRows = catImgIds.length > 0 ? yield prisma_1.default.imageMaster.findMany({
            where: { ImageID: { in: catImgIds } },
            select: { ImageID: true, Url: true }
        }) : [];
        const imgMap = new Map(imgRows.map(r => [r.ImageID, r.Url]));
        const catImgMap = new Map(catImgRows.map(r => { var _a; return [r.CategoryID, (_a = imgMap.get(r.ImageID)) !== null && _a !== void 0 ? _a : null]; }));
        return categories.map(c => {
            const rawUrl = catImgMap.get(c.CategoryID);
            const categoryImage = rawUrl
                ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${imageBaseUrl}${rawUrl}`)
                : null;
            return { categoryId: c.CategoryID, categoryName: c.CategoryName, categoryImage };
        });
    });
}
// ...existing code...
function getSubCategoriesByCategoryId(categoryId) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
        // Fetch subcategories for the given categoryId
        const subCategories = yield prisma_1.default.productSubCategoryMaster.findMany({
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
        const subCatImgRows = yield prisma_1.default.productSubCategoryImages.findMany({
            where: { SubCategoryID: { in: subCategoryIds } },
            select: { SubCategoryID: true, ImageID: true }
        });
        const subCatImgIds = subCatImgRows.map(r => r.ImageID);
        const subImgRows = subCatImgIds.length > 0 ? yield prisma_1.default.imageMaster.findMany({
            where: { ImageID: { in: subCatImgIds } },
            select: { ImageID: true, Url: true }
        }) : [];
        const subImgUrlMap = new Map(subImgRows.map(r => [r.ImageID, r.Url]));
        const subCatImgMap = new Map(subCatImgRows.map(r => { var _a; return [r.SubCategoryID, (_a = subImgUrlMap.get(r.ImageID)) !== null && _a !== void 0 ? _a : null]; }));
        return subCategories.map(s => {
            const rawUrl = subCatImgMap.get(s.SubCategoryID);
            const subCategoryImage = rawUrl
                ? (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${imageBaseUrl}${rawUrl}`)
                : null;
            return { subCategoryId: s.SubCategoryID, subCategoryName: s.SubCategoryName, description: s.Description, subCategoryImage };
        });
    });
}
function getProductsBySubCategory(subCategoryId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                CatalogDefault: 1,
                SubCategoryID: subCategoryId,
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {})),
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? product[priceColumn] || 0 : '',
                catalogId: product.CatalogID,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1
            });
        });
        return productsWithImages;
    });
}
// Given a productId, find its CatalogID and return all products under that CatalogID
function getProductsByCatalogOfProduct(productId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find the product to get its CatalogID
        const source = yield prisma_1.default.productMaster.findUnique({
            where: { ProductID: productId },
            select: { CatalogID: true }
        });
        if (!source || !source.CatalogID)
            return [];
        const catalogId = source.CatalogID;
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                CatalogID: catalogId,
                CatalogDefault: 1
            },
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                catalogId: product.CatalogID,
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1
            });
        });
        return productsWithImages;
    });
}
// Returns products similar to a given product (by CategoryID). Excludes the source product.
function getSimilarProducts(productId, priceColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find the product to get its CategoryID
        const source = yield prisma_1.default.productMaster.findUnique({
            where: { ProductID: productId },
            select: { CategoryID: true }
        });
        if (!source || !source.CategoryID)
            return [];
        const categoryId = source.CategoryID;
        const catalogProducts = yield prisma_1.default.productMaster.findMany({
            where: {
                CatalogDefault: 1,
                CategoryID: categoryId,
                ProductID: { not: productId }
            },
            take: 50,
            select: Object.assign({ ProductID: true, ProductName: true, Units: true, UnitsOfMeasurement: true, CatalogID: true, MinimumQty: true }, (priceColumn ? { [priceColumn]: true } : {}))
        });
        // Fetch images for all products in a single batch
        const imageMap = yield getBatchProductImages(catalogProducts.map((p) => p.ProductID));
        const productsWithImages = catalogProducts.map((product) => {
            var _a;
            return ({
                productId: product.ProductID,
                productName: product.ProductName,
                productUnits: product.Units || 0,
                unitsOfMeasurement: product.UnitsOfMeasurement || '',
                price: priceColumn ? (product[priceColumn] || 0) : "",
                image: (_a = imageMap.get(product.ProductID)) !== null && _a !== void 0 ? _a : null,
                minimumOrderQuantity: product.MinimumQty || 1
            });
        });
        return productsWithImages;
    });
}
//# sourceMappingURL=index.js.map