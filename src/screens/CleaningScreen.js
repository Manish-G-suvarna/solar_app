import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { GaugeProgress } from '../components/GaugeProgress';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const CleaningScreen = ({ navigation }) => {
  const {
    dustLevel,
    waterLevel,
    isCleaningActive,
    cleaningTimer,
    triggerCleaning,
    settings,
  } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Cleaning" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dust Gauge Card */}
        <View style={styles.gaugeCard}>
          <Text style={styles.cardHeaderTitle}>Dust Level</Text>
          <GaugeProgress
            size={150}
            progress={dustLevel}
            valueText={`${dustLevel}%`}
            statusText={dustLevel > 30 ? 'High' : 'Moderate'}
            color={dustLevel > 30 ? Colors.danger : Colors.warning}
            icon="sparkles-outline"
          />

          {/* Info Rows */}
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="time-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Last Cleaning</Text>
              </View>
              <Text style={styles.infoValue}>May 10, 09:30 AM</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Next Cleaning</Text>
              </View>
              <Text style={styles.infoValue}>May 12, 09:30 AM</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name="options-outline" size={16} color={Colors.textMedium} />
                <Text style={styles.infoLabel}>Mode</Text>
              </View>
              <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: '700' }]}>
                {settings.systemMode}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionBtn, isCleaningActive && styles.actionBtnActive]}
            activeOpacity={0.85}
            onPress={triggerCleaning}
            disabled={isCleaningActive}
          >
            {isCleaningActive ? (
              <View style={styles.activeRow}>
                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Cleaning in progress ({cleaningTimer}s)...</Text>
              </View>
            ) : (
              <Text style={styles.actionBtnText}>Start Cleaning</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Telemetry Stat Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="water-outline" size={22} color={Colors.info} />
            <Text style={styles.statLabel}>Water Level</Text>
            <Text style={styles.statValue}>{waterLevel}%</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="timer-outline" size={22} color={Colors.primary} />
            <Text style={styles.statLabel}>Cleaning Duration</Text>
            <Text style={styles.statValue}>{settings.cleaningDuration} min</Text>
          </View>
        </View>

        {/* History Log */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Cleaning History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIconBox}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.historyTime}>May 10, 09:30 AM</Text>
              <Text style={styles.historyDuration}>15 mins</Text>
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
  actionBtnActive: {
    backgroundColor: Colors.accentLime,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
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
    backgroundColor: Colors.primarySoft,
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
