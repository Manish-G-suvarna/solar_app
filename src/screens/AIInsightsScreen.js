import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { CurvedGraph } from '../components/CurvedGraph';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const AIInsightsScreen = ({ navigation }) => {
  const { dustLevel, triggerCleaning } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="AI Insights" navigation={navigation} rightIcon="refresh-outline" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Predicted Energy Card */}
        <View style={styles.predictionCard}>
          <Text style={styles.predictionLabel}>Predicted Energy Today</Text>
          <View style={styles.valueRow}>
            <Text style={styles.predictionValue}>22.45</Text>
            <Text style={styles.predictionUnit}>kWh</Text>
          </View>

          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color={Colors.success} />
            <Text style={styles.trendText}>+ 8.3% vs yesterday</Text>
          </View>

          <CurvedGraph
            width={320}
            height={130}
            data={[0.5, 1.1, 2.2, 3.1, 2.8, 1.5, 0.4]}
            labels={['06:00', '10:00', '14:00', '18:00', '22:00']}
            peakValue="22.45 kWh"
            peakTime="Predicted Total"
            color={Colors.accentLime}
          />
        </View>

        {/* Insights List Cards */}
        <View style={styles.insightsList}>
          {/* Trend Prediction */}
          <View style={styles.insightCard}>
            <View style={styles.insightIconBox}>
              <MaterialCommunityIcons name="chart-line-variant" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insightTitle}>Prediction (Next 3 Days)</Text>
              <Text style={styles.insightSub}>Increasing trend expected</Text>
            </View>
          </View>

          {/* Dust Loss */}
          <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insightTitle}>Power Loss (Dust)</Text>
              <Text style={styles.insightValue}>14%</Text>
            </View>
            <StatusBadge type="High" label="High" />
          </View>

          {/* Temp Loss */}
          <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="thermometer-outline" size={20} color={Colors.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insightTitle}>Power Loss (Temp)</Text>
              <Text style={styles.insightValue}>8%</Text>
            </View>
            <StatusBadge type="Moderate" label="Moderate" />
          </View>

          {/* Recommendation Box */}
          <View style={styles.recommendationCard}>
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.recTag}>AI Recommendation</Text>
            </View>
            <Text style={styles.recTitle}>Cleaning Recommended</Text>
            <Text style={styles.recDesc}>
              Dust level is high and predicted power loss is 14%. Cleaning today will recover approx
              2.8 kWh.
            </Text>

            <TouchableOpacity
              style={styles.cleanActionBtn}
              onPress={() => {
                triggerCleaning();
                navigation.navigate('Cleaning');
              }}
            >
              <Text style={styles.cleanActionText}>Execute Cleaning Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Explanation Button */}
        <TouchableOpacity
          style={styles.explainBtn}
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.explainBtnText}>View Explanation</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Explanation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AI Forecast Analysis</Text>
            <Text style={styles.modalBody}>
              Our neural solar model combines live weather radar telemetry, historic irradiance patterns,
              and surface particle accumulation sensors to optimize energy harvest predictions.
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  predictionLabel: {
    fontSize: 13,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  predictionValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  predictionUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    marginLeft: 4,
  },
  insightsList: {
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  insightSub: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  recommendationCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6EADF',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 6,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 18,
    marginBottom: 12,
  },
  cleanActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cleanActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  explainBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 20,
    marginBottom: 20,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
