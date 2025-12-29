import { Route, DrivingProfile } from '../types';
import { fetchLightingScore } from './osmService';
import { fetchRouteWeather } from './weatherService';

export const PROFILES: DrivingProfile[] = [
    {
        id: 'fast',
        name: 'Speed_Demon',
        description: 'Prioritizes shortest ETA above all else.',
        icon: 'Zap',
        weights: { eta: 10, activity: 0, lighting: 1 }
    },
    {
        id: 'safe',
        name: 'Safety_First',
        description: 'Prefers well-lit routes with populated areas.',
        icon: 'Shield',
        weights: { eta: 2, activity: 5, lighting: 10 }
    },
    {
        id: 'scenic',
        name: 'Explorer',
        description: 'Loves high activity and scenic routes.',
        icon: 'Compass',
        weights: { eta: 1, activity: 10, lighting: 5 }
    }
];

export const fetchRoutes = async (sourceCoords: { lat: number, lon: number }, destCoords: { lat: number, lon: number }): Promise<Route[]> => {
    if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API not loaded");
    }

    const directionsService = new google.maps.DirectionsService();

    try {
        const response = await directionsService.route({
            origin: { lat: sourceCoords.lat, lng: sourceCoords.lon },
            destination: { lat: destCoords.lat, lng: destCoords.lon },
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        });

        if (!response.routes || response.routes.length === 0) {
            return [];
        }

        const processedRoutes = await Promise.all(response.routes.map(async (gRoute, index) => {
            const leg = gRoute.legs && gRoute.legs[0];
            const durationMins = leg?.duration?.value ? Math.round(leg.duration.value / 60) : 0;
            const distanceKm = leg?.distance?.value ? Number((leg.distance.value / 1000).toFixed(1)) : 0;

            let roadType: Route['roadType'];
            if (index === 0) {
                roadType = 'Highway';
            } else if (durationMins > (response.routes[0].legs?.[0]?.duration?.value || 0) / 60 * 1.2) {
                roadType = 'Scenic';
            } else {
                roadType = 'Backroads';
            }

            let activity = 5;
            if (roadType === 'Highway') activity = 4;
            if (roadType === 'Scenic') activity = 8;
            if (roadType === 'Backroads') activity = 6;

            let lightingScore = 5;
            let weatherData = undefined;

            if (gRoute.overview_path) {
                // Fetch basic lighting score
                lightingScore = await fetchLightingScore(gRoute.overview_path as any);

                // Fetch weather data
                try {
                    const pathForWeather = gRoute.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                    weatherData = await fetchRouteWeather(
                        { lat: sourceCoords.lat, lng: sourceCoords.lon },
                        { lat: destCoords.lat, lng: destCoords.lon },
                        pathForWeather
                    );
                } catch (e) {
                    console.warn("Weather fetch failed", e);
                }
            }

            // STABLE ID: Based on source/destination names and route summary if available
            // This prevents UI refreshes from resetting the selection state unnecessarily
            const stableId = `route-${leg?.start_address.slice(0, 3)}-${leg?.end_address.slice(0, 3)}-${index}`;

            return {
                id: stableId,
                source: leg?.start_address || 'Start',
                destination: leg?.end_address || 'End',
                eta: durationMins,
                distance: distanceKm,
                activityScore: activity,
                lightingScore: lightingScore,
                weather: weatherData,
                roadType: roadType,
                description: gRoute.summary || leg?.start_address || 'Route',
                googleRoute: gRoute
            };
        }));

        return processedRoutes;

    } catch (error) {
        console.error("Direction/OSM Fetch failed", error);
        return [];
    }
};

export const rankRoutes = (routes: Route[], profile: DrivingProfile): Route[] => {
    return [...routes].sort((a, b) => {
        if (profile.id === 'fast') return a.eta - b.eta;
        if (profile.id === 'scenic') return b.eta - a.eta;
        if (profile.id === 'safe') {
            const safetyA = a.activityScore + a.lightingScore;
            const safetyB = b.activityScore + b.lightingScore;
            // If safety is tied, prefer shorter ETA
            if (safetyB === safetyA) return a.eta - b.eta;
            return safetyB - safetyA;
        }
        const scoreA = calculateScore(a, profile);
        const scoreB = calculateScore(b, profile);
        return scoreB - scoreA;
    });
};

const calculateScore = (route: Route, profile: DrivingProfile): number => {
    const etaScore = (200 - route.eta) * (profile.weights?.eta || 1);
    const activityScore = route.activityScore * 10 * (profile.weights?.activity || 1);
    const lightingScore = route.lightingScore * 10 * (profile.weights?.lighting || 1);
    return etaScore + activityScore + lightingScore;
};

export const getRecommendationReason = (route: Route, profile: DrivingProfile): string => {
    if (profile.id === 'fast') return `Shortest route: ${route.eta} mins.`;
    if (profile.id === 'scenic') return `Longest scenic drive: ${route.eta} mins.`;
    if (profile.id === 'safe') {
        const totalSafety = route.activityScore + route.lightingScore;
        return `High safety score (${totalSafety}/20).`;
    }
    return 'Balanced choice.';
};
