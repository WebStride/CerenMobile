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
exports.getFavourites = getFavourites;
exports.postFavourite = postFavourite;
exports.deleteFavourite = deleteFavourite;
const favourites_1 = require("../../service/favourites");
function getFavourites(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            const userId = parseInt(req.user.userId);
            const favourites = yield (0, favourites_1.getUserFavourites)(userId);
            res.json({ success: true, favourites });
        }
        catch (error) {
            console.error('Error getting favourites:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function postFavourite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            const userId = parseInt(req.user.userId);
            const product = req.body;
            if (!(product === null || product === void 0 ? void 0 : product.productId))
                return res.status(400).json({ error: 'productId required' });
            const fav = yield (0, favourites_1.addUserFavourite)(userId, product);
            res.json({ success: true, favourite: fav });
        }
        catch (error) {
            console.error('Error adding favourite:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
function deleteFavourite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                return res.status(401).json({ error: 'User not authenticated' });
            const userId = parseInt(req.user.userId);
            const productId = parseInt(req.params.productId);
            if (isNaN(productId))
                return res.status(400).json({ error: 'Invalid productId' });
            yield (0, favourites_1.removeUserFavourite)(userId, productId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error removing favourite:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
