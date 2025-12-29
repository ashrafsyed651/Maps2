import { WeatherData, RouteWeather } from '../types';
import { findCitiesAlongRoute, LatLng } from './osmService';

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

const WMO_CODES: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
};

const getWeatherDescription = (code: number): string => {
    return WMO_CODES[code] || "Unknown";
};

const fetchPointWeather = async (lat: number, lng: number): Promise<WeatherData> => {
    try {
        const response = await fetch(`${WEATHER_API_URL}?latitude=${lat}&longitude=${lng}&current_weather=true`);
        if (!response.ok) throw new Error("Weather API failed");

        const data = await response.json();
        const current = data.current_weather;

        return {
            temp: current.temperature,
            code: current.weathercode,
            description: getWeatherDescription(current.weathercode)
        };
    } catch (error) {
        console.warn("Failed to fetch weather for point", lat, lng, error);
        return { temp: 0, code: -1, description: "Unavailable" };
    }
};

export const fetchRouteWeather = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    routePath?: { lat: number; lng: number }[]
): Promise<RouteWeather> => {

    // Fetch distinct cities along the route
    let cityWaypoints: { name: string, lat: number, lng: number }[] = [];
    if (routePath && routePath.length > 0) {
        // Convert to compatible LatLng array
        const osmPath = routePath.map(p => ({
            lat: typeof (p as any).lat === 'function' ? (p as any).lat() : p.lat,
            lng: typeof (p as any).lng === 'function' ? (p as any).lng() : p.lng
        }));

        cityWaypoints = await findCitiesAlongRoute(osmPath);
    }

    try {
        const originWeatherPromise = fetchPointWeather(origin.lat, origin.lng);
        const destWeatherPromise = fetchPointWeather(destination.lat, destination.lng);

        // Fetch weather for each found city
        const cityWeatherPromises = cityWaypoints.map(async city => {
            const data = await fetchPointWeather(city.lat, city.lng);
            return { name: city.name, data };
        });

        const [originWeather, destWeather, ...cityWeathers] = await Promise.all([
            originWeatherPromise,
            destWeatherPromise,
            ...cityWeatherPromises
        ]);

        return {
            origin: originWeather,
            destination: destWeather,
            waypoints: cityWeathers
        };
    } catch (error) {
        console.error("Error fetching route weather:", error);
        // Return fallbacks
        const fallback = { temp: 0, code: -1, description: "Unavailable" };
        return { origin: fallback, destination: fallback, waypoints: [] };
    }
};
