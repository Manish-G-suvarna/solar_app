import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const NotificationsScreen = ({ navigation }) => {
  const { notifications, markAllNotificationsRead } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Alerts', 'System', 'Info'];

  const filteredItems = notifications.filter(
    (n) => selectedFilter === 'All' || n.category === selectedFilter
  );

  const getIconInfo = (category, title) => {
    if (title.includes('Dust')) return { name: 'sparkles', color: Colors.warning, bg: '#FEF3C7' };
    if (title.includes('Temperature') || title.includes('Offline'))
      return { name: 'warning', color: Colors.danger, bg: '#FEE2E2' };
    if (title.includes('Completed'))
      return { name: 'checkmark-circle', color: Colors.success, bg: '#E6F4EA' };
    if (title.includes('Cooling'))
      return { name: 'thermometer', color: Colors.info, bg: '#E0F2FE' };
    return { name: 'notifications', color: Colors.primary, bg: Colors.primarySoft };
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        title="Notifications"
        navigation={navigation}
        rightIcon="checkmark-done-outline"
        onRightPress={markAllNotificationsRead}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Pills & Mark Read Header */}
        <View style={styles.topRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filters.map((f) => {
              const active = selectedFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.pill, active && styles.activePill]}
                  onPress={() => setSelectedFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, active && styles.activePillText]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.markReadBtn} onPress={markAllNotificationsRead}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.list}>
          {filteredItems.map((item) => {
            const { name, color, bg } = getIconInfo(item.category, item.title);
            return (
              <View key={item.id} style={[styles.card, !item.read && styles.unreadCard]}>
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                  <Ionicons name={name} size={20} color={color} />
                </View>

                <View style={styles.contentBox}>
                  <View style={styles.cardTop}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>

                {!item.read && <View style={styles.unreadDot} />}
              </View>
            );
          })}
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
  topRow: {
    marginVertical: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePill: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  markReadBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentBox: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
