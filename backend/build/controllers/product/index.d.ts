import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getExclusiveProductsList(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getBestSelling(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCategoryList(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
