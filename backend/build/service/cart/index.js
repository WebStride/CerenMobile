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
exports.getCart = getCart;
exports.addOrIncrementCartItem = addOrIncrementCartItem;
exports.updateCartQuantity = updateCartQuantity;
exports.removeCartItem = removeCartItem;
exports.clearCart = clearCart;
const prisma_1 = __importDefault(require("../../lib/prisma"));
function getCart(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.cart.findMany({ where: { customerId }, orderBy: { updatedAt: 'desc' } });
    });
}
function addOrIncrementCartItem(customerId, product) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.cart.upsert({
            where: { customerId_productId: { customerId, productId: product.productId } },
            update: {
                quantity: { increment: product.quantity || 1 },
                updatedAt: new Date(),
            },
            create: {
                customerId,
                productId: product.productId,
                productName: product.productName,
                price: product.price || 0,
                image: product.image || null,
                productUnits: product.productUnits || null,
                unitsOfMeasurement: product.unitsOfMeasurement || null,
                minOrderQuantity: product.minOrderQuantity || product.quantity || 1,
                quantity: product.quantity || 1,
            },
        });
    });
}
function updateCartQuantity(customerId, productId, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        if (quantity <= 0) {
            // Check minOrderQuantity before deleting — prevent accidental removal
            const existing = yield prisma_1.default.cart.findFirst({ where: { customerId, productId } });
            const minQty = (existing === null || existing === void 0 ? void 0 : existing.minOrderQuantity) || 1;
            if (quantity <= 0 && existing) {
                // Instead of deleting, enforce minimum quantity
                return prisma_1.default.cart.updateMany({ where: { customerId, productId }, data: { quantity: minQty, updatedAt: new Date() } });
            }
            return prisma_1.default.cart.deleteMany({ where: { customerId, productId } });
        }
        // Enforce minimum order quantity on update
        const existing = yield prisma_1.default.cart.findFirst({ where: { customerId, productId } });
        const minQty = (existing === null || existing === void 0 ? void 0 : existing.minOrderQuantity) || 1;
        const safeQuantity = Math.max(quantity, minQty);
        return prisma_1.default.cart.updateMany({ where: { customerId, productId }, data: { quantity: safeQuantity, updatedAt: new Date() } });
    });
}
function removeCartItem(customerId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.cart.deleteMany({ where: { customerId, productId } });
    });
}
function clearCart(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.cart.deleteMany({ where: { customerId } });
    });
}
//# sourceMappingURL=index.js.map