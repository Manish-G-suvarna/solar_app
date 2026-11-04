import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { GaugeProgress } from '../components/GaugeProgress';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const CleaningScreen = ({ navigation }) => {
  const {
    dustLevel,
    setDustLevel,
    waterLevel,
    setWaterLevel,
    isCleaningActive,
    cleaningTimer,
    cleaningProgress,
    cleaningStatusText,
    cleaningHistory,
    startCleaning,
    stopCleaning,
    refillWaterTank,
    settings,
    updateSetting,
    pumpOn,
    setPumpState,
    togglePump,
    espConfig,
    updateEspIp,
    syncHardwareStatus,
    invertRelay,
    toggleInvertRelay,
    wiperStatus,
    triggerWiperCycle,
    triggerWiperForward,
    triggerWiperBackward,
    triggerWiperStop,
  } = useApp();

  const selectedMode = 'Standard Wash';
  const [selectedZone, setSelectedZone] = useState('All Arrays');
  const [customDuration, setCustomDuration] = useState(settings?.cleaningDuration || 15);
  const [customThreshold, setCustomThreshold] = useState(settings?.dustThreshold || 30);
  const [pressureLevel, setPressureLevel] = useState('Medium');
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [ipInput, setIpInput] = useState(espConfig?.ip || '192.168.194.44:5005');
  const [jogFeedback, setJogFeedback] = useState(null);

  // Available Panel Zones
  const zones = ['All Arrays', 'Zone A (East)', 'Zone B (West)', 'Roof Tracker'];

  // Pressure options
  const pressureOptions = [
    { label: 'Low (3 Bar)', value: 'Low' },
    { label: 'Medium (5 Bar)', value: 'Medium' },
    { label: 'High (8 Bar)', value: 'High' },
  ];

  const handleStartCycle = () => {
    if (waterLevel < 15) {
      Alert.alert(
        'Low Water Warning',
        'Water tank is below 15%. Refill tank now before starting the wash cycle.',
        [
          { text: 'Refill Water (100%)', onPress: refillWaterTank },
          { text: 'Proceed Anyway', style: 'destructive', onPress: () => startCleaning('Standard Wash', 15, selectedZone) },
        ]
      );
      return;
    }
    startCleaning('Standard Wash', 15, selectedZone);
  };

  const handleAbortCycle = () => {
    Alert.alert(
      'Abort Cleaning Cycle',
      'Are you sure you want to stop the cleaning cycle immediately and park wipers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Abort Now', style: 'destructive', onPress: stopCleaning },
      ]
    );
  };

  const handleManualJog = (direction) => {
    if (isCleaningActive) return;
    if (direction === 'Left' || direction === 'Back') {
      triggerWiperBackward();
      setJogFeedback('Wiper Motor (Pin 27) returning 30 cm Back (Anti-Clockwise) ◀');
    } else if (direction === 'Right' || direction === 'Front') {
      triggerWiperForward();
      setJogFeedback('Wiper Motor (Pin 27) moving 30 cm Front (Clockwise) ▶');
    } else if (direction === 'Cycle') {
      triggerWiperCycle();
      setJogFeedback('Wiper Motor running full 30 cm Front & Back Cycle 🔁');
    } else {
      triggerWiperStop();
      setJogFeedback('Wiper Motor safely stopped / parked ⏏');
    }
    setTimeout(() => setJogFeedback(null), 4000);
  };

  const isAutoMode = settings.systemMode === 'Automatic';

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        title="Panel Cleaning Control"
        navigation={navigation}
        rightIcon="refresh-outline"
        onRightPress={() => {
          Alert.alert('Sensors Recalibrated', 'Dust and water level sensors refreshed.');
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Status & Dust Gauge Card */}
        <View style={styles.gaugeCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>Dust Accumulation</Text>
              <Text style={styles.cardHeaderSubtitle}>
                {dustLevel > customThreshold ? '⚠️ Cleaning Recommended' : 'Optimal solar efficiency'}
              </Text>
            </View>
            <View style={[styles.modeIndicatorPill, isAutoMode ? styles.modeAuto : styles.modeManual]}>
              <Text style={styles.modeIndicatorText}>
                {isAutoMode ? 'AI Auto' : 'Manual'}
              </Text>
            </View>
          </View>

          <GaugeProgress
            size={160}
            progress={dustLevel}
            valueText={`${dustLevel}%`}
            statusText={dustLevel > customThreshold ? 'Dust Alert' : (dustLevel > 15 ? 'Moderate' : 'Clean')}
            color={dustLevel > customThreshold ? Colors.danger : (dustLevel > 15 ? Colors.warning : Colors.success)}
            icon="sparkles-outline"
          />

          {/* Live Progress Bar when Cleaning Active */}
          {isCleaningActive ? (
            <View style={styles.activeProgressContainer}>
              <View style={styles.activeProgressHeader}>
                <View style={styles.activePhaseRow}>
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.activePhaseText}>{cleaningStatusText}</Text>
                </View>
                <Text style={styles.activeTimerText}>{cleaningTimer}s left</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${cleaningProgress}%` }]} />
              </View>

              <TouchableOpacity
                style={styles.abortBtn}
                activeOpacity={0.8}
                onPress={handleAbortCycle}
              >
                <Ionicons name="stop-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.abortBtnText}>Emergency Stop Cycle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.idleActionBox}>
              <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Mode</Text>
                  <Text style={styles.summaryVal}>{selectedMode}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Target</Text>
                  <Text style={styles.summaryVal}>{selectedZone}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryVal}>{customDuration} min</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                activeOpacity={0.85}
                onPress={handleStartCycle}
              >
                <Ionicons name="play-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.startBtnText}>Start Cleaning Cycle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Sensor Test Stepper */}
          <View style={styles.testDustRow}>
            <Text style={styles.testDustLabel}>Simulate Dust Level for testing:</Text>
            <View style={styles.stepperMini}>
              <TouchableOpacity
                style={styles.stepperBtnMini}
                onPress={() => setDustLevel((prev) => Math.max(0, prev - 5))}
              >
                <Text style={styles.stepperBtnTextMini}>-5%</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValMini}>{dustLevel}%</Text>
              <TouchableOpacity
                style={styles.stepperBtnMini}
                onPress={() => setDustLevel((prev) => Math.min(100, prev + 5))}
              >
                <Text style={styles.stepperBtnTextMini}>+5%</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        {/* Target Panel Array Selector */}
        <Text style={styles.sectionTitle}>1. Target Panel Array</Text>
        <View style={styles.zonesContainer}>
          {zones.map((zone) => {
            const isSelected = selectedZone === zone;
            return (
              <TouchableOpacity
                key={zone}
                style={[styles.zonePill, isSelected && styles.zonePillSelected]}
                onPress={() => setSelectedZone(zone)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={zone === 'All Arrays' ? 'grid-outline' : 'layers-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : Colors.textMedium}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.zonePillText, isSelected && styles.zonePillTextSelected]}>
                  {zone}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Customizable Parameters (Duration, Threshold & Pressure) */}
        <Text style={styles.sectionTitle}>2. Custom Parameters</Text>
        <View style={styles.paramsCard}>
          {/* Duration Stepper */}
          <View style={styles.paramRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="timer-outline" size={18} color={Colors.primary} />
                <Text style={styles.paramTitle}>Cycle Duration</Text>
              </View>
              <Text style={styles.paramSub}>Cleaning operation run time</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  const next = Math.max(5, customDuration - 5);
                  setCustomDuration(next);
                  updateSetting('cleaningDuration', next);
                }}
              >
                <Ionicons name="remove" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{customDuration} min</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  const next = Math.min(45, customDuration + 5);
                  setCustomDuration(next);
                  updateSetting('cleaningDuration', next);
                }}
              >
                <Ionicons name="add" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.paramDivider} />

          {/* Dust Threshold Stepper */}
          <View style={styles.paramRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="speedometer-outline" size={18} color={Colors.warning} />
                <Text style={styles.paramTitle}>Dust Trigger Threshold</Text>
              </View>
              <Text style={styles.paramSub}>Alert & auto-clean threshold</Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  const next = Math.max(15, customThreshold - 5);
                  setCustomThreshold(next);
                  updateSetting('dustThreshold', next);
                }}
              >
                <Ionicons name="remove" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{customThreshold}%</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => {
                  const next = Math.min(60, customThreshold + 5);
                  setCustomThreshold(next);
                  updateSetting('dustThreshold', next);
                }}
              >
                <Ionicons name="add" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.paramDivider} />

          {/* Spray Pressure Selector */}
          <View style={styles.paramRowColumn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="speedometer" size={18} color={Colors.info} />
                <Text style={styles.paramTitle}>Spray Nozzle Pressure</Text>
              </View>
              <Text style={styles.paramValHighlighted}>{pressureLevel}</Text>
            </View>
            <View style={styles.pressureRow}>
              {pressureOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pressureBtn, pressureLevel === opt.value && styles.pressureBtnActive]}
                  onPress={() => setPressureLevel(opt.value)}
                >
                  <Text style={[styles.pressureBtnText, pressureLevel === opt.value && styles.pressureBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ESP32 Hardware Relay & Water Pump Control Card */}
        <Text style={styles.sectionTitle}>3. ESP32 Hardware Relay & Water Pump</Text>
        <View style={[styles.hardwarePumpCard, pumpOn && styles.hardwarePumpCardActive]}>
          <View style={styles.hwHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={pumpOn ? "flash" : "power-outline"}
                  size={20}
                  color={pumpOn ? Colors.primary : Colors.textMuted}
                />
                <Text style={styles.hwTitle}>Relay Pump Control (GPIO 26)</Text>
              </View>
              <Text style={styles.hwSub}>
                {pumpOn ? 'PUMP IS ACTIVE • High pressure spray engaged' : 'PUMP IS OFF • Relay in standby mode'}
              </Text>
            </View>

            <View style={[styles.pumpStatusBadge, pumpOn ? styles.pumpBadgeOn : styles.pumpBadgeOff]}>
              <View style={[styles.statusPulseDot, pumpOn ? styles.pulseDotOn : styles.pulseDotOff]} />
              <Text style={[styles.pumpStatusText, pumpOn ? styles.pumpTextOn : styles.pumpTextOff]}>
                {pumpOn ? 'PUMP ON' : 'PUMP OFF'}
              </Text>
            </View>
          </View>

          {/* Dedicated ON and OFF Dual Action Options */}
          <View style={styles.pumpDualOptionsRow}>
            {/* TURN ON BUTTON */}
            <TouchableOpacity
              style={[
                styles.pumpOptionBtn,
                styles.pumpOptionBtnOn,
                pumpOn && styles.pumpOptionBtnOnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setPumpState(true)}
            >
              <View style={styles.optionBtnContent}>
                <Ionicons
                  name="play-circle"
                  size={24}
                  color={pumpOn ? '#FFFFFF' : '#16A34A'}
                  style={{ marginRight: 6 }}
                />
                <View>
                  <Text style={[styles.pumpOptionTitle, pumpOn && styles.pumpOptionTitleActive]}>
                    TURN ON
                  </Text>
                  <Text style={[styles.pumpOptionSub, pumpOn && styles.pumpOptionSubActive]}>
                    Send Command '1'
                  </Text>
                </View>
              </View>
              {pumpOn && (
                <View style={styles.activeCheckBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* TURN OFF BUTTON */}
            <TouchableOpacity
              style={[
                styles.pumpOptionBtn,
                styles.pumpOptionBtnOff,
                !pumpOn && styles.pumpOptionBtnOffActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setPumpState(false)}
            >
              <View style={styles.optionBtnContent}>
                <Ionicons
                  name="stop-circle"
                  size={24}
                  color={!pumpOn ? '#FFFFFF' : '#DC2626'}
                  style={{ marginRight: 6 }}
                />
                <View>
                  <Text style={[styles.pumpOptionTitle, !pumpOn && styles.pumpOptionTitleActive]}>
                    TURN OFF
                  </Text>
                  <Text style={[styles.pumpOptionSub, !pumpOn && styles.pumpOptionSubActive]}>
                    Send Command '0'
                  </Text>
                </View>
              </View>
              {!pumpOn && (
                <View style={styles.activeCheckBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Toggle Switch Row */}
          <View style={styles.pumpSwitchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pumpSwitchTitle}>Water Pump Power Switch</Text>
              <Text style={styles.pumpSwitchSub}>
                Relay Pin 26: <Text style={{ fontWeight: '800', color: pumpOn ? '#16A34A' : '#64748B' }}>{pumpOn ? 'PUMP IS ON (Active)' : 'PUMP IS OFF (Idle)'}</Text>
              </Text>
            </View>
            <View style={styles.switchWrapper}>
              <Text style={[styles.switchStateLabel, pumpOn && { color: '#16A34A', fontWeight: '800' }]}>
                {pumpOn ? 'ON' : 'OFF'}
              </Text>
              <Switch
                value={pumpOn}
                onValueChange={(val) => setPumpState(val)}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={pumpOn ? '#16A34A' : '#F1F5F9'}
              />
            </View>
          </View>

          {/* Relay Polarity (Active HIGH vs Active LOW) Option */}
          <View style={styles.polarityOptionRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="swap-vertical" size={15} color={Colors.info} />
                <Text style={styles.polarityTitle}>Invert Relay Polarity (Active HIGH)</Text>
              </View>
              <Text style={styles.polaritySub}>
                {invertRelay 
                  ? 'Active HIGH Mode (Turn ON sends Pin HIGH)' 
                  : 'Active LOW Mode (Turn ON sends Pin LOW)'}
              </Text>
            </View>
            <Switch
              value={invertRelay}
              onValueChange={toggleInvertRelay}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={invertRelay ? Colors.info : '#F1F5F9'}
            />
          </View>
          <View style={styles.hwMetricsContainer}>
            <View style={styles.hwConnRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.connDot, espConfig?.connected ? styles.connDotOnline : styles.connDotOffline]} />
                <Text style={styles.connText}>
                  ESP32 {espConfig?.connected ? `Connected (${espConfig.ip})` : 'Offline (Simulated)'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cfgIpBtn}
                onPress={() => {
                  setIpInput(espConfig?.ip || '192.168.4.1');
                  setIpModalVisible(true);
                }}
              >
                <Ionicons name="settings-outline" size={13} color={Colors.primaryDark} style={{ marginRight: 3 }} />
                <Text style={styles.cfgIpText}>ESP IP</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Live Sensor Chips */}
            <View style={styles.hwChipsRow}>
              <View style={styles.hwChip}>
                <Text style={styles.hwChipLabel}>SERVO ANGLE</Text>
                <Text style={styles.hwChipValue}>{espConfig?.servoAngle ?? 90}°</Text>
              </View>

              <View style={styles.hwChip}>
                <Text style={styles.hwChipLabel}>LEFT LDR (34)</Text>
                <Text style={styles.hwChipValue}>{espConfig?.leftLdr ?? '--'}</Text>
              </View>

              <View style={styles.hwChip}>
                <Text style={styles.hwChipLabel}>RIGHT LDR (35)</Text>
                <Text style={styles.hwChipValue}>{espConfig?.rightLdr ?? '--'}</Text>
              </View>

              <View style={styles.hwChip}>
                <Text style={styles.hwChipLabel}>DS18B20 (PIN 4)</Text>
                <Text style={styles.hwChipValue}>
                  {espConfig?.tempValid ? `${espConfig.hardwareTemp}°C` : 'Err'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Water Supply & Consumables Control Card */}
        <Text style={styles.sectionTitle}>4. Water Supply & Tank Reservoir</Text>
        <View style={styles.waterCard}>
          <View style={styles.waterCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.waterIconBox}>
                <Ionicons name="water" size={24} color={Colors.info} />
              </View>
              <View>
                <Text style={styles.waterTitle}>Water Reservoir</Text>
                <Text style={styles.waterCapacityText}>Available: {waterLevel}% (~{Math.round(waterLevel * 1.5)} Liters)</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.refillBtn}
              activeOpacity={0.8}
              onPress={() => {
                refillWaterTank();
                Alert.alert('Water Tank Refilled', 'Water reservoir replenished back to 100%.');
              }}
            >
              <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.refillBtnText}>Refill 100%</Text>
            </TouchableOpacity>
          </View>

          {/* Water progress track */}
          <View style={styles.waterTrack}>
            <View
              style={[
                styles.waterFill,
                { width: `${waterLevel}%` },
                waterLevel < 20 && { backgroundColor: Colors.danger },
              ]}
            />
          </View>

          {/* Water Pump Toggle */}
          <View style={styles.pumpRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pumpTitle}>Automated Pressure Pump</Text>
              <Text style={styles.pumpSub}>GPIO 26 Relay • {pumpOn ? 'Pump actively spraying water' : 'Pump in standby / off'}</Text>
            </View>
            <Switch
              value={pumpOn}
              onValueChange={setPumpState}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={pumpOn ? Colors.primary : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Manual Robotic Wiper Jog Controller (GPIO 27) */}
        <Text style={styles.sectionTitle}>5. Wiper Slider Motor (GPIO 27 - 30cm Travel)</Text>
        <View style={styles.jogCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.jogSub, { marginBottom: 0 }]}>
              Control 30 cm travel front & back across panel array:
            </Text>
            <View style={{
              backgroundColor: wiperStatus && wiperStatus !== 'IDLE' ? '#8B5CF6' : '#F1F5F9',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '800',
                color: wiperStatus && wiperStatus !== 'IDLE' ? '#FFFFFF' : '#64748B'
              }}>
                {wiperStatus && wiperStatus !== 'IDLE' ? `WIPER: ${wiperStatus}` : 'WIPER: IDLE'}
              </Text>
            </View>
          </View>

          {/* Dedicated 30cm Front & Back One-Touch Cycle Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#8B5CF6',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 10,
              gap: 8,
            }}
            onPress={() => handleManualJog('Cycle')}
            activeOpacity={0.8}
          >
            <Ionicons name="repeat" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
              Run 30 cm Front & Back Cycle (CW & CCW)
            </Text>
          </TouchableOpacity>

          <View style={styles.jogButtonsRow}>
            <TouchableOpacity
              style={styles.jogBtn}
              onPress={() => handleManualJog('Left')}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primaryDark} />
              <Text style={styles.jogBtnText}>30cm Back ◀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.jogBtn, styles.jogBtnPark]}
              onPress={() => handleManualJog('Park')}
              activeOpacity={0.75}
            >
              <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
              <Text style={styles.jogBtnParkText}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.jogBtn}
              onPress={() => handleManualJog('Right')}
              activeOpacity={0.75}
            >
              <Text style={styles.jogBtnText}>30cm Front ▶</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>

          {jogFeedback && (
            <View style={styles.jogFeedbackBox}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.jogFeedbackText}>{jogFeedback}</Text>
            </View>
          )}
        </View>

        {/* System Automation Mode Toggle */}
        <Text style={styles.sectionTitle}>6. Automation Strategy</Text>
        <View style={styles.automationCard}>
          <View style={styles.automationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.automationTitle}>Autonomous AI Cleaning</Text>
              <Text style={styles.automationDesc}>
                Automatically trigger cleaning when dust exceeds {customThreshold}% or weather conditions permit.
              </Text>
            </View>
            <Switch
              value={isAutoMode}
              onValueChange={(val) =>
                updateSetting('systemMode', val ? 'Automatic' : 'Manual')
              }
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={isAutoMode ? Colors.primary : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Cleaning Activity History */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Cleaning History Log</Text>
            <Text style={styles.historyCount}>{cleaningHistory?.length || 0} cycles</Text>
          </View>

          {cleaningHistory && cleaningHistory.length > 0 ? (
            cleaningHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIconBox}>
                  <Ionicons name="sparkles" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.historyTime}>{item.time}</Text>
                  <View style={styles.historySubRow}>
                    <Text style={styles.historyMode}>{item.mode}</Text>
                    <Text style={styles.historyDot}>•</Text>
                    <Text style={styles.historyWater}>Water: {item.waterUsed}</Text>
                  </View>
                  <Text style={styles.historyReduction}>Dust: {item.dustReduced}</Text>
                </View>
                <StatusBadge type={item.status || 'Completed'} label={item.status || 'Completed'} />
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>No cleaning activity logged yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* ESP32 IP Configuration Modal */}
      <Modal
        visible={ipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="hardware-chip-outline" size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>ESP32 Device IP</Text>
              </View>
              <TouchableOpacity onPress={() => setIpModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the local IP address or Access Point IP of your ESP32 solar tracker:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="e.g. 192.168.4.1 or 192.168.1.100"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalPresetRow}>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setIpInput('192.168.194.44:5005')}
              >
                <Text style={styles.presetText}>PC Bridge (192.168.194.44:5005)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setIpInput('192.168.4.1')}
              >
                <Text style={styles.presetText}>ESP32 AP (192.168.4.1)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIpModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => {
                  updateEspIp(ipInput);
                  setIpModalVisible(false);
                  syncHardwareStatus();
                  Alert.alert('Hardware IP Saved', `ESP32 target updated to http://${ipInput}`);
                }}
              >
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  /* Gauge Card */
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  modeIndicatorPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeAuto: {
    backgroundColor: '#E6F4EA',
  },
  modeManual: {
    backgroundColor: '#FEF3C7',
  },
  modeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  /* Live Progress */
  activeProgressContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activePhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activePhaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  activeTimerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  abortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    height: 42,
    borderRadius: 12,
  },
  abortBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  /* Idle Action Box */
  idleActionBox: {
    width: '100%',
    marginTop: 12,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 14,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  testDustRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  testDustLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtnMini: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepperBtnTextMini: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepperValMini: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 32,
    textAlign: 'center',
  },
  /* Modes Container */
  modesContainer: {
    gap: 10,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F4FAF7',
  },
  modeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconBoxSelected: {
    backgroundColor: Colors.primarySoft,
  },
  modeRadio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  modeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modeCardTitleSelected: {
    color: Colors.primary,
  },
  modeCardDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 3,
    marginBottom: 10,
  },
  modeSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  ratingPill: {
    marginLeft: 'auto',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingPillSelected: {
    backgroundColor: Colors.primarySoft,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  ratingTextSelected: {
    color: Colors.primary,
  },
  /* Zones */
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zonePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zonePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  zonePillTextSelected: {
    color: '#FFFFFF',
  },
  /* Parameters Card */
  paramsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramRowColumn: {
    width: '100%',
  },
  paramTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  paramSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  paramValHighlighted: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    minWidth: 54,
    textAlign: 'center',
  },
  paramDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  pressureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pressureBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pressureBtnActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  pressureBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  pressureBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  /* Water Card */
  waterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waterCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  waterCapacityText: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  refillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  waterTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  waterFill: {
    height: '100%',
    backgroundColor: Colors.info,
    borderRadius: 4,
  },
  pumpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pumpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  pumpSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  /* Manual Wiper Jog Pad */
  jogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jogSub: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 12,
  },
  jogButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  jogBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  jogBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  jogBtnPark: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  jogBtnParkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jogFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  jogFeedbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  /* Automation */
  automationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  automationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  automationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  automationDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
    paddingRight: 10,
  },
  /* History */
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 18,
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
  historyCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  historySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  historyMode: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  historyDot: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  historyWater: {
    fontSize: 11,
    color: Colors.info,
    fontWeight: '600',
  },
  historyReduction: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 1,
  },
  noHistoryText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  /* Hardware Pump & Relay Card */
  hardwarePumpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  hardwarePumpCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F7FCF9',
  },
  hwHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  hwSub: {
    fontSize: 11,
    color: Colors.textMedium,
    marginTop: 2,
  },
  pumpStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  pumpBadgeOn: {
    backgroundColor: '#DCFCE7',
  },
  pumpBadgeOff: {
    backgroundColor: '#F1F5F9',
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDotOn: {
    backgroundColor: '#16A34A',
  },
  pulseDotOff: {
    backgroundColor: '#94A3B8',
  },
  pumpStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pumpTextOn: {
    color: '#15803D',
  },
  pumpTextOff: {
    color: '#64748B',
  },
  /* Dual ON and OFF Options */
  pumpDualOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pumpOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  pumpOptionBtnOn: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  pumpOptionBtnOnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  pumpOptionBtnOff: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  pumpOptionBtnOffActive: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  optionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pumpOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  pumpOptionTitleActive: {
    color: '#FFFFFF',
  },
  pumpOptionSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 1,
  },
  pumpOptionSubActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  activeCheckBadge: {
    marginLeft: 4,
  },
  pumpSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pumpSwitchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  pumpSwitchSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchStateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  polarityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  polarityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  polaritySub: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 2,
  },
  bigPumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bigPumpBtnStart: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  bigPumpBtnStop: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  bigPumpBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  hwMetricsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hwConnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connDotOnline: {
    backgroundColor: Colors.success,
  },
  connDotOffline: {
    backgroundColor: Colors.warning,
  },
  connText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  cfgIpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cfgIpText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  hwChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hwChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hwChipLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 2,
  },
  hwChipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  modalDescription: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  modalPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  presetPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
