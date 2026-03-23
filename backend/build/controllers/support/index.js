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
exports.submitContactUs = submitContactUs;
const msg91_1 = require("../../service/sms/msg91");
function submitContactUs(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, phoneNumber, address, message, requestType, isGuest } = req.body || {};
            if (!name || !phoneNumber || !address || !message || !requestType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }
            const alertResult = yield (0, msg91_1.sendAdminContactAlert)({
                name: String(name).trim(),
                phoneNumber: String(phoneNumber).trim(),
                address: String(address).trim(),
                message: String(message).trim(),
                requestType: String(requestType).trim(),
                isGuest: Boolean(isGuest),
            });
            if (!alertResult.success) {
                return res.status(500).json({
                    success: false,
                    message: alertResult.message || 'Unable to submit request',
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Request submitted successfully',
            });
        }
        catch (error) {
            console.error('Error in submitContactUs:', error);
            return res.status(500).json({
                success: false,
                message: (error === null || error === void 0 ? void 0 : error.message) || 'Internal server error',
            });
        }
    });
}
//# sourceMappingURL=index.js.map