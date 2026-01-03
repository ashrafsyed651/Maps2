export interface LatLng {
    lat: number;
    lng: number;
}

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const lightingCache = new Map<string, number>();

/**
 * Fetches lighting score based on OSM data
 * Uses explicit "lit" tags when available, falls back to road-type heuristics
 * Returns a score (2-10)
 * Now includes caching and retries to improved consistency.
 */
export const fetchLightingScore = async (path: LatLng[]): Promise<number> => {
    if (!path || path.length === 0) {
        console.warn("Empty path provided to fetchLightingScore");
        return 5;
    }

    // Sample points along the route for analysis
    const samples = samplePoints(path, 15); // Increased from 10 to 15 for better accuracy

    // Generate a stable cache key based on the sampled points
    const cacheKey = JSON.stringify(samples.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`));

    if (lightingCache.has(cacheKey)) {
        return lightingCache.get(cacheKey)!;
    }

    try {
        // Construct Overpass query to fetch highway data
        let queryParts = "";
        samples.forEach(pt => {
            const lat = Number(pt.lat.toFixed(4));
            const lng = Number(pt.lng.toFixed(4));
            // Increased radius from 60m to 100m to catch more roads
            queryParts += `way(around:100,${lat},${lng})["highway"];`;
        });

        const query = `
            [out:json][timeout:15];
            (
                ${queryParts}
            );
            out tags;
        `;

        // Retry logic with exponential backoff
        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                response = await fetch(OVERPASS_API_URL, {
                    method: 'POST',
                    body: query
                });

                if (response.ok) break;

                // If rate limited (429) or server error (5xx), wait and retry
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`API Error ${response.status}`);
                }

                // If client error (4xx), don't retry, just break
                break;
            } catch (err) {
                attempts++;
                if (attempts === maxAttempts) throw err;
                // Wait 1s, 2s, 4s...
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
            }
        }

        if (!response || !response.ok) {
            console.warn("OSM API request failed after retries");
            return 5;
        }

        const data = await response.json();
        const elements = data.elements || [];

        if (elements.length === 0) {
            console.warn("No OSM highway data found for route");
            lightingCache.set(cacheKey, 4);
            return 4; // Slightly lower default for unknown areas
        }

        // Deduplicate OSM elements by ID
        const uniqueElements = new Map<number, any>();
        elements.forEach((el: any) => {
            if (el.id) uniqueElements.set(el.id, el);
        });

        // Calculate lighting score based on explicit OSM lit tags + Road Type Heuristics
        let totalScore = 0;
        let count = 0;

        uniqueElements.forEach((el) => {
            const tags = el.tags || {};
            const lit = tags.lit;
            const highway = tags.highway;

            let score = 5; // Default: unknown/no data

            // 1. Explicit lighting tags (Highest Priority)
            if (lit === 'yes') {
                score = 10; // Well-lit
            } else if (lit === '24/7' || lit === 'automatic' || lit === 'stay_on') {
                score = 10; // Always lit
            } else if (lit === 'limited' || lit === 'interval') {
                score = 6; // Partially lit
            } else if (lit === 'sunset-sunrise' || lit === 'dusk-dawn') {
                score = 7; // Lit during night hours
            } else if (lit === 'no' || lit === 'disused') {
                score = 2; // Not lit
            } else {
                // 2. Heuristics based on road type (Fallback)
                switch (highway) {
                    case 'motorway':
                    case 'motorway_link':
                    case 'trunk':
                    case 'trunk_link':
                    case 'primary':
                    case 'primary_link':
                        score = 9; // Major roads usually lit
                        break;
                    case 'secondary':
                    case 'secondary_link':
                        score = 8;
                        break;
                    case 'tertiary':
                    case 'tertiary_link':
                        score = 7;
                        break;
                    case 'residential':
                    case 'living_street':
                    case 'pedestrian':
                        score = 6; // Usually have streetlights
                        break;
                    case 'service':
                    case 'track':
                        score = 3; // Likely unlit
                        break;
                    default:
                        score = 5; // Unknown
                }
            }

            totalScore += score;
            count++;
        });

        // Calculate average and clamp to valid range
        const avgScore = count > 0 ? Math.round(totalScore / count) : 5;
        const finalScore = Math.max(2, Math.min(10, avgScore));

        console.log(`Lighting score calculated: ${finalScore} (from ${count} road segments, raw OSM data only)`);

        // Cache the successful result
        lightingCache.set(cacheKey, finalScore);

        return finalScore;

    } catch (error) {
        console.error("OSM Lighting fetch failed:", error);
        return 5; // Safe default on error
    }
};

/**
 * Sample evenly distributed points along a path
 */
function samplePoints(path: LatLng[], count: number): LatLng[] {
    if (path.length <= count) {
        return path.map(p => ({
            lat: typeof p.lat === 'function' ? (p as any).lat() : p.lat,
            lng: typeof p.lng === 'function' ? (p as any).lng() : p.lng
        }));
    }

    const samples: LatLng[] = [];
    const step = (path.length - 1) / (count - 1);

    for (let i = 0; i < count; i++) {
        const index = Math.round(i * step);
        const point = path[index];
        samples.push({
            lat: typeof point.lat === 'function' ? (point as any).lat() : point.lat,
            lng: typeof point.lng === 'function' ? (point as any).lng() : point.lng
        });
    }

    return samples;
}

export interface CityResult {
    name: string;
    lat: number;
    lng: number;
}

/**
 * Finds major cities or towns along the route using OSM Overpass API
 */
export const findCitiesAlongRoute = async (path: LatLng[]): Promise<CityResult[]> => {
    if (!path || path.length === 0) return [];

    // Sample 5 points along the route (skip start/end to avoid redundancy)
    let samples = samplePoints(path, 7);
    // Remove first and last to avoid origin/destination
    if (samples.length > 2) {
        samples = samples.slice(1, samples.length - 1);
    }

    // Build query for cities/towns around these points
    let queryParts = "";
    samples.forEach(pt => {
        const lat = Number(pt.lat.toFixed(4));
        const lng = Number(pt.lng.toFixed(4));
        // Search for cities/towns within 10km (10000m)
        queryParts += `node["place"~"city|town"](around:10000,${lat},${lng});`;
    });

    const query = `
        [out:json][timeout:15];
        (
            ${queryParts}
        );
        out body;
    `;

    try {
        const response = await fetch(OVERPASS_API_URL, {
            method: 'POST',
            body: query
        });

        if (!response.ok) return [];

        const data = await response.json();
        const elements = data.elements || [];

        // Deduplicate and format
        const uniqueCities = new Map<string, CityResult>();

        elements.forEach((el: any) => {
            if (el.tags && el.tags.name) {
                // English name preferred if available
                const name = el.tags['name:en'] || el.tags.name;
                uniqueCities.set(name, {
                    name: name,
                    lat: el.lat,
                    lng: el.lon
                });
            }
        });

        // Convert to array and limit to 3 distinct cities
        return Array.from(uniqueCities.values()).slice(0, 3);

    } catch (error) {
        console.error("Failed to find cities along route:", error);
        return [];
    }
};

/**
 * Reverse geocodes coordinates to an address using OpenStreetMap (Nominatim)
 */
export const reverseGeocodeOSM = async (lat: number, lon: number): Promise<string | null> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SmartDrive-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.display_name) {
            return data.display_name;
        }

        return null;
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return null;
    }
};

