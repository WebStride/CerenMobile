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
exports.getUserFavourites = getUserFavourites;
exports.addUserFavourite = addUserFavourite;
exports.removeUserFavourite = removeUserFavourite;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getUserFavourites(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.userFavourites.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' }
        });
    });
}
function addUserFavourite(userId, product) {
    return __awaiter(this, void 0, void 0, function* () {
        // upsert to avoid duplicate unique constraint error
        return prisma.userFavourites.upsert({
            where: { userId_productId: { userId, productId: product.productId } },
            update: {
                productName: product.productName,
                price: product.price || 0,
                image: product.image || null,
                productUnits: product.productUnits || 0,
                unitsOfMeasurement: product.unitsOfMeasurement || null,
                minOrderQuantity: product.minOrderQuantity || 1,
                addedAt: new Date()
            },
            create: {
                userId,
                productId: product.productId,
                productName: product.productName,
                price: product.price || 0,
                image: product.image || null,
                productUnits: product.productUnits || 0,
                unitsOfMeasurement: product.unitsOfMeasurement || null,
                minOrderQuantity: product.minOrderQuantity || 1
            }
        });
    });
}
function removeUserFavourite(userId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma.userFavourites.deleteMany({
            where: {
                userId,
                productId
            }
        });
    });
}
