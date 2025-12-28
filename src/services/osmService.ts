interface LatLng {
    lat: number;
    lng: number;
}

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// In-memory cache to ensure consistency during the session
const lightingCache: Record<string, number> = {};

/**
 * Fetches lighting score based on OSM data (lit tag and highway types)
 * Returns a consistent score (0-10) for the same route path
 */
export const fetchLightingScore = async (path: LatLng[]): Promise<number> => {
    if (!path || path.length === 0) return 5;

    // 1. GENERATE CACHE KEY
    // Use first, middle, and last points to uniquely identify the route path
    const p1 = path[0];
    const p2 = path[Math.floor(path.length / 2)];
    const p3 = path[path.length - 1];

    // Convert to lat/lng numbers clearly
    const getLat = (p: any) => typeof p.lat === 'function' ? p.lat() : p.lat;
    const getLng = (p: any) => typeof p.lng === 'function' ? p.lng() : p.lng;

    const cacheKey = `light-${getLat(p1).toFixed(4)}-${getLng(p1).toFixed(4)}-${getLat(p2).toFixed(4)}-${getLat(p3).toFixed(4)}`;

    if (lightingCache[cacheKey] !== undefined) {
        return lightingCache[cacheKey];
    }

    try {
        // 2. SAMPLE POINTS
        const samples = samplePoints(path, 10);

        // 3. CONSTRUCT QUERY
        let queryParts = "";
        samples.forEach(pt => {
            const lat = Number(pt.lat.toFixed(4));
            const lng = Number(pt.lng.toFixed(4));
            queryParts += `way(around:60,${lat},${lng})["highway"];`;
        });

        const query = `
            [out:json][timeout:15];
            (
                ${queryParts}
            );
            out tags;
        `;

        // 4. FETCH
        const response = await fetch(OVERPASS_API_URL, {
            method: 'POST',
            body: query
        });

        if (!response.ok) return 5;
        const data = await response.json();
        const elements = data.elements || [];

        if (elements.length === 0) {
            lightingCache[cacheKey] = 3;
            return 3;
        }

        // 5. DEDUPLICATE OSM ELEMENTS
        const uniqueElements = new Map<number, any>();
        elements.forEach((el: any) => {
            if (el.id) uniqueElements.set(el.id, el);
        });

        // 6. SCORE CALCULATION
        let totalScore = 0;
        let count = 0;

        uniqueElements.forEach((el) => {
            const tags = el.tags || {};
            const lit = tags.lit;
            const highway = tags.highway;

            let score = 5;
            if (lit === 'yes' || lit === '24/7' || lit === 'automatic' || lit === 'stay_on') {
                score = 10;
            } else if (lit === 'no') {
                score = 2;
            } else {
                switch (highway) {
                    case 'motorway':
                    case 'trunk':
                    case 'primary': score = 9; break;
                    case 'secondary':
                    case 'tertiary': score = 7; break;
                    case 'residential': score = 6; break;
                    case 'pedestrian':
                    case 'footway': score = 4; break;
                    default: score = 3;
                }
            }
            totalScore += score;
            count++;
        });

        const finalScore = count > 0 ? Math.round(totalScore / count) : 5;
        const clampedScore = Math.max(2, Math.min(10, finalScore));

        // Save to cache
        lightingCache[cacheKey] = clampedScore;
        return clampedScore;

    } catch (error) {
        console.error("OSM Lighting fetch failed:", error);
        return 5;
    }
};

function samplePoints(path: LatLng[], count: number): LatLng[] {
    if (path.length <= count) return path.map(p => ({
        lat: typeof p.lat === 'function' ? (p as any).lat() : p.lat,
        lng: typeof p.lng === 'function' ? (p as any).lng() : p.lng
    }));

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
