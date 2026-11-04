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
  const { settings, updateSetting, location, setSystemOnline, logout, user } = useApp();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of SolarGuard?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        },
      },
    ]);
  };

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

          {/* Tracking */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="compass-outline" size={20} color={Colors.accent} />
              <Text style={styles.rowLabel}>Sun Tracking</Text>
            </View>
            <Switch
              value={settings.trackingMode === 'Dual-Axis'}
              onValueChange={(val) =>
                updateSetting('trackingMode', val ? 'Dual-Axis' : 'Single-Axis')
              }
              trackColor={{ false: '#CBD5E1', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Dust Threshold */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSetting('dustThreshold', (settings.dustThreshold + 5) % 60 || 20)
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="leaf-outline" size={20} color={Colors.warning} />
              <Text style={styles.rowLabel}>Dust Threshold</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.warning, fontWeight: '700' }]}>
              {settings.dustThreshold}%
            </Text>
          </TouchableOpacity>

          {/* Temp Threshold */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSetting('tempThreshold', (settings.tempThreshold + 5) % 70 || 40)
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="thermometer-outline" size={20} color={Colors.danger} />
              <Text style={styles.rowLabel}>Temp. Threshold</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.danger, fontWeight: '700' }]}>
              {settings.tempThreshold}°C
            </Text>
          </TouchableOpacity>

          {/* Cleaning Duration */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSetting('cleaningDuration', (settings.cleaningDuration + 5) % 35 || 10)
            }
          >
            <View style={styles.rowLeft}>
              <Ionicons name="water-outline" size={20} color={Colors.success} />
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
            <Text style={[styles.rowValue, { color: Colors.info, fontWeight: '700' }]}>
              {settings.coolingDuration} min
            </Text>
          </TouchableOpacity>
        </View>

        {/* Device & Hardware Section */}
        <Text style={styles.sectionHeaderTitle}>Hardware &amp; Connectivity</Text>

        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="hardware-chip-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>Controller Unit</Text>
            </View>
            <Text style={styles.rowValue}>ESP32-WROOM</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="wifi-outline" size={20} color={Colors.success} />
              <Text style={styles.rowLabel}>Bridge Link</Text>
            </View>
            <Text style={[styles.rowValue, { color: Colors.success, fontWeight: '700' }]}>
              WebSocket:5005
            </Text>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.rowLabel}>Site Location</Text>
            </View>
            <Text style={styles.rowValue}>{location || 'Bangalore, India'}</Text>
          </View>
        </View>

        {/* Notifications & Alert Preferences */}
        <Text style={styles.sectionHeaderTitle}>Notifications &amp; Alerts</Text>

        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
              <Text style={styles.rowLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(val) => updateSetting('notificationsEnabled', val)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
              <Text style={styles.rowLabel}>Soiling Alerts</Text>
            </View>
            <Switch
              value={settings.soilingAlerts}
              onValueChange={(val) => updateSetting('soilingAlerts', val)}
              trackColor={{ false: '#CBD5E1', true: Colors.warning }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="flame-outline" size={20} color={Colors.danger} />
              <Text style={styles.rowLabel}>Thermal Overheat Alerts</Text>
            </View>
            <Switch
              value={settings.overheatAlerts}
              onValueChange={(val) => updateSetting('overheatAlerts', val)}
              trackColor={{ false: '#CBD5E1', true: Colors.danger }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account & Session Section */}
        <Text style={styles.sectionHeaderTitle}>Account &amp; Session</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.rowLabel}>{user?.name || 'SolarGuard Operator'}</Text>
            </View>
            <Text style={styles.rowValue}>{user?.email || 'operator@solarguard.io'}</Text>
          </View>

          {user?.siteName ? (
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="home-outline" size={20} color={Colors.accent} />
                <Text style={styles.rowLabel}>Site Array</Text>
              </View>
              <Text style={[styles.rowValue, { color: Colors.primaryDark, fontWeight: '600' }]}>
                {user.siteName}
              </Text>
            </View>
          ) : null}

          {/* System Reset */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleSystemReset}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-circle-outline" size={20} color={Colors.danger} />
              <Text style={[styles.rowLabel, { color: Colors.danger }]}>System Reset</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
          </TouchableOpacity>

          {/* Log Out */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={[styles.rowLabel, { color: Colors.danger, fontWeight: '700' }]}>
                Log Out
              </Text>
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
