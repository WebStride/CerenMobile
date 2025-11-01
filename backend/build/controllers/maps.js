"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocode = exports.placeDetails = exports.placeAutocomplete = void 0;
const SERVER_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.EXPO_GOOGLE_MAPS_SERVER_KEY || '';
const proxyFetch = (url) => __awaiter(void 0, void 0, void 0, function* () {
    // Prefer global fetch (Node 18+). If unavailable, try to require 'node-fetch'.
    let fetchFn = global.fetch;
    if (typeof fetchFn !== 'function') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeFetch = require('node-fetch');
            fetchFn = nodeFetch;
        }
        catch (e) {
            throw new Error('Global fetch is not available and node-fetch is not installed');
        }
    }
    const resp = yield fetchFn(url);
    const json = yield resp.json();
    return { status: resp.status, json };
});
const placeAutocomplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const input = req.query.input;
        if (!input)
            return res.status(400).json({ error: 'missing input' });
        if (!SERVER_KEY)
            return res.status(500).json({ error: 'server-side Google Maps key not configured' });
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&language=en&key=${SERVER_KEY}`;
        const { status, json } = yield proxyFetch(url);
        return res.status(status).json(json);
    }
    catch (err) {
        console.error('placeAutocomplete error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
});
exports.placeAutocomplete = placeAutocomplete;
const placeDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const place_id = req.query.place_id;
        if (!place_id)
            return res.status(400).json({ error: 'missing place_id' });
        if (!SERVER_KEY)
            return res.status(500).json({ error: 'server-side Google Maps key not configured' });
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=geometry,name,formatted_address&key=${SERVER_KEY}`;
        const { status, json } = yield proxyFetch(url);
        return res.status(status).json(json);
    }
    catch (err) {
        console.error('placeDetails error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
});
exports.placeDetails = placeDetails;
const geocode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address = req.query.address;
        if (!address)
            return res.status(400).json({ error: 'missing address' });
        if (!SERVER_KEY)
            return res.status(500).json({ error: 'server-side Google Maps key not configured' });
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${SERVER_KEY}`;
        const { status, json } = yield proxyFetch(url);
        return res.status(status).json(json);
    }
    catch (err) {
        console.error('geocode error', err);
        return res.status(500).json({ error: err.message || 'internal error' });
    }
});
exports.geocode = geocode;
exports.default = {
    placeAutocomplete: exports.placeAutocomplete,
    placeDetails: exports.placeDetails,
    geocode: exports.geocode,
};
