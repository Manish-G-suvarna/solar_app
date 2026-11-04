import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { HeaderBar } from '../components/HeaderBar';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const LivePanelStatusScreen = ({ navigation }) => {
  const {
    systemOnline,
    sunTrackingActive,
    panelAngle,
    isCoolingActive,
    isCleaningActive,
    pumpOn,
    espConfig,
    temperature,
  } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Live Panel Status" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Connection Header */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionLeft}>
            <View style={styles.onlineDot} />
            <Text style={styles.connectionText}>
              ESP32 Tracker <Text style={{ fontWeight: '700' }}>{espConfig?.connected ? `Online (${espConfig.ip})` : 'Offline (Sim)'}</Text>
            </Text>
          </View>
          <Feather name="wifi" size={18} color={espConfig?.connected ? Colors.success : Colors.warning} />
        </View>

        {/* Solar Panel Live View Hero Card */}
        <View style={styles.heroCard}>
          <Svg width="100%" height={220} viewBox="0 0 320 220">
            <Defs>
              <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#1E3A8A" />
                <Stop offset="100%" stopColor="#3B82F6" />
              </LinearGradient>
              <LinearGradient id="solarGlass" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#1E293B" />
                <Stop offset="100%" stopColor="#0F172A" />
              </LinearGradient>
            </Defs>

            {/* Sky Background */}
            <Rect x="0" y="0" width="320" height="220" rx="16" fill="url(#skyGrad)" />

            {/* Sun Rays */}
            <Circle cx="260" cy="50" r="30" fill="#FBBF24" opacity="0.9" />
            <Circle cx="260" cy="50" r="50" fill="#FDE047" opacity="0.3" />

            {/* Solar Tracker Mechanical Support Frame */}
            <Path d="M 150 140 L 170 210 L 180 210 L 160 140 Z" fill="#64748B" />
            <Path d="M 120 190 L 200 190 L 195 200 L 125 200 Z" fill="#475569" />

            {/* Angled Solar Array Surface (35 degrees) */}
            <Path d="M 40 130 L 270 70 L 285 140 L 55 200 Z" fill="url(#solarGlass)" stroke="#60A5FA" strokeWidth="2" />

            {/* Array Grid Lines */}
            <Path d="M 155 100 L 170 170" stroke="#3B82F6" strokeWidth="1.5" />
            <Path d="M 95 115 L 110 185" stroke="#3B82F6" strokeWidth="1.5" />
            <Path d="M 215 85 L 230 155" stroke="#3B82F6" strokeWidth="1.5" />
            <Path d="M 50 148 L 278 88" stroke="#3B82F6" strokeWidth="1.5" />
            <Path d="M 46 175 L 282 115" stroke="#3B82F6" strokeWidth="1.5" />
          </Svg>

          {/* Sun Tracking Badge Overlay */}
          <View style={styles.overlayBadge}>
            <Ionicons name="sunny-outline" size={16} color="#FFF" />
            <Text style={styles.overlayBadgeText}>Sun Tracking Active</Text>
            <StatusBadge type="success" label="Active" style={{ marginLeft: 6 }} />
          </View>
        </View>

        {/* Telemetry Metric Cards List */}
        <View style={styles.metricsList}>
          {/* Panel Angle */}
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="angle-acute" size={20} color={Colors.info} />
              </View>
              <Text style={styles.metricLabel}>Panel Angle</Text>
            </View>
            <Text style={styles.metricValue}>{panelAngle}°</Text>
          </View>

          {/* Cleaning Status */}
          <TouchableOpacity
            style={styles.metricRow}
            onPress={() => navigation.navigate('Cleaning')}
          >
            <View style={styles.metricLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sparkles-outline" size={20} color={Colors.warning} />
              </View>
              <Text style={styles.metricLabel}>Cleaning Status</Text>
            </View>
            <StatusBadge
              type={isCleaningActive ? 'Active' : 'Idle'}
              label={isCleaningActive ? 'Cleaning...' : 'Idle'}
            />
          </TouchableOpacity>

          {/* Cooling Status */}
          <TouchableOpacity
            style={styles.metricRow}
            onPress={() => navigation.navigate('Cooling')}
          >
            <View style={styles.metricLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E6F4EA' }]}>
                <Ionicons name="thermometer-outline" size={20} color={Colors.success} />
              </View>
              <Text style={styles.metricLabel}>Cooling Status</Text>
            </View>
            <StatusBadge
              type={isCoolingActive ? 'Active' : 'Idle'}
              label={isCoolingActive ? 'Active' : 'Off'}
            />
          </TouchableOpacity>

          {/* Water Pump Relay (Pin 26) */}
          <TouchableOpacity
            style={styles.metricRow}
            onPress={() => navigation.navigate('Cleaning')}
          >
            <View style={styles.metricLeft}>
              <View style={[styles.iconBox, { backgroundColor: pumpOn ? '#DCFCE7' : '#F1F5F9' }]}>
                <Ionicons name="water-outline" size={20} color={pumpOn ? Colors.primary : Colors.textMuted} />
              </View>
              <Text style={styles.metricLabel}>Water Pump (Pin 26)</Text>
            </View>
            <StatusBadge
              type={pumpOn ? 'Active' : 'Idle'}
              label={pumpOn ? 'Pumping (ON)' : 'Standby (OFF)'}
            />
          </TouchableOpacity>

          {/* Last Image */}
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="camera-outline" size={20} color={Colors.primaryDark} />
              </View>
              <Text style={styles.metricLabel}>Last Image</Text>
            </View>
            <Text style={styles.metricValue}>2 min ago</Text>
          </View>
        </View>
      </ScrollView>
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
  connectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 13,
    color: Colors.textDark,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  overlayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  metricsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
