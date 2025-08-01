import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;

interface UserAddressData {
    name: string;
    phoneNumber: string;
    city: string;
    district: string;
    houseNumber: string;
    buildingBlock: string;
    pinCode: string;
    landmark?: string;
}

export async function sendUserDetailsToAdmin(userData: UserAddressData) {
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
        const whatsappMessage = await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${ADMIN_WHATSAPP_NUMBER}`
        });

        console.log('WhatsApp message sent with SID:', whatsappMessage.sid);
        return whatsappMessage;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw new Error('Failed to send WhatsApp message to admin');
    }
}
