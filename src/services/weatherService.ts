export interface WeatherData {
    temperature: number;
    condition: string;
    isRaining: boolean;
    isDay: boolean;
    isCloudy: boolean;
    isPartlyCloudy: boolean;
    isSnowing: boolean;
    isThunder: boolean;
    forecastSummary: string;
}

export const fetchWeather = async (): Promise<WeatherData> => {
    try {
        // Use 'Wollongong' for a more stable and accurate regional weather reading
        const LOCATION = "Wollongong";

        const apiKey = import.meta.env.VITE_WEATHERAPI_KEY;

        if (!apiKey) {
            console.warn("No VITE_WEATHERAPI_KEY found. Weather cannot be loaded.");
            throw new Error("Missing Weather API key");
        }

        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${LOCATION}&days=1&aqi=no&alerts=no`
        );

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
        }

        const data = await response.json();

        const current = data.current;
        const temp = Math.round(current.temp_c);
        const conditionText = current.condition.text;
        const conditionCode = current.condition.code;

        // WeatherAPI Condition Codes (1180-1201 are rain/showers, 1240-1246 are heavy showers, 1273-1276 are thunderstorms with rain)
        // 1063 is "Patchy rain possible" and 1150-1153 are light drizzle, which we'll ignore for a "Raining" UI state unless precip is measurable.
        const rainCodes = [
            1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, // Rain
            1240, 1243, 1246, // Showers
            1273, 1276 // Thunderstorms with rain
        ];

        const isLiteralRainCode = rainCodes.includes(conditionCode);
        const isRaining = isLiteralRainCode || current.precip_mm > 0.5;
        const isDay = current.is_day === 1;
        
        const isCloudy = [1006, 1009, 1030, 1135, 1148].includes(conditionCode);
        const isPartlyCloudy = conditionCode === 1003;
        const isSnowing = [1066, 1069, 1072, 1114, 1117, 1168, 1171, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282].includes(conditionCode);
        const isThunder = [1087, 1273, 1276, 1279, 1282].includes(conditionCode);

        const maxTemp = Math.round(data.forecast.forecastday[0].day.maxtemp_c);
        const minTemp = Math.round(data.forecast.forecastday[0].day.mintemp_c);
        const forecastSummary = `High of ${maxTemp}°C, Low of ${minTemp}°C.`;

        return {
            temperature: temp,
            condition: conditionText,
            isRaining,
            isDay,
            isCloudy,
            isPartlyCloudy,
            isSnowing,
            isThunder,
            forecastSummary,
        };
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        return {
            temperature: 0,
            condition: "Unknown",
            isRaining: false,
            isDay: true,
            isCloudy: false,
            isPartlyCloudy: false,
            isSnowing: false,
            isThunder: false,
            forecastSummary: "Unable to load forecast",
        };
    }
};
