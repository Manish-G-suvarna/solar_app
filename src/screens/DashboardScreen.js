import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { CurvedGraph } from '../components/CurvedGraph';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

// Maps OWM condition string -> Ionicons name + colour
const getWeatherIcon = (condition = '') => {
  const c = condition.toLowerCase();
  if (c.includes('clear'))       return { name: 'sunny',         color: '#F59E0B' };
  if (c.includes('few clouds') ||
      c.includes('scattered'))   return { name: 'partly-sunny',  color: '#FBBF24' };
  if (c.includes('cloud') ||
      c.includes('overcast'))    return { name: 'cloudy',         color: '#94A3B8' };
  if (c.includes('drizzle') ||
      c.includes('rain'))        return { name: 'rainy',          color: '#60A5FA' };
  if (c.includes('thunder') ||
      c.includes('storm'))       return { name: 'thunderstorm',   color: '#7C3AED' };
  if (c.includes('snow'))        return { name: 'snow',           color: '#BAE6FD' };
  if (c.includes('mist') ||
      c.includes('fog') ||
      c.includes('haze'))        return { name: 'water',          color: '#94A3B8' };
  return { name: 'sunny', color: '#F59E0B' };
};

export const DashboardScreen = ({ navigation }) => {
  const scrollRef = useRef(null);

  const {
    currentPower,
    todayEnergy,
    totalEnergy,
    efficiency,
    batteryLevel,
    isCharging,
    location,
    weather,
    weatherLoading,
    weatherError,
    refreshWeather,
    detectDeviceLocationAndWeather,
    fetchWeatherForCity,
    panelAngle,
    espConfig,
    pumpOn,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [cityInput, setCityInput] = useState('');

  // Interactive Power Card state
  const [powerTimeframe, setPowerTimeframe] = useState('Today'); // 'Live' | 'Today' | 'Week' | 'Month'
  const [inspectedPoint, setInspectedPoint] = useState(null); // { idx, val, time } | null
  const [liveStreamActive, setLiveStreamActive] = useState(true);
  const [livePowerVal, setLivePowerVal] = useState(currentPower || 2.45);

  // Micro-fluctuation simulation for Live mode
  useEffect(() => {
    if (!liveStreamActive || powerTimeframe !== 'Live') return;
    const interval = setInterval(() => {
      setLivePowerVal((prev) => {
        const delta = (Math.random() - 0.48) * 0.06;
        return Math.max(2.15, Math.min(2.78, +(prev + delta).toFixed(2)));
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [liveStreamActive, powerTimeframe]);

  const powerDatasets = {
    Live: {
      data: [2.36, 2.41, 2.45, 2.42, 2.48, 2.44, livePowerVal],
      labels: ['-30m', '-20m', '-15m', '-10m', '-5m', '-2m', 'Now'],
      timeDetails: ['30 min ago', '20 min ago', '15 min ago', '10 min ago', '5 min ago', '2 min ago', 'Live Now'],
      peak: '2.48 kW',
      avg: '2.43 kW',
      loadPct: Math.round((livePowerVal / 3.2) * 100),
    },
    Today: {
      data: [0.35, 0.85, 1.55, currentPower || 2.45, 2.25, 1.65, 0.95, 0.25],
      labels: ['06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h'],
      timeDetails: ['06:00 AM', '08:00 AM', '10:00 AM', '12:00 PM (Peak)', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'],
      peak: `${currentPower || 2.45} kW`,
      avg: '1.29 kW',
      loadPct: 76,
    },
    Week: {
      data: [2.15, 2.60, 2.40, 2.85, 2.30, 2.92, currentPower || 2.45],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeDetails: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday (Peak)', 'Sunday (Today)'],
      peak: '2.92 kW',
      avg: '2.52 kW',
      loadPct: 91,
    },
    Month: {
      data: [2.20, 2.55, 2.78, 2.45],
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      timeDetails: ['Week 1 (Oct 1-7)', 'Week 2 (Oct 8-14)', 'Week 3 (Oct 15-21)', 'Week 4 (Current)'],
      peak: '2.78 kW',
      avg: '2.49 kW',
      loadPct: 86,
    },
  };

  const currentDataset = powerDatasets[powerTimeframe] || powerDatasets.Today;
  const displayPower = inspectedPoint ? inspectedPoint.val : (powerTimeframe === 'Live' ? livePowerVal : (currentPower || 2.45));

  const icon = getWeatherIcon(weather.condition);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        title="Dashboard"
        showBack={false}
        leftIcon="home"
        onLeftPress={() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
        navigation={navigation}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Status Banner */}
        <TouchableOpacity
          style={styles.statusBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('FaultsMaintenance')}
        >
          <View style={styles.statusIconBox}>
            <Ionicons
              name={espConfig?.connected ? "wifi" : "checkmark-circle-outline"}
              size={22}
              color={espConfig?.connected ? Colors.primary : Colors.success}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {espConfig?.connected ? `ESP32 Tracker Online (${espConfig.ip})` : 'System Status'}
            </Text>
            <Text style={styles.statusSub}>
              {espConfig?.connected
                ? `Servo: ${panelAngle}° • Temp: ${espConfig.hardwareTemp}°C • Pump: ${pumpOn ? 'ON' : 'OFF'}`
                : 'All systems normal (ESP32 Standby)'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          {/* Top row: icon + temp + location controls */}
          <View style={styles.weatherTopRow}>
            <View style={styles.weatherLeft}>
              {weatherLoading ? (
                <ActivityIndicator size={38} color={Colors.primary} />
              ) : (
                <Ionicons name={icon.name} size={42} color={icon.color} />
              )}
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.tempText}>
                  {weather.temp}°C
                </Text>
                <Text style={styles.conditionText}>
                  {weatherError ? 'Unavailable' : (weather.description || weather.condition)}
                </Text>
              </View>
            </View>

            <View style={styles.weatherTopRight}>
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={13} color={Colors.primary} />
                <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>

              <View style={styles.weatherActionsRow}>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={detectDeviceLocationAndWeather}
                  disabled={weatherLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="navigate"
                    size={14}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={refreshWeather}
                  disabled={weatherLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="refresh"
                    size={14}
                    color={weatherLoading ? Colors.textMuted : Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom row: humidity / wind / feels like */}
          {!weatherError && (
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Ionicons name="water-outline" size={14} color="#60A5FA" />
                <Text style={styles.weatherStatVal}>{weather.humidity}%</Text>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherStatDivider} />
              <View style={styles.weatherStat}>
                <Ionicons name="speedometer-outline" size={14} color="#34D399" />
                <Text style={styles.weatherStatVal}>{weather.windSpeed} km/h</Text>
                <Text style={styles.weatherStatLabel}>Wind</Text>
              </View>
              <View style={styles.weatherStatDivider} />
              <View style={styles.weatherStat}>
                <Ionicons name="thermometer-outline" size={14} color="#F87171" />
                <Text style={styles.weatherStatVal}>{weather.feelsLike}°C</Text>
                <Text style={styles.weatherStatLabel}>Feels Like</Text>
              </View>
            </View>
          )}

          {weatherError && (
            <Text style={styles.weatherErrorText}>
              {weatherError} (tap ↻ to retry)
            </Text>
          )}
        </View>

        {/* Current Power Interactive Card */}
        <View style={styles.powerCard}>
          {/* Header Row: Label & Value + Live/Load Tag */}
          <View style={styles.powerHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.powerLabel}>
                  {inspectedPoint
                    ? `Inspecting: ${inspectedPoint.time}`
                    : (powerTimeframe === 'Live' ? 'Real-Time Power Output' : `${powerTimeframe}'s Power Output`)}
                </Text>
                {inspectedPoint && (
                  <TouchableOpacity
                    onPress={() => setInspectedPoint(null)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={styles.resetInspectPill}
                  >
                    <Text style={styles.resetInspectPillText}>✕ Reset</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.powerValueRow}>
                <Text style={styles.powerValue}>{displayPower}</Text>
                <Text style={styles.powerUnit}>kW</Text>
                {powerTimeframe === 'Live' && (
                  <Text style={styles.powerWattsSub}>
                    ({Math.round(displayPower * 1000)} W)
                  </Text>
                )}
              </View>
            </View>

            {/* Live Indicator (interactive pause/resume) or Load Badge */}
            {powerTimeframe === 'Live' ? (
              <TouchableOpacity
                style={[styles.liveTag, !liveStreamActive && styles.liveTagPaused]}
                onPress={() => setLiveStreamActive(!liveStreamActive)}
                activeOpacity={0.8}
              >
                <View style={[styles.liveDot, !liveStreamActive && styles.liveDotPaused]} />
                <Text style={[styles.liveText, !liveStreamActive && styles.liveTextPaused]}>
                  {liveStreamActive ? 'Live' : 'Paused'}
                </Text>
                <Ionicons
                  name={liveStreamActive ? 'pause' : 'play'}
                  size={10}
                  color={liveStreamActive ? Colors.success : Colors.warning}
                  style={{ marginLeft: 3 }}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.loadBadge}>
                <Ionicons name="flash" size={11} color={Colors.primary} style={{ marginRight: 2 }} />
                <Text style={styles.loadBadgeText}>{currentDataset.loadPct}% Load</Text>
              </View>
            )}
          </View>

          {/* Timeframe Filter Tabs */}
          <View style={styles.timeframeTabsRow}>
            {['Live', 'Today', 'Week', 'Month'].map((tab) => {
              const active = powerTimeframe === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.timeframeTab, active && styles.timeframeTabActive]}
                  onPress={() => {
                    setPowerTimeframe(tab);
                    setInspectedPoint(null);
                  }}
                  activeOpacity={0.75}
                >
                  {tab === 'Live' && (
                    <View style={[styles.tabLiveDot, active && styles.tabLiveDotActive]} />
                  )}
                  <Text style={[styles.timeframeTabText, active && styles.timeframeTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Curved Graph with Touch Inspector */}
          <View style={styles.graphWrapper}>
            <CurvedGraph
              width={320}
              height={145}
              data={currentDataset.data}
              labels={currentDataset.labels}
              timeDetails={currentDataset.timeDetails}
              peakValue={currentDataset.peak}
              selectedIndex={inspectedPoint ? inspectedPoint.idx : null}
              onSelectPoint={(idx, val, time) => setInspectedPoint({ idx, val, time })}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.graphHintText}>
            💡 Slide or tap points along the curve to inspect generation
          </Text>

          {/* Inverter Load Rating Progress Bar */}
          <View style={styles.loadBarSection}>
            <View style={styles.loadBarHeader}>
              <Text style={styles.loadBarTitle}>Inverter Load Rating</Text>
              <Text style={styles.loadBarValue}>{currentDataset.loadPct}% of 3.2 kW max</Text>
            </View>
            <View style={styles.loadBarTrack}>
              <View
                style={[
                  styles.loadBarFill,
                  { width: `${Math.min(currentDataset.loadPct, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Key Metrics Strip (3 Stat Badges) */}
          <View style={styles.powerStatsStrip}>
            <View style={styles.powerStatCard}>
              <Text style={styles.powerStatLabel}>Peak Output</Text>
              <Text style={styles.powerStatVal}>{currentDataset.peak}</Text>
              <View style={styles.powerStatTrend}>
                <Ionicons name="trending-up" size={11} color={Colors.success} />
                <Text style={styles.powerStatTrendText}>Optimal</Text>
              </View>
            </View>

            <View style={styles.powerStatDivider} />

            <View style={styles.powerStatCard}>
              <Text style={styles.powerStatLabel}>Average Power</Text>
              <Text style={styles.powerStatVal}>{currentDataset.avg}</Text>
              <Text style={styles.powerStatSub}>Period avg</Text>
            </View>

            <View style={styles.powerStatDivider} />

            <View style={styles.powerStatCard}>
              <Text style={styles.powerStatLabel}>Sun Tracker</Text>
              <Text style={styles.powerStatVal}>{panelAngle}°</Text>
              <View style={styles.powerStatTrend}>
                <Ionicons name="sunny-outline" size={11} color="#F59E0B" />
                <Text style={[styles.powerStatTrendText, { color: '#F59E0B' }]}>Tracking</Text>
              </View>
            </View>
          </View>

          {/* Detailed Analytics Shortcut Link */}
          <TouchableOpacity
            style={styles.analyticsLinkRow}
            onPress={() => navigation.navigate('EnergyAnalytics')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
              <Text style={styles.analyticsLinkText}>View Detailed Energy Analytics</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 2x2 Grid Stat Cards */}
        <View style={styles.gridContainer}>
          {/* Today's Energy */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('EnergyAnalytics')}
          >
            <View style={styles.gridIconBox}>
              <Ionicons name="flash-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.gridLabel}>Today's Energy</Text>
            <View style={styles.gridValueRow}>
              <Text style={styles.gridValue}>{todayEnergy}</Text>
              <Text style={styles.gridUnit}>kWh</Text>
            </View>
          </TouchableOpacity>

          {/* Total Energy */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('EnergyAnalytics')}
          >
            <View style={styles.gridIconBox}>
              <Ionicons name="bar-chart-outline" size={20} color={Colors.info} />
            </View>
            <Text style={styles.gridLabel}>Total Energy</Text>
            <View style={styles.gridValueRow}>
              <Text style={styles.gridValue}>{totalEnergy}</Text>
              <Text style={styles.gridUnit}>MWh</Text>
            </View>
          </TouchableOpacity>

          {/* Efficiency */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('AIInsights')}
          >
            <View style={styles.gridIconBox}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.gridLabel}>Efficiency</Text>
            <View style={styles.gridValueRow}>
              <Text style={styles.gridValue}>{efficiency}%</Text>
            </View>
          </TouchableOpacity>

          {/* Battery */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('LivePanelStatus')}
          >
            <View style={styles.gridIconBox}>
              <MaterialCommunityIcons name="battery-charging-60" size={22} color={Colors.success} />
            </View>
            <Text style={styles.gridLabel}>Battery</Text>
            <View style={styles.gridValueRow}>
              <Text style={styles.gridValue}>{batteryLevel}%</Text>
            </View>
            <Text style={styles.gridSub}>{isCharging ? 'Charging' : 'Discharging'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Selector Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>Solar Site Location</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Fetch real-time weather & temperature for your solar panels
            </Text>

            {/* GPS Auto-detect button */}
            <TouchableOpacity
              style={styles.gpsButton}
              activeOpacity={0.85}
              onPress={async () => {
                setModalVisible(false);
                await detectDeviceLocationAndWeather();
              }}
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.gpsButtonText}>Use Current GPS Location</Text>
            </TouchableOpacity>

            <View style={styles.modalDividerRow}>
              <View style={styles.modalDividerLine} />
              <Text style={styles.modalDividerText}>OR ENTER CITY</Text>
              <View style={styles.modalDividerLine} />
            </View>

            {/* City search input */}
            <View style={styles.cityInputRow}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.cityInput}
                placeholder="e.g. Mumbai, London, Berlin"
                placeholderTextColor={Colors.textMuted}
                value={cityInput}
                onChangeText={setCityInput}
                returnKeyType="search"
                onSubmitEditing={async () => {
                  if (cityInput.trim()) {
                    setModalVisible(false);
                    await fetchWeatherForCity(cityInput);
                    setCityInput('');
                  }
                }}
              />
              <TouchableOpacity
                style={styles.citySearchBtn}
                onPress={async () => {
                  if (cityInput.trim()) {
                    setModalVisible(false);
                    await fetchWeatherForCity(cityInput);
                    setCityInput('');
                  }
                }}
              >
                <Text style={styles.citySearchBtnText}>Go</Text>
              </TouchableOpacity>
            </View>

            {/* Quick city suggestions */}
            <Text style={styles.suggestionsLabel}>Popular Solar Hubs:</Text>
            <View style={styles.suggestionChips}>
              {['Bangalore', 'Delhi', 'Jaipur', 'Ahmedabad', 'London', 'Dubai'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.suggestionChip}
                  onPress={async () => {
                    setModalVisible(false);
                    await fetchWeatherForCity(city);
                  }}
                >
                  <Text style={styles.suggestionChipText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statusSub: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  /* â”€â”€ Weather Card â”€â”€ */
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  conditionText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  weatherTopRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: 150,
  },
  locationText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginLeft: 3,
  },
  weatherActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 5,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  /* Weather bottom stats */
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  weatherStat: {
    alignItems: 'center',
    gap: 3,
  },
  weatherStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  weatherStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  weatherStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    alignSelf: 'stretch',
  },
  weatherErrorText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  /* ── Power Card ── */
  powerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  powerLabel: {
    fontSize: 13,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  resetInspectPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resetInspectPillText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  powerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  powerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  powerUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMedium,
    marginLeft: 4,
  },
  powerWattsSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 6,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveTagPaused: {
    backgroundColor: '#FEF3C7',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
    marginRight: 5,
  },
  liveDotPaused: {
    backgroundColor: Colors.warning,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  liveTextPaused: {
    color: Colors.warning,
  },
  loadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  loadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeframeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 9,
  },
  timeframeTabActive: {
    backgroundColor: Colors.primary,
    elevation: 1,
  },
  tabLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.success,
    marginRight: 4,
  },
  tabLiveDotActive: {
    backgroundColor: '#FFFFFF',
  },
  timeframeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  timeframeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  graphWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphHintText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  loadBarSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  loadBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  loadBarTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  loadBarValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  loadBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  powerStatsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  powerStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  powerStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  powerStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  powerStatSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  powerStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  powerStatTrendText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  powerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  analyticsLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  analyticsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  /* ── Grid Cards ── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  gridValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  gridUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
    marginLeft: 4,
  },
  gridSub: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  /* ── Location Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  modalDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  modalDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  cityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  cityInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    paddingVertical: 6,
  },
  citySearchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  citySearchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
    marginTop: 14,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  suggestionChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
