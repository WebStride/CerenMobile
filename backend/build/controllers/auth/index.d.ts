import { Request, Response } from "express";
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function verifyPhoneNumber(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: Request, res: Response): Promise<void>;
export { validateToken } from './validateToken';
