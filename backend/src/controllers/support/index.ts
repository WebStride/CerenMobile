import { Request, Response } from 'express';
import { sendAdminContactAlert } from '../../service/sms/msg91';

export async function submitContactUs(req: Request, res: Response) {
  try {
    const { name, phoneNumber, address, message, requestType, isGuest } = req.body || {};

    if (!name || !phoneNumber || !address || !message || !requestType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const alertResult = await sendAdminContactAlert({
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
  } catch (error: any) {
    console.error('Error in submitContactUs:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
}
