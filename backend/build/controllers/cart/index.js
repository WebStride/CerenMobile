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
exports.getCartList = getCartList;
exports.postCart = postCart;
exports.putCartItem = putCartItem;
exports.deleteCartItem = deleteCartItem;
exports.postClearCart = postClearCart;
const cart_1 = require("../../service/cart");
function getCartList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            // Get customerId from query parameter (from store selection)
            const customerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : parseInt(req.headers['x-customer-id']);
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            const cart = yield (0, cart_1.getCart)(customerId);
            res.json({ success: true, cart });
        }
        catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function postCart(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            // Get customerId from query parameter (from store selection)
            const customerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : parseInt(req.headers['x-customer-id']);
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            const body = req.body;
            if (!(body === null || body === void 0 ? void 0 : body.productId) || !(body === null || body === void 0 ? void 0 : body.productName))
                return res.status(400).json({ error: 'productId and productName required' });
            const item = yield (0, cart_1.addOrIncrementCartItem)(customerId, body);
            res.json({ success: true, item });
        }
        catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function putCartItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            // Get customerId from query parameter (from store selection)
            const customerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : parseInt(req.headers['x-customer-id']);
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            const productId = parseInt(req.params.productId);
            const { quantity } = req.body;
            if (isNaN(productId) || typeof quantity !== 'number')
                return res.status(400).json({ error: 'Invalid request' });
            yield (0, cart_1.updateCartQuantity)(customerId, productId, quantity);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error updating cart item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function deleteCartItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            // Get customerId from query parameter (from store selection)
            const customerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : parseInt(req.headers['x-customer-id']);
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            const productId = parseInt(req.params.productId);
            if (isNaN(productId))
                return res.status(400).json({ error: 'Invalid productId' });
            yield (0, cart_1.removeCartItem)(customerId, productId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error removing cart item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function postClearCart(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            // Get customerId from query parameter (from store selection)
            const customerId = req.query.customerId
                ? parseInt(req.query.customerId)
                : parseInt(req.headers['x-customer-id']);
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            yield (0, cart_1.clearCart)(customerId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
