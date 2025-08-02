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
exports.getBestSelling = getBestSelling;
exports.getCategoryList = getCategoryList;
const product_1 = require("../../service/product");
function getExclusiveProductsList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const { customerId, priceColumn } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId));
            const products = yield (0, product_1.getExclusiveProducts)(customerId, priceColumn);
            res.json({
                success: true,
                products
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
            const { customerId, priceColumn } = yield (0, product_1.getCustomerPricingInfo)(parseInt(req.user.userId));
            const products = yield (0, product_1.getBestSellingProducts)(customerId, priceColumn, sortOrderLimit);
            res.json({
                success: true,
                products
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
