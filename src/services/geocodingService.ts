export interface LocationResult {
    lat: number;
    lon: number;
    display_name: string;
}

export const geocodeLocation = async (query: string): Promise<LocationResult | null> => {
    if (!query) return null;

    // Ensure Google Maps API is loaded
    if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded");
        return null;
    }

    const geocoder = new google.maps.Geocoder();

    try {
        const response = await geocoder.geocode({ address: query });

        if (response.results && response.results.length > 0) {
            const result = response.results[0];
            return {
                lat: result.geometry.location.lat(),
                lon: result.geometry.location.lng(),
                display_name: result.formatted_address
            };
        }

        console.warn("Geocoding found no results.");
        return null;

    } catch (error) {
        console.error("Geocoding failed", error);
        return null;
    }
};
