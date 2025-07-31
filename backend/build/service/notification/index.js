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
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;
function sendUserDetailsToAdmin(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ADMIN_WHATSAPP_NUMBER) {
            throw new Error('Admin WhatsApp number not configured');
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
        try {
            const whatsappMessage = yield client.messages.create({
                body: message,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${ADMIN_WHATSAPP_NUMBER}`
            });
            console.log('WhatsApp message sent with SID:', whatsappMessage.sid);
            return whatsappMessage;
        }
        catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw new Error('Failed to send WhatsApp message to admin');
        }
    });
}
