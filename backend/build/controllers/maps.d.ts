import { Request, Response } from 'express';
export declare const placeAutocomplete: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const placeDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const geocode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    placeAutocomplete: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    placeDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    geocode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
