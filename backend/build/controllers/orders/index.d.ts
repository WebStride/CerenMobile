import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getInvoicesByCustomer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrdersByCustomer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrderItemsByOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getInvoiceItemsByInvoice(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
