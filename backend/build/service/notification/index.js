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
exports.sendUserDetailsToAdmin = sendUserDetailsToAdmin;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// WhatsApp notification disabled - Twilio removed
// To re-enable, integrate with MSG91 WhatsApp API or another provider
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;
const NOTIFY_ADMIN_ON_NEW_USER = process.env.NOTIFY_ADMIN_ON_NEW_USER === 'true';
function sendUserDetailsToAdmin(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Notification feature disabled after Twilio removal
        // This function is called but skipped when NOTIFY_ADMIN_ON_NEW_USER=false
        if (!NOTIFY_ADMIN_ON_NEW_USER) {
            console.log('📵 Admin notification disabled (NOTIFY_ADMIN_ON_NEW_USER=false)');
            return null;
        }
        if (!ADMIN_WHATSAPP_NUMBER) {
            console.warn('⚠️ Admin WhatsApp number not configured, skipping notification');
            return null;
        }
        const message = `
New User Registration Details:

Name: ${userData.name}
Phone: ${userData.phoneNumber}
City: ${userData.city}
District: ${userData.district}
House No: ${userData.houseNumber}
Building & Block: ${userData.buildingBlock}
Pin Code: ${userData.pinCode}
${userData.landmark ? `Landmark: ${userData.landmark}` : ''}
`;
        // TODO: Implement WhatsApp notification via MSG91 or another provider
        // For now, just log the message that would be sent
        console.log('📋 Would send admin notification (WhatsApp disabled):');
        console.log(message);
        return { status: 'skipped', reason: 'WhatsApp provider not configured' };
    });
}
//# sourceMappingURL=index.js.map