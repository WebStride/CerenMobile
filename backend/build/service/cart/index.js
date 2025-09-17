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
exports.getCart = getCart;
exports.addOrIncrementCartItem = addOrIncrementCartItem;
exports.updateCartQuantity = updateCartQuantity;
exports.removeCartItem = removeCartItem;
exports.clearCart = clearCart;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getCart(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.cart.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    });
}
function addOrIncrementCartItem(userId, product) {
    return __awaiter(this, void 0, void 0, function* () {
        const whereAny = { userId_productId: { userId, productId: product.productId } };
        const existing = yield prisma.cart.findUnique({ where: whereAny }).catch(() => null);
        if (existing) {
            // If item exists, add the new quantity to existing quantity
            const newQuantity = existing.quantity + (product.quantity || 1);
            return prisma.cart.update({
                where: { id: existing.id },
                data: {
                    quantity: newQuantity,
                    updatedAt: new Date()
                }
            });
        }
        return prisma.cart.create({
            data: {
                userId,
                productId: product.productId,
                productName: product.productName,
                price: product.price || 0,
                image: product.image || null,
                productUnits: product.productUnits || null,
                unitsOfMeasurement: product.unitsOfMeasurement || null,
                minOrderQuantity: product.minOrderQuantity || product.quantity || 1,
                quantity: product.quantity || 1
            }
        });
    });
}
function updateCartQuantity(userId, productId, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        if (quantity <= 0) {
            return prisma.cart.deleteMany({ where: { userId, productId } });
        }
        return prisma.cart.updateMany({ where: { userId, productId }, data: { quantity, updatedAt: new Date() } });
    });
}
function removeCartItem(userId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.cart.deleteMany({ where: { userId, productId } });
    });
}
function clearCart(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.cart.deleteMany({ where: { userId } });
    });
}
