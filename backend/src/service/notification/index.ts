import dotenv from 'dotenv';

dotenv.config();

// WhatsApp notification disabled - Twilio removed
// To re-enable, integrate with MSG91 WhatsApp API or another provider
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;
const NOTIFY_ADMIN_ON_NEW_USER = process.env.NOTIFY_ADMIN_ON_NEW_USER === 'true';

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
}
