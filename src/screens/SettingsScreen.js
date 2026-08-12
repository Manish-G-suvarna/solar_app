import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const SettingsScreen = ({ navigation }) => {
  const { settings, updateSetting, location, setSystemOnline } = useApp();

  const handleSystemReset = () => {
    Alert.alert(
      'System Reset',
      'Are you sure you want to reset system thresholds and reconnect sensors?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset System',
          style: 'destructive',
          onPress: () => {
            updateSetting('dustThreshold', 30);
            updateSetting('tempThreshold', 45);
            updateSetting('cleaningDuration', 15);
            updateSetting('coolingDuration', 20);
            setSystemOnline(true);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Settings" navigation={navigation} rightIcon="person-circle-outline" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* System Settings Section */}
        <Text style={styles.sectionHeaderTitle}>System Settings</Text>

        <View style={styles.sectionCard}>
          {/* Mode */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSetting(
                'systemMode',
                settings.systemMode === 'Automatic' ? 'Manual' : 'Automatic'
              )
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="cog-outline" size={20} color={Colors.primary} />
              <Text style={styles.rowLabel}>Mode</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.primary, fontWeight: '700' }]}>
              {settings.systemMode}
            </Text>
          </TouchableOpacity>

          {/* Dust Threshold */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => updateSetting('dustThreshold', (settings.dustThreshold + 5) % 50 || 15)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.warning} />
              <Text style={styles.rowLabel}>Dust Threshold</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.success, fontWeight: '700' }]}>
              {settings.dustThreshold}%
            </Text>
          </TouchableOpacity>

          {/* Temp Threshold */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => updateSetting('tempThreshold', (settings.tempThreshold + 5) % 60 || 35)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="thermometer-outline" size={20} color={Colors.danger} />
              <Text style={styles.rowLabel}>Temp. Threshold</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.success, fontWeight: '700' }]}>
              {settings.tempThreshold}°C
            </Text>
          </TouchableOpacity>

          {/* Cleaning Duration */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSetting('cleaningDuration', (settings.cleaningDuration + 5) % 40 || 10)
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="timer-outline" size={20} color={Colors.primary} />
              <Text style={styles.rowLabel}>Cleaning Duration</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.success, fontWeight: '700' }]}>
              {settings.cleaningDuration} min
            </Text>
          </TouchableOpacity>

          {/* Cooling Duration */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() =>
              updateSetting('coolingDuration', (settings.coolingDuration + 5) % 45 || 15)
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={20} color={Colors.info} />
              <Text style={styles.rowLabel}>Cooling Duration</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.success, fontWeight: '700' }]}>
              {settings.coolingDuration} min
            </Text>
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <Text style={styles.sectionHeaderTitle}>General</Text>

        <View style={styles.sectionCard}>
          {/* Notifications Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(val) => updateSetting('notificationsEnabled', val)}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={settings.notificationsEnabled ? Colors.primary : '#F1F5F9'}
            />
          </View>

          {/* Location */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="location-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>Location</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.rowValue, { color: Colors.primary, marginRight: 6 }]}>
                {location}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Camera Settings */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="camera-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>Camera Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* User Permissions */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>User Permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* System Reset */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleSystemReset}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-circle-outline" size={20} color={Colors.danger} />
              <Text style={[styles.rowLabel, { color: Colors.danger }]}>System Reset</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
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
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginVertical: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginLeft: 12,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
});
