import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getCartList(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function postCart(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function putCartItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCartItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function postClearCart(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
