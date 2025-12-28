import { GoogleMap } from '@react-google-maps/api';
import { Route } from '../types';
import { useState, useEffect, useRef } from 'react';

interface MapComponentProps {
    routes: Route[];
    selectedRouteId?: string;
    onSelectRoute?: (id: string) => void;
}

const mapContainerStyle = {
    height: "400px",
    width: "100%",
    borderRadius: "0.75rem"
};

const options = {
    disableDefaultUI: true,
    zoomControl: true,
    minZoom: 2,
};

export function MapComponent({ routes, selectedRouteId, onSelectRoute }: MapComponentProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const polylinesRef = useRef<google.maps.Polyline[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

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

        // 2. DRAW ROUTES (Blue for selected, Gray for others)
        routes.forEach(route => {
            if (!route.googleRoute?.overview_path) return;

            const isSelected = route.id === selectedRouteId;

            // Robust conversion to LatLngLiteral if needed, though Maps API usually handles the object fine if it's already one.
            // Using the raw path from googleRoute for efficiency if possible, but the previous code mapped it manually.
            const path = route.googleRoute.overview_path;

            const polyline = new google.maps.Polyline({
                path: path,
                strokeColor: isSelected ? "#2563eb" : "#94a3b8", // Blue : Gray
                strokeOpacity: isSelected ? 1.0 : 0.6,
                strokeWeight: isSelected ? 6 : 4,
                zIndex: isSelected ? 50 : 1,
                clickable: true, // Enable clicking
                map: map // Attach to map immediately
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

    }, [map, routes, selectedRouteId, selectedRoute, onSelectRoute]); // Re-run when routes or selection change

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border-2 border-white z-0 relative">
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
