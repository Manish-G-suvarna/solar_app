import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const SchedulingScreen = ({ navigation }) => {
  const { schedules, toggleSchedule, addSchedule } = useApp();
  const [selectedTab, setSelectedTab] = useState('Cleaning');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  const filteredSchedules = schedules.filter((s) => s.type === selectedTab);

  const handleAdd = () => {
    if (newTitle.trim()) {
      addSchedule({
        title: newTitle,
        time: newTime || 'May 15, 10:00 AM',
        type: selectedTab,
      });
      setNewTitle('');
      setNewTime('');
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Scheduling" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          {['Cleaning', 'Cooling', 'Other'].map((tab) => {
            const active = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Schedule Items List */}
        <View style={styles.scheduleList}>
          {filteredSchedules.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={
                      item.type === 'Cleaning'
                        ? 'sparkles-outline'
                        : item.type === 'Cooling'
                        ? 'thermometer-outline'
                        : 'options-outline'
                    }
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {(item.time || item.detail) && (
                    <Text style={styles.itemSubtitle}>{item.time || item.detail}</Text>
                  )}
                </View>
              </View>

              <Switch
                value={item.enabled}
                onValueChange={() => toggleSchedule(item.id)}
                trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                thumbColor={item.enabled ? Colors.primary : '#F1F5F9'}
              />
            </View>
          ))}
        </View>

        {/* Add Schedule Button */}
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Add Schedule</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Schedule Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New {selectedTab} Schedule</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Schedule Title (e.g. Morning Clean)"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Time/Detail (e.g. Daily 08:00 AM)"
              placeholderTextColor={Colors.textMuted}
              value={newTime}
              onChangeText={setNewTime}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Save</Text>
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
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: Colors.primarySoft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scheduleList: {
    gap: 10,
    marginBottom: 20,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Colors.textMedium,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
