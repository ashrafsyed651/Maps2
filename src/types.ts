/// <reference types="google.maps" />

export type RoadType = 'Highway' | 'City' | 'Scenic' | 'Backroads';

export interface WeatherData {
    temp: number;
    code: number; // WMO code
    description: string;
}

export interface RouteWeather {
    origin: WeatherData;
    destination: WeatherData;
    waypoints: {
        name: string;
        data: WeatherData;
    }[];
}

export interface Route {
    id: string;
    source: string;
    destination: string;
    eta: number; // in minutes
    distance: number; // in km
    activityScore: number; // 0-10 (Places density)
    lightingScore: number; // 0-10
    roadType: RoadType;
    description: string;
    weather?: RouteWeather;
    // Store the underlying Google Maps direction route object for rendering
    googleRoute?: google.maps.DirectionsRoute;
}

export type ProfileId = 'fast' | 'safe' | 'scenic' | 'balanced';

export interface DrivingProfile {
    id: ProfileId;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    weights: {
        eta: number;
        activity: number;
        lighting: number;
    };
}
