import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

// ── Weather condition helpers (WMO standard) ────────────────────────────────
const WMO = {
  0:  { label: 'Clear Sky',       icon: 'sunny',            color: '#F59E0B', bg: ['#FEF3C7','#FDE68A'] },
  1:  { label: 'Mainly Clear',    icon: 'partly-sunny',     color: '#FBBF24', bg: ['#FEF9EE','#FEF3C7'] },
  2:  { label: 'Partly Cloudy',   icon: 'partly-sunny',     color: '#F5A623', bg: ['#F0F9FF','#E0F2FE'] },
  3:  { label: 'Overcast',        icon: 'cloudy',           color: '#94A3B8', bg: ['#F1F5F9','#E2E8F0'] },
  45: { label: 'Foggy',           icon: 'cloud',            color: '#94A3B8', bg: ['#F8FAFC','#F1F5F9'] },
  48: { label: 'Icy Fog',         icon: 'cloud',            color: '#BAE6FD', bg: ['#F0F9FF','#E0F2FE'] },
  51: { label: 'Light Drizzle',   icon: 'rainy-outline',    color: '#60A5FA', bg: ['#EFF6FF','#DBEAFE'] },
  53: { label: 'Drizzle',         icon: 'rainy-outline',    color: '#3B82F6', bg: ['#EFF6FF','#DBEAFE'] },
  55: { label: 'Heavy Drizzle',   icon: 'rainy',            color: '#2563EB', bg: ['#EFF6FF','#DBEAFE'] },
  61: { label: 'Light Rain',      icon: 'rainy-outline',    color: '#60A5FA', bg: ['#EFF6FF','#DBEAFE'] },
  63: { label: 'Rain',            icon: 'rainy',            color: '#3B82F6', bg: ['#EFF6FF','#DBEAFE'] },
  65: { label: 'Heavy Rain',      icon: 'rainy',            color: '#1D4ED8', bg: ['#EFF6FF','#DBEAFE'] },
  71: { label: 'Light Snow',      icon: 'snow-outline',     color: '#BAE6FD', bg: ['#F0F9FF','#E0F2FE'] },
  73: { label: 'Snow',            icon: 'snow',             color: '#7DD3FC', bg: ['#F0F9FF','#E0F2FE'] },
  75: { label: 'Heavy Snow',      icon: 'snow',             color: '#38BDF8', bg: ['#F0F9FF','#E0F2FE'] },
  80: { label: 'Showers',         icon: 'rainy',            color: '#60A5FA', bg: ['#EFF6FF','#DBEAFE'] },
  81: { label: 'Showers',         icon: 'rainy',            color: '#3B82F6', bg: ['#EFF6FF','#DBEAFE'] },
  82: { label: 'Heavy Showers',   icon: 'rainy',            color: '#1D4ED8', bg: ['#EFF6FF','#DBEAFE'] },
  95: { label: 'Thunderstorm',    icon: 'thunderstorm',     color: '#7C3AED', bg: ['#F5F3FF','#EDE9FE'] },
  96: { label: 'T-Storm w/ Hail', icon: 'thunderstorm',     color: '#6D28D9', bg: ['#F5F3FF','#EDE9FE'] },
  99: { label: 'T-Storm w/ Hail', icon: 'thunderstorm',     color: '#5B21B6', bg: ['#F5F3FF','#EDE9FE'] },
};

const getWMO = (code) => WMO[code] || WMO[0];

// UV Index → label + color
const uvInfo = (uv) => {
  if (uv <= 2) return { label: 'Low', color: '#22C55E' };
  if (uv <= 5) return { label: 'Moderate', color: '#F59E0B' };
  if (uv <= 7) return { label: 'High', color: '#EF4444' };
  if (uv <= 10) return { label: 'Very High', color: '#7C3AED' };
  return { label: 'Extreme', color: '#B91C1C' };
};

