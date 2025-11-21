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
exports.getUserFavourites = getUserFavourites;
exports.addUserFavourite = addUserFavourite;
exports.removeUserFavourite = removeUserFavourite;
const prisma_1 = __importDefault(require("../../lib/prisma"));
function getUserFavourites(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.userFavourites.findMany({
            where: { customerId },
            orderBy: { addedAt: 'desc' }
        });
    });
}
function addUserFavourite(customerId, product) {
    return __awaiter(this, void 0, void 0, function* () {
        // upsert to avoid duplicate unique constraint error
        return prisma_1.default.userFavourites.upsert({
            where: { customerId_productId: { customerId, productId: product.productId } },
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
                customerId,
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
function removeUserFavourite(customerId, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.userFavourites.deleteMany({
            where: {
                customerId,
                productId
            }
        });
    });
}
