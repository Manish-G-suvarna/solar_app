import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const FaultsMaintenanceScreen = ({ navigation }) => {
  const { faults } = useApp();

  const criticalCount = faults.filter((f) => f.severity === 'Critical').length;
  const warningCount = faults.filter((f) => f.severity === 'High').length;
  const infoCount = faults.filter((f) => f.severity === 'Medium' || f.severity === 'Info').length;

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Faults & Maintenance" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Severity Counter Stat Cards */}
        <View style={styles.counterRow}>
          <View style={styles.counterCard}>
            <View style={[styles.counterIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning-outline" size={20} color={Colors.danger} />
            </View>
            <Text style={styles.counterLabel}>Critical</Text>
            <Text style={[styles.counterValue, { color: Colors.danger }]}>{criticalCount}</Text>
          </View>

          <View style={styles.counterCard}>
            <View style={[styles.counterIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.counterLabel}>Warnings</Text>
            <Text style={[styles.counterValue, { color: Colors.warning }]}>{warningCount}</Text>
          </View>

          <View style={styles.counterCard}>
            <View style={[styles.counterIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
            </View>
            <Text style={styles.counterLabel}>Info</Text>
            <Text style={[styles.counterValue, { color: Colors.info }]}>{infoCount}</Text>
          </View>
        </View>

        {/* Active Faults List */}
        <Text style={styles.sectionHeaderTitle}>Active Faults</Text>

        <View style={styles.faultsList}>
          {faults.map((fault) => (
            <View key={fault.id} style={styles.faultCard}>
              <View style={styles.faultTopRow}>
                <Text style={styles.faultTitle}>{fault.title}</Text>
                <StatusBadge type={fault.severity} label={fault.severity} />
              </View>

              <Text style={styles.faultDesc}>{fault.desc}</Text>

              <View style={styles.faultFooter}>
                <Text style={styles.faultTime}>{fault.time}</Text>
                <TouchableOpacity style={styles.resolveBtn}>
                  <Text style={styles.resolveText}>Inspect</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* View All Faults Button */}
        <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.85}>
          <Text style={styles.viewAllBtnText}>View All Faults</Text>
        </TouchableOpacity>
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
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  counterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  counterLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginVertical: 10,
  },
  faultsList: {
    gap: 12,
    marginBottom: 16,
  },
  faultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  faultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  faultDesc: {
    fontSize: 13,
    color: Colors.textMedium,
    marginBottom: 10,
  },
  faultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faultTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  resolveBtn: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resolveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewAllBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
