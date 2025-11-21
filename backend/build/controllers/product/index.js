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
exports.getExclusiveProductsList = getExclusiveProductsList;
exports.newProductsList = newProductsList;
exports.allProductsList = allProductsList;
exports.buyAgainProductsList = buyAgainProductsList;
exports.getBestSelling = getBestSelling;
exports.getCategoryList = getCategoryList;
exports.getSubCategories = getSubCategories;
exports.productsBySubCategory = productsBySubCategory;
exports.productsByCatalog = productsByCatalog;
exports.similarProductsList = similarProductsList;
const product_1 = require("../../service/product");
const product_2 = require("../../service/product");
const product_3 = require("../../service/product");
function getExclusiveProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get selected customerID from query param or header (from store selection)
            const selectedCustomerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : req.headers['x-customer-id']
                    ? parseInt(req.headers['x-customer-id'])
                    : null;
            console.log(`[getExclusiveProductsList] userId: ${req.user.userId}, selectedCustomerId: ${selectedCustomerId}`);
            const { customerId, priceColumn, showPricing } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId), selectedCustomerId);
            const products = yield (0, product_1.getExclusiveProducts)(customerId, priceColumn, showPricing);
            res.json({
                success: true,
                products,
                showPricing, // Let frontend know whether to display prices
                customerId // Return which customer context is being used
            });
        }
        catch (error) {
            console.error('Error fetching exclusive products:', error);
            res.status(500).json({
                error: 'Failed to fetch exclusive products',
                details: error.message
            });
        }
    });
}
function newProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const selectedCustomerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : req.headers['x-customer-id']
                    ? parseInt(req.headers['x-customer-id'])
                    : null;
            const { customerId, priceColumn, showPricing } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId), selectedCustomerId);
            const products = yield (0, product_1.getNewProducts)(customerId, priceColumn, showPricing);
            res.json({
                success: true,
                products,
                showPricing,
                customerId
            });
        }
        catch (error) {
            console.error('Error fetching exclusive products:', error);
            res.status(500).json({
                error: 'Failed to fetch exclusive products',
                details: error.message
            });
        }
    });
}
function allProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const selectedCustomerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : req.headers['x-customer-id']
                    ? parseInt(req.headers['x-customer-id'])
                    : null;
            const { customerId, priceColumn, showPricing } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId), selectedCustomerId);
            const products = yield (0, product_1.getAllProducts)(customerId, priceColumn, showPricing);
            res.json({
                success: true,
                products,
                showPricing,
                customerId
            });
        }
        catch (error) {
            console.error('Error fetching exclusive products:', error);
            res.status(500).json({
                error: 'Failed to fetch exclusive products',
                details: error.message
            });
        }
    });
}
function buyAgainProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const selectedCustomerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : req.headers['x-customer-id']
                    ? parseInt(req.headers['x-customer-id'])
                    : null;
            const { customerId, priceColumn, showPricing } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId), selectedCustomerId);
            const products = yield (0, product_1.getCustomerPreferredProducts)(customerId, priceColumn, showPricing);
            res.json({
                success: true,
                products,
                showPricing,
                customerId
            });
        }
        catch (error) {
            console.error('Error fetching exclusive products:', error);
            res.status(500).json({
                error: 'Failed to fetch exclusive products',
                details: error.message
            });
        }
    });
}
function getBestSelling(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const sortOrderLimit = parseInt(req.query.limit) || 10;
            const selectedCustomerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : req.headers['x-customer-id']
                    ? parseInt(req.headers['x-customer-id'])
                    : null;
            const { customerId, priceColumn, showPricing } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId), selectedCustomerId);
            const products = yield (0, product_1.getBestSellingProducts)(customerId, priceColumn, sortOrderLimit, showPricing);
            res.json({
                success: true,
                products,
                showPricing,
                customerId
            });
        }
        catch (error) {
            console.error('Error fetching best selling products:', error);
            res.status(500).json({
                error: 'Failed to fetch best selling products',
                details: error.message
            });
        }
    });
}
function getCategoryList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const categories = yield (0, product_1.getCategories)();
            res.json({
                success: true,
                categories
            });
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                error: 'Failed to fetch categories',
                details: error.message
            });
        }
    });
}
function getSubCategories(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const categoryId = parseInt(req.params.categoryId);
            if (isNaN(categoryId)) {
                return res.status(400).json({ error: 'Invalid categoryId' });
            }
            const subCategories = yield (0, product_1.getSubCategoriesByCategoryId)(categoryId);
            res.json({
                success: true,
                subCategories
            });
        }
        catch (error) {
            console.error('Error fetching subcategories:', error);
            res.status(500).json({
                error: 'Failed to fetch subcategories',
                details: error.message
            });
        }
    });
}
function productsBySubCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const subCategoryId = parseInt(req.params.subCategoryId);
            if (isNaN(subCategoryId)) {
                return res.status(400).json({ error: 'Invalid subCategoryId' });
            }
            const { customerId, priceColumn } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId));
            const products = yield (0, product_1.getProductsBySubCategory)(subCategoryId, priceColumn);
            res.json({
                success: true,
                products,
            });
        }
        catch (error) {
            console.error('Error fetching products by subcategory:', error);
            res.status(500).json({
                error: 'Failed to fetch products by subcategory',
                details: error.message,
            });
        }
    });
}
function productsByCatalog(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const productId = parseInt(req.params.productId);
            if (isNaN(productId))
                return res.status(400).json({ error: 'Invalid productId' });
            const { customerId, priceColumn } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId));
            const products = yield (0, product_2.getProductsByCatalogOfProduct)(productId, priceColumn);
            res.json({ success: true, products });
        }
        catch (error) {
            console.error('Error fetching products by catalog:', error);
            res.status(500).json({ error: 'Failed to fetch products by catalog', details: error.message });
        }
    });
}
function similarProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const productId = parseInt(req.params.productId);
            if (isNaN(productId))
                return res.status(400).json({ error: 'Invalid productId' });
            const { customerId, priceColumn } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId));
            const products = yield (0, product_3.getSimilarProducts)(productId, priceColumn);
            res.json({ success: true, products });
        }
        catch (error) {
            console.error('Error fetching similar products:', error);
            res.status(500).json({ error: 'Failed to fetch similar products', details: error.message });
        }
    });
}
