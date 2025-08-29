import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getFavourites(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function postFavourite(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteFavourite(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
