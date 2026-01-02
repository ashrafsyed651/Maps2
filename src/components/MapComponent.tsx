import { GoogleMap } from '@react-google-maps/api';
import { Route } from '../types';
import { useState, useEffect, useRef } from 'react';

interface MapComponentProps {
    routes: Route[];
    selectedRouteId?: string;
    onSelectRoute?: (id: string) => void;
    isDarkMode?: boolean;
}

const mapContainerStyle = {
    height: "100%",
    width: "100%",
};

const lightOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    minZoom: 2,
    styles: []
};

const darkOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    minZoom: 2,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ]
};

export function MapComponent({ routes, selectedRouteId, onSelectRoute, isDarkMode }: MapComponentProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const polylinesRef = useRef<google.maps.Polyline[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

    const options = isDarkMode ? darkOptions : lightOptions;

    // ... (rest of logic remains same, just ensure options is passed correctly)

    // Keep track of the map instance
    const onLoad = (map: google.maps.Map) => {
        setMap(map);
        mapRef.current = map;
    };

    const onUnmount = () => {
        // Cleanup on unmount
        polylinesRef.current.forEach(p => p.setMap(null));
        markersRef.current.forEach(m => m.setMap(null));
        setMap(null);
        mapRef.current = null;
    };

    // Derived state: active route
    const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

    // Effect: Fit bounds whenever the selected route changes or map loads
    useEffect(() => {
        if (map && selectedRoute?.googleRoute?.bounds) {
            map.fitBounds(selectedRoute.googleRoute.bounds);
        }
    }, [map, selectedRoute]);

    // Effect: Imperatively draw polylines and markers
    useEffect(() => {
        if (!map) return;

        // 1. CLEAR EXISTING
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // 2. DRAW ROUTES (Blue/Cyan for selected, Gray for others)
        routes.forEach(route => {
            if (!route.googleRoute?.overview_path) return;

            const isSelected = route.id === selectedRouteId;
            const path = route.googleRoute.overview_path;

            // Adjust colors for dark mode visibility
            const strokeColor = isSelected
                ? (isDarkMode ? "#60a5fa" : "#2563eb") // Lighter Blue in dark mode
                : (isDarkMode ? "#475569" : "#94a3b8"); // Darker gray in dark mode

            const polyline = new google.maps.Polyline({
                path: path,
                strokeColor: strokeColor,
                strokeOpacity: isSelected ? 1.0 : 0.6,
                strokeWeight: isSelected ? 6 : 4,
                zIndex: isSelected ? 50 : 1,
                clickable: true,
                map: map
            });

            // Add click listener
            polyline.addListener("click", () => {
                if (onSelectRoute) {
                    onSelectRoute(route.id);
                }
            });

            // Add hover effects
            polyline.addListener("mouseover", () => {
                if (!isSelected) {
                    polyline.setOptions({ strokeOpacity: 0.8, strokeWeight: 5 });
                }
            });

            polyline.addListener("mouseout", () => {
                if (!isSelected) {
                    polyline.setOptions({ strokeOpacity: 0.6, strokeWeight: 4 });
                }
            });

            polylinesRef.current.push(polyline);
        });

        // 3. DRAW MARKERS (Start and End for selected only)
        if (selectedRoute?.googleRoute?.legs?.[0]) {
            const startMarker = new google.maps.Marker({
                position: selectedRoute.googleRoute.legs[0].start_location,
                label: { text: "A", color: "white", fontWeight: "bold" },
                map: map
            });
            const endMarker = new google.maps.Marker({
                position: selectedRoute.googleRoute.legs[0].end_location,
                label: { text: "B", color: "white", fontWeight: "bold" },
                map: map
            });

            markersRef.current.push(startMarker, endMarker);
        }

    }, [map, routes, selectedRouteId, selectedRoute, onSelectRoute, isDarkMode]); // Added isDarkMode dependency

    return (
        <div className="h-full w-full z-0 relative">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={10}
                center={{ lat: 20.5937, lng: 78.9629 }}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={options}
            >
                {/* No declarative children anymore */}
            </GoogleMap>
        </div>
    );
}
