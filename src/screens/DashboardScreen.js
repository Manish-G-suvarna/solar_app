import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { CurvedGraph } from '../components/CurvedGraph';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const DashboardScreen = ({ navigation }) => {
  const {
    currentPower,
    todayEnergy,
    totalEnergy,
    efficiency,
    batteryLevel,
    isCharging,
    location,
    weather,
  } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Dashboard" showBack={false} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* System Status Banner */}
        <TouchableOpacity
          style={styles.statusBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('FaultsMaintenance')}
        >
          <View style={styles.statusIconBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>System Status</Text>
            <Text style={styles.statusSub}>All systems normal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherLeft}>
            <Ionicons name="sunny" size={38} color="#F59E0B" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.tempText}>{weather.temp}°C</Text>
              <Text style={styles.conditionText}>{weather.condition}</Text>
            </View>
          </View>
          <View style={styles.weatherRight}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
        </View>

        {/* Current Power Graph Card */}
        <TouchableOpacity
          style={styles.powerCard}
          activeOpacity={0.95}
          onPress={() => navigation.navigate('EnergyAnalytics')}
        >
          <View style={styles.powerHeader}>
            <View>
              <Text style={styles.powerLabel}>Current Power</Text>
              <View style={styles.powerValueRow}>
                <Text style={styles.powerValue}>{currentPower}</Text>
                <Text style={styles.powerUnit}>kW</Text>
              </View>
            </View>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Curved Line Graph */}
          <CurvedGraph
            width={320}
            height={130}
            data={[0.4, 0.9, 1.6, 2.45, 2.1, 1.2, 0.3]}
            labels={['06:00', '09:00', '12:00', '15:00', '18:00']}
            peakValue={`${currentPower} kW`}
            peakTime="Live"
          />
        </TouchableOpacity>

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
  weatherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  conditionText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  weatherRight: {
    alignItems: 'flex-end',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
    marginLeft: 4,
  },
  powerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  powerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  powerLabel: {
    fontSize: 13,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  powerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  powerValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  powerUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
    marginLeft: 4,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
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
});
