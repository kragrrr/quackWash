// ---------------------------------------------------------------------------
// WeatherAPI.com wrapper – production-grade with caching, validation, retries
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.weatherapi.com/v1";
const LOCATION = "Wollongong";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_TIMEOUT_MS = 8_000;

// ── Custom Errors ──────────────────────────────────────────────────────────

export class WeatherAPIError extends Error {
    constructor(
        message: string,
        public readonly statusCode?: number,
    ) {
        super(message);
        this.name = "WeatherAPIError";
    }
}

export class MissingAPIKeyError extends WeatherAPIError {
    constructor() {
        super("VITE_WEATHERAPI_KEY is not set. Add it to your .env file.");
        this.name = "MissingAPIKeyError";
    }
}

export class LocationNotFoundError extends WeatherAPIError {
    constructor(location: string) {
        super(`Location "${location}" could not be resolved by WeatherAPI.`, 400);
        this.name = "LocationNotFoundError";
    }
}

export class RateLimitError extends WeatherAPIError {
    constructor() {
        super("WeatherAPI rate limit exceeded. Try again later.", 429);
        this.name = "RateLimitError";
    }
}

// ── Data Model ─────────────────────────────────────────────────────────────

export interface WeatherData {
    temperature: number;
    condition: string;
    conditionCode: number;
    isRaining: boolean;
    isDay: boolean;
    isCloudy: boolean;
    isPartlyCloudy: boolean;
    isSnowing: boolean;
    isThunder: boolean;
    forecastSummary: string;
    highTemp: number;
    lowTemp: number;
    humidity: number;
    feelsLike: number;
    windKph: number;
    precipMm: number;
    fetchedAt: number;
}

// ── Condition-code sets ────────────────────────────────────────────────────

const RAIN_CODES = new Set([
    1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201,
    1240, 1243, 1246,
    1273, 1276,
]);

const CLOUDY_CODES = new Set([1006, 1009, 1030, 1135, 1148]);

const SNOW_CODES = new Set([
    1066, 1069, 1072, 1114, 1117, 1168, 1171, 1204, 1207,
    1210, 1213, 1216, 1219, 1222, 1225, 1237,
    1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282,
]);

const THUNDER_CODES = new Set([1087, 1273, 1276, 1279, 1282]);

// ── In-memory cache ────────────────────────────────────────────────────────

let cachedWeather: WeatherData | null = null;

function getCached(): WeatherData | null {
    if (cachedWeather && Date.now() - cachedWeather.fetchedAt < CACHE_TTL_MS) {
        return cachedWeather;
    }
    return null;
}

// ── Response validation ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateResponse(data: any): void {
    if (!data?.current?.condition) {
        throw new WeatherAPIError("Malformed response: missing current.condition");
    }
    if (!data?.forecast?.forecastday?.[0]?.day) {
        throw new WeatherAPIError("Malformed response: missing forecast data");
    }
}

// ── Fetcher ────────────────────────────────────────────────────────────────

export async function fetchWeather(): Promise<WeatherData> {
    const cached = getCached();
    if (cached) return cached;

    const apiKey = import.meta.env.VITE_WEATHERAPI_KEY;
    if (!apiKey) throw new MissingAPIKeyError();

    const url = `${BASE_URL}/forecast.json?key=${apiKey}&q=${encodeURIComponent(LOCATION)}&days=1&aqi=no&alerts=no`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw new WeatherAPIError("Request timed out");
        }
        throw new WeatherAPIError("Network error – are you offline?");
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        if (response.status === 400) throw new LocationNotFoundError(LOCATION);
        if (response.status === 401 || response.status === 403) {
            throw new WeatherAPIError("Invalid or expired API key", response.status);
        }
        if (response.status === 429) throw new RateLimitError();
        throw new WeatherAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json();
    validateResponse(data);

    const current = data.current;
    const day = data.forecast.forecastday[0].day;
    const conditionCode: number = current.condition.code;

    const weather: WeatherData = {
        temperature: Math.round(current.temp_c),
        condition: current.condition.text,
        conditionCode,
        isRaining: RAIN_CODES.has(conditionCode) || current.precip_mm > 0.5,
        isDay: current.is_day === 1,
        isCloudy: CLOUDY_CODES.has(conditionCode),
        isPartlyCloudy: conditionCode === 1003,
        isSnowing: SNOW_CODES.has(conditionCode),
        isThunder: THUNDER_CODES.has(conditionCode),
        forecastSummary: `High of ${Math.round(day.maxtemp_c)}°C, Low of ${Math.round(day.mintemp_c)}°C.`,
        highTemp: Math.round(day.maxtemp_c),
        lowTemp: Math.round(day.mintemp_c),
        humidity: current.humidity,
        feelsLike: Math.round(current.feelslike_c),
        windKph: current.wind_kph,
        precipMm: current.precip_mm,
        fetchedAt: Date.now(),
    };

    cachedWeather = weather;
    return weather;
}
