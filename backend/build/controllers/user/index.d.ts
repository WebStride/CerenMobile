import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function submitUserAddress(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUserAddresses(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setDefaultAddress(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDefaultAddress(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
