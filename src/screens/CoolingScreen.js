import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { GaugeProgress } from '../components/GaugeProgress';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const CoolingScreen = ({ navigation }) => {
  const {
    temperature,
    waterLevel,
    isCoolingActive,
    toggleCooling,
    fanStatus,
    settings,
  } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Cooling" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Temperature Gauge Card */}
        <View style={styles.gaugeCard}>
          <Text style={styles.cardHeaderTitle}>Panel Temperature</Text>

          <GaugeProgress
            size={150}
            progress={(temperature / 60) * 100}
            valueText={`${temperature} °C`}
            statusText={temperature > 40 ? 'High' : 'Normal'}
            color={temperature > 40 ? Colors.danger : Colors.success}
            icon="thermometer-outline"
          />

          {/* Telemetry Info Table */}
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="power-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Cooling Status</Text>
              </View>
              <StatusBadge
                type={isCoolingActive ? 'Active' : 'Idle'}
                label={isCoolingActive ? 'Active' : 'Off'}
              />
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="options-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Mode</Text>
              </View>
              <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: '700' }]}>
                {settings.systemMode}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Feather name="wind" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Fan Status</Text>
              </View>
              <Text style={[styles.infoValue, { color: isCoolingActive ? Colors.success : Colors.textMuted }]}>
                {fanStatus}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="water-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Water Level</Text>
              </View>
              <Text style={styles.infoValue}>{waterLevel}%</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name="time-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Next Cooling</Text>
              </View>
              <Text style={styles.infoValue}>Today, 02:00 PM</Text>
            </View>
          </View>

          {/* Start/Stop Cooling Toggle Button */}
          <TouchableOpacity
            style={[styles.actionBtn, !isCoolingActive && styles.actionBtnDisabled]}
            activeOpacity={0.85}
            onPress={toggleCooling}
          >
            <Text style={styles.actionBtnText}>
              {isCoolingActive ? 'Stop Cooling' : 'Start Cooling'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Log */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Cooling History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIconBox}>
              <Ionicons name="thermometer" size={18} color={Colors.info} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.historyTime}>May 10, 01:00 PM</Text>
              <Text style={styles.historyDuration}>18 mins</Text>
            </View>
            <StatusBadge type="Completed" label="Completed" />
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
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    alignSelf: 'flex-start',
  },
  infoTable: {
    width: '100%',
    marginVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMedium,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  actionBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  actionBtnDisabled: {
    backgroundColor: Colors.info,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTime: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  historyDuration: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
