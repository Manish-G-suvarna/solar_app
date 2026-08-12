import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { CurvedGraph } from '../components/CurvedGraph';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const EnergyAnalyticsScreen = ({ navigation }) => {
  const { todayEnergy, efficiency, temperature, currentPower } = useApp();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Hourly');

  const timeframes = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  // Data sets for different timeframes
  const chartData = {
    Hourly: [0.2, 0.6, 1.2, 2.45, 1.9, 0.7, 0.1],
    Daily: [14.2, 16.5, 18.62, 15.8, 17.1, 19.0, 18.2],
    Weekly: [95, 110, 125, 118, 130, 122, 128],
    Monthly: [450, 480, 510, 495, 520, 505],
    Yearly: [5.2, 5.8, 6.1, 5.9, 6.4],
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Energy Analytics" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Timeframe Filter Pills */}
        <View style={styles.timeframeContainer}>
          {timeframes.map((tf) => {
            const active = selectedTimeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[styles.pill, active && styles.activePill]}
                onPress={() => setSelectedTimeframe(tf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, active && styles.activePillText]}>{tf}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Selector Bar */}
        <View style={styles.dateBar}>
          <Text style={styles.dateText}>May 11, 2025</Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.primaryDark} />
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Power Generation (kW)</Text>

          <CurvedGraph
            width={320}
            height={160}
            data={chartData[selectedTimeframe] || chartData.Hourly}
            labels={
              selectedTimeframe === 'Hourly'
                ? ['00:00', '06:00', '12:00', '18:00', '24:00']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
            peakValue={`${currentPower} kW`}
            peakTime="12:00 PM"
          />

          {/* Telemetry Chips Bar */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Voltage</Text>
              <Text style={styles.chipVal}>234.5 V</Text>
            </View>
            <View style={[styles.chip, styles.activeChip]}>
              <Text style={[styles.chipLabel, { color: Colors.primary }]}>Current</Text>
              <Text style={[styles.chipVal, { color: Colors.primary }]}>10.5 A</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Temp.</Text>
              <Text style={styles.chipVal}>{temperature} °C</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Power</Text>
              <Text style={styles.chipVal}>{currentPower} kW</Text>
            </View>
          </View>
        </View>

        {/* Energy Summary Section */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Energy Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Max Power</Text>
              <Text style={styles.summaryValue}>3.35 kW</Text>
              <Text style={styles.summarySub}>12:05 PM</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Energy</Text>
              <Text style={styles.summaryValue}>{todayEnergy} kWh</Text>
              <Text style={styles.summarySub}>Today</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Energy Loss</Text>
              <Text style={styles.summaryValue}>2.18 kWh</Text>
              <Text style={styles.summarySub}>10.7%</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Efficiency</Text>
              <Text style={styles.summaryValue}>{efficiency}%</Text>
              <Text style={styles.summarySub}>Today</Text>
            </View>
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
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEFE structure border',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 3,
    marginVertical: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  activePill: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  dateBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 6,
  },
  chip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  chipLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  chipVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  summaryContainer: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  summarySub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
