import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getInvoicesByCustomer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrdersByCustomer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrderItemsByOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getInvoiceItemsByInvoice(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get invoices for a customer within a date range
 * POST /invoices/by-customer
 * Body: { FromDateTime: string (Unix ms), ToDateTime: string (Unix ms), CustomerID: number }
 * Calls external API: http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer
 */
export declare function getInvoicesForCustomer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
