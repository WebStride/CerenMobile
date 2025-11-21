import { Response } from 'express';
import { RequestWithUser } from '../types/express';
export declare function checkCustomer(req: RequestWithUser, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getStores(req: RequestWithUser, res: Response): Promise<Response<any, Record<string, any>>>;
