import { Request, Response } from 'express';

const SERVER_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.EXPO_GOOGLE_MAPS_SERVER_KEY || '';

const proxyFetch = async (url: string) => {
    let fetchFn = global.fetch;
    if (typeof fetchFn !== 'function') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeFetch = require('node-fetch');
            fetchFn = nodeFetch;
        } catch (e) {
            throw new Error('Global fetch is not available and node-fetch is not installed');
        }
    }
    const resp = await fetchFn(url);
    const json = await resp.json();
    return { status: resp.status, json };
};

export const placeAutocomplete = async (req: Request, res: Response) => {
    try {
        const input = req.query.input as string;
        if (!input) return res.status(400).json({ error: 'missing input' });
        if (!SERVER_KEY) return res.status(500).json({ error: 'server-side Google Maps key not configured' });

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&language=en&key=${SERVER_KEY}`;
        const { status, json } = await proxyFetch(url);
        return res.status(status).json(json);
    } catch (err: any) {
        console.error('placeAutocomplete error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
};

export const placeDetails = async (req: Request, res: Response) => {
    try {
        const place_id = req.query.place_id as string;
        if (!place_id) return res.status(400).json({ error: 'missing place_id' });
        if (!SERVER_KEY) return res.status(500).json({ error: 'server-side Google Maps key not configured' });

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=geometry,name,formatted_address&key=${SERVER_KEY}`;
        const { status, json } = await proxyFetch(url);
        return res.status(status).json(json);
    } catch (err: any) {
        console.error('placeDetails error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
};

export const geocode = async (req: Request, res: Response) => {
    try {
        const address = req.query.address as string;
        const latlng = req.query.latlng as string;
        if (!address && !latlng) return res.status(400).json({ error: 'missing address or latlng' });
        if (!SERVER_KEY) return res.status(500).json({ error: 'server-side Google Maps key not configured' });

        const queryParam = address ? `address=${encodeURIComponent(address)}` : `latlng=${encodeURIComponent(latlng)}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParam}&key=${SERVER_KEY}`;
        const { status, json } = await proxyFetch(url);
        return res.status(status).json(json);
    } catch (err: any) {
        console.error('geocode error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
};

export default {
    placeAutocomplete,
    placeDetails,
    geocode,
};