// Solar generation estimate for 12W panel (Wh/day)
const solarEstimate = (weatherCode, uvMax) => {
  const c = weatherCode;
  if (c === 0 || c === 1) return Math.round(uvMax * 6.5);
  if (c === 2 || c === 3) return Math.round(uvMax * 3.8);
  if (c >= 45 && c <= 55) return Math.round(uvMax * 2.0);
  if (c >= 60 && c <= 67) return Math.round(uvMax * 1.2);
  if (c >= 70 && c <= 77) return Math.round(uvMax * 0.8);
  if (c >= 80)            return Math.round(uvMax * 1.0);
  return Math.round(uvMax * 4.0);
};

// Day-of-week formatting
const dayName = (dateStr, idx) => {
  if (idx === 0) return 'Today';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
};

const shortDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Main Component ───────────────────────────────────────────────────────────
export const WeatherForecastScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { weather, location, setLocation, coords } = useApp();

  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    fetchAccurateForecast(false);
  }, []);

  // ── Accurate Current Location & 7-Day Forecast Resolver ───────────────────
  const fetchAccurateForecast = async (forceGps = false) => {
    setLoading(true);
    setError(null);

    try {
      let lat = null;
      let lon = null;
      let resolvedCityName = null;
      let isGps = false;

      // 1. First Priority: Try live device GPS
      try {
        let hasPermission = false;
        if (forceGps) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          hasPermission = status === 'granted';
        } else {
          const { status } = await Location.getForegroundPermissionsAsync();
          hasPermission = status === 'granted';
          if (!hasPermission) {
            const req = await Location.requestForegroundPermissionsAsync();
            hasPermission = req.status === 'granted';
          }
        }

        if (hasPermission) {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = position.coords.latitude;
          lon = position.coords.longitude;
          isGps = true;

          // Reverse geocode to get exact current city
          try {
            const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            if (geo && geo.length > 0) {
              const place = geo[0];
              const city = place.city || place.subregion || place.district || place.name;
              const region = place.region || place.country;
              resolvedCityName = city ? (region ? `${city}, ${region}` : city) : null;
              if (city && typeof setLocation === 'function') {
                setLocation(resolvedCityName);
              }
            }
          } catch (geoErr) {
            console.log('Reverse geocoding notice:', geoErr);
          }
        }
      } catch (gpsErr) {
        console.log('GPS detection fallback:', gpsErr);
      }

      // 2. Second Priority: Use coords from AppContext if set
      if ((lat === null || lon === null) && coords && coords.latitude && coords.longitude) {
        lat = coords.latitude;
        lon = coords.longitude;
        resolvedCityName = location;
        isGps = true;
      }

      // 3. Third Priority: OpenWeatherMap Geocoding for current city name
      if (lat === null || lon === null) {
        const queryCity = typeof location === 'string' && location.trim() ? location.trim() : 'Bangalore';
        const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY || 'c08af98ffc9dbcd88f423efea3a31729';

        try {
          const owmGeoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(queryCity)}&limit=1&appid=${apiKey}`;
          const owmGeoRes = await fetch(owmGeoUrl);
          const owmGeoData = await owmGeoRes.json();
          if (Array.isArray(owmGeoData) && owmGeoData.length > 0) {
            lat = owmGeoData[0].lat;
            lon = owmGeoData[0].lon;
            resolvedCityName = `${owmGeoData[0].name}${owmGeoData[0].country ? ', ' + owmGeoData[0].country : ''}`;
          }
        } catch (owmGeoErr) {
          console.log('OWM Geo error:', owmGeoErr);
        }
      }

      // 4. Fourth Priority: Open-Meteo Geocoding
      if (lat === null || lon === null) {
        const cleanName = (typeof location === 'string' ? location.split(',')[0] : 'Bengaluru').trim();
        try {
          const omGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=en&format=json`);
          const omGeoData = await omGeoRes.json();
          if (omGeoData?.results?.length > 0) {
            lat = omGeoData.results[0].latitude;
            lon = omGeoData.results[0].longitude;
            resolvedCityName = omGeoData.results[0].name + (omGeoData.results[0].country ? ', ' + omGeoData.results[0].country : '');
          }
        } catch (omGeoErr) {
          console.log('Open-Meteo Geo error:', omGeoErr);
        }
      }

      // 5. Default Coords if completely unavailable (Bangalore)
      if (lat === null || lon === null) {
        lat = 12.9716;
        lon = 77.5946;
        resolvedCityName = 'Bangalore, India';
      }

      if (!resolvedCityName) {
        resolvedCityName = location || 'Current Location';
      }

      // ── Fetch 7-Day Daily & Hourly Forecast for exact lat/lon ────────────────
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,` +
        `precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset` +
        `&hourly=temperature_2m,weathercode,precipitation_probability` +
        `&current_weather=true&timezone=auto&forecast_days=7`;

      const res = await fetch(forecastUrl);
      const data = await res.json();
      if (!data.daily) throw new Error('No daily forecast data available');

      // Determine live current temperature and condition
      let liveTemp = data.current_weather ? Math.round(data.current_weather.temperature) : 25;
      let liveCondition = data.current_weather ? getWMO(data.current_weather.weathercode).label : 'Clear';

      if (weather && weather.temp && weather.temp !== '--') {
        liveTemp = weather.temp;
        if (weather.condition && weather.condition !== 'Loading...') {
          liveCondition = weather.description || weather.condition;
        }
      }

      // Format 7-Day array
      const days = data.daily.time.map((date, i) => ({
        date,
        code: data.daily.weathercode[i],
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precip: Math.round((data.daily.precipitation_sum?.[i] || 0) * 10) / 10,
        precipProb: data.daily.precipitation_probability_max?.[i] || 0,
        windMax: Math.round(data.daily.windspeed_10m_max?.[i] || 0),
        uvMax: Math.round(data.daily.uv_index_max?.[i] || 5),
        sunrise: data.daily.sunrise?.[i] ? data.daily.sunrise[i].split('T')[1] : '--',
        sunset: data.daily.sunset?.[i] ? data.daily.sunset[i].split('T')[1] : '--',
        solarEst: solarEstimate(data.daily.weathercode[i], data.daily.uv_index_max?.[i] || 5),
      }));

      // Hourly data (24 entries)
      const hours = (data.hourly?.time || []).slice(0, 24).map((t, i) => ({
        time: t.split('T')[1]?.slice(0, 5) || '--',
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weathercode[i],
        precipProb: data.hourly.precipitation_probability?.[i] || 0,
      }));

      setForecast({
        days,
        hours,
        city: resolvedCityName,
        lat,
        lon,
        isGps,
        liveTemp,
        liveCondition,
      });

      setLoading(false);
      animateIn();
    } catch (err) {
      console.error('Forecast retrieval error:', err);
      setError('Unable to load current location weather. Tap below to retry.');
      setLoading(false);
    }
  };

  // ── Temperature bar visualizer ───────────────────────────────────────────
  const TempBar = ({ min, max, globalMin, globalMax }) => {
    const range = globalMax - globalMin || 1;
    const leftPct = (min - globalMin) / range;
    const widthPct = (max - min) / range;
    return (
      <View style={styles.tempBarTrack}>
        <View style={[styles.tempBarFill, { marginLeft: `${leftPct * 100}%`, width: `${widthPct * 100}%` }]} />
      </View>
    );
  };

  // Current day hero data
  const heroDay = forecast?.days?.[selectedDay];
  const heroWMO = heroDay ? getWMO(heroDay.code) : getWMO(0);
  const heroGrad = heroWMO.bg;

  const globalMin = forecast ? Math.min(...forecast.days.map((d) => d.tempMin)) : 0;
  const globalMax = forecast ? Math.max(...forecast.days.map((d) => d.tempMax)) : 40;

  return (
    <View style={styles.container}>
      {/* Dynamic atmospheric gradient */}
      <LinearGradient
        colors={[heroGrad[0], heroGrad[1], '#FFFFFF']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Top Header Navigation ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.locationTitleRow}>
            {forecast?.isGps && (
              <Ionicons name="navigate" size={12} color="#2563EB" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.headerCity} numberOfLines={1}>
              {forecast?.city || location || 'Current Location'}
            </Text>
          </View>
          {forecast?.isGps && (
            <Text style={styles.gpsSubtext}>Live GPS Location</Text>
          )}
        </View>

        {/* Action icons: GPS detector + Refresh */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => fetchAccurateForecast(true)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="navigate-circle-outline" size={22} color="#2563EB" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => fetchAccurateForecast(false)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Loading State ── */}
      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Fetching accurate location weather…</Text>
        </View>
      )}

      {/* ── Error State ── */}
      {error && !loading && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={54} color="#94A3B8" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAccurateForecast(true)}>
            <Text style={styles.retryBtnText}>Detect GPS Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Forecast Content ── */}
      {!loading && !error && forecast && (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Hero Weather Section (Apple Weather Style) ── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroDay}>{dayName(heroDay.date, selectedDay)}</Text>
            <Text style={styles.heroDate}>{shortDate(heroDay.date)}</Text>

            <Ionicons name={heroWMO.icon} size={82} color={heroWMO.color} style={styles.heroIcon} />

            {/* If Today: show live current temp; If future day: show forecasted high */}
            <Text style={styles.heroTemp}>
              {selectedDay === 0 ? forecast.liveTemp : heroDay.tempMax}°
            </Text>

            {/* Apple Weather style: High / Low / Condition */}
            <Text style={styles.heroLow}>
              {selectedDay === 0
                ? `H: ${heroDay.tempMax}°  ·  L: ${heroDay.tempMin}°  ·  ${forecast.liveCondition}`
                : `High: ${heroDay.tempMax}°  ·  Low: ${heroDay.tempMin}°  ·  ${heroWMO.label}`}
            </Text>

            {/* Key Telemetry Pill Row */}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Ionicons name="water-outline" size={16} color="#60A5FA" />
                <Text style={styles.heroStatVal}>{heroDay.precipProb}%</Text>
                <Text style={styles.heroStatLabel}>Rain Prob</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Ionicons name="speedometer-outline" size={16} color="#34D399" />
                <Text style={styles.heroStatVal}>{heroDay.windMax} km/h</Text>
                <Text style={styles.heroStatLabel}>Wind</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                <Text style={styles.heroStatVal}>{heroDay.uvMax}</Text>
                <Text style={[styles.heroStatLabel, { color: uvInfo(heroDay.uvMax).color }]}>
                  UV {uvInfo(heroDay.uvMax).label}
                </Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Ionicons name="flash-outline" size={16} color="#A78BFA" />
                <Text style={styles.heroStatVal}>{heroDay.solarEst} Wh</Text>
                <Text style={styles.heroStatLabel}>12W Solar</Text>
              </View>
            </View>

            {/* Sunrise / Sunset */}
            <View style={styles.sunTimesRow}>
              <View style={styles.sunTime}>
                <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
                <Text style={styles.sunTimeText}>Sunrise {heroDay.sunrise}</Text>
              </View>
              <View style={styles.sunTimeDot} />
              <View style={styles.sunTime}>
                <Ionicons name="moon-outline" size={14} color="#7C3AED" />
                <Text style={styles.sunTimeText}>Sunset {heroDay.sunset}</Text>
              </View>
            </View>
          </View>

          {/* ── 24-Hour Hourly Scroll (Today) ── */}
          {selectedDay === 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={15} color="#64748B" />
                <Text style={styles.sectionTitle}> Hourly Progression</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
                {forecast.hours.map((h, i) => {
                  const hw = getWMO(h.code);
                  return (
                    <View key={i} style={styles.hourCell}>
                      <Text style={styles.hourTime}>{h.time}</Text>
                      <Ionicons name={hw.icon} size={22} color={hw.color} style={{ marginVertical: 6 }} />
                      <Text style={styles.hourTemp}>{h.temp}°</Text>
                      {h.precipProb > 10 ? (
                        <Text style={styles.hourPrecip}>{h.precipProb}%</Text>
                      ) : (
                        <View style={{ height: 14 }} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── 7-Day Apple Weather Style List ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar-outline" size={15} color="#64748B" />
              <Text style={styles.sectionTitle}> 7-Day Forecast</Text>
            </View>
            {forecast.days.map((day, i) => {
              const dw = getWMO(day.code);
              const isSelected = selectedDay === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayRow, isSelected && styles.dayRowSelected]}
                  onPress={() => setSelectedDay(i)}
                  activeOpacity={0.7}
                >
                  {/* Day Label */}
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                    {dayName(day.date, i)}
                  </Text>

                  {/* Precipitation indicator */}
                  <View style={styles.precipBadge}>
                    {day.precipProb > 10 ? (
                      <>
                        <Ionicons name="water" size={10} color="#60A5FA" />
                        <Text style={styles.precipText}>{day.precipProb}%</Text>
                      </>
                    ) : (
                      <View style={{ width: 34 }} />
                    )}
                  </View>

                  {/* Weather Icon */}
                  <Ionicons name={dw.icon} size={24} color={dw.color} style={styles.dayIcon} />

                  {/* Min Temp */}
                  <Text style={styles.dayTempLow}>{day.tempMin}°</Text>

                  {/* Normalized Temperature Bar */}
                  <View style={styles.tempBarWrapper}>
                    <TempBar min={day.tempMin} max={day.tempMax} globalMin={globalMin} globalMax={globalMax} />
                  </View>

                  {/* Max Temp */}
                  <Text style={styles.dayTempHigh}>{day.tempMax}°</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Solar Generation Prediction for 12V/12W System ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text style={styles.sectionTitle}> 12V/12W Solar Generation Potential</Text>
            </View>
            <Text style={styles.sectionSub}>Estimated Watt-hour yield based on UV & cloud cover</Text>
            {forecast.days.map((day, i) => {
              const dw = getWMO(day.code);
              const maxWh = 72; // theoretical max for 12W panel (6h peak sunlight)
              const pct = Math.min((day.solarEst / maxWh) * 100, 100);
              const barColor = pct > 70 ? '#16A34A' : pct > 40 ? '#F59E0B' : '#64748B';
              return (
                <View key={i} style={styles.solarRow}>
                  <Text style={styles.solarDay}>{dayName(day.date, i)}</Text>
                  <Ionicons name={dw.icon} size={16} color={dw.color} style={{ marginRight: 8 }} />
                  <View style={styles.solarBarTrack}>
                    <View style={[styles.solarBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.solarWh}>{day.solarEst} Wh</Text>
                </View>
              );
            })}
          </View>

          {/* Location Verification Tag */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#94A3B8" />
            <Text style={styles.attribution}>
              {forecast.city} • Coordinates: {forecast.lat.toFixed(2)}°, {forecast.lon.toFixed(2)}°
            </Text>
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFDF9',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCity: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: width * 0.55,
  },
  gpsSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading / Error
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#64748B', marginTop: 8, fontWeight: '500' },
  errorText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    backgroundColor: '#2563EB',
    borderRadius: 22,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  heroDay: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  heroIcon: {
    marginBottom: 2,
  },
  heroTemp: {
    fontSize: 78,
    fontWeight: '200',
    color: '#0F172A',
    lineHeight: 88,
    letterSpacing: -3,
  },
  heroLow: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  sunTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sunTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sunTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sunTimeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  // Section Cards
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: -6,
    marginBottom: 14,
  },

  // Hourly Scroll
  hourlyScroll: {
    marginHorizontal: -4,
  },
  hourCell: {
    alignItems: 'center',
    marginHorizontal: 10,
    minWidth: 46,
  },
  hourTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hourTemp: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  hourPrecip: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 2,
  },

  // 7-Day Rows
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  dayRowSelected: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    width: 48,
  },
  dayNameSelected: {
    color: '#0F172A',
    fontWeight: '800',
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 34,
    gap: 1,
  },
  precipText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
  },
  dayIcon: {
    width: 32,
    textAlign: 'center',
  },
  dayTempLow: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    width: 32,
    textAlign: 'right',
  },
  tempBarWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  tempBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tempBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  dayTempHigh: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    width: 32,
    textAlign: 'right',
  },

  // Solar Rows
  solarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  solarDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    width: 48,
  },
  solarBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  solarBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  solarWh: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    width: 48,
    textAlign: 'right',
  },

  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 10,
  },
  attribution: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
