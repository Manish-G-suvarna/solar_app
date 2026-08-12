import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export const StatusBadge = ({ type = 'success', label, style }) => {
  let bgColor = Colors.primarySoft;
  let textColor = Colors.primary;

  if (type === 'success' || type === 'Active' || type === 'Online' || type === 'Completed') {
    bgColor = '#E6F4EA';
    textColor = '#137333';
  } else if (type === 'warning' || type === 'Moderate' || type === 'Medium' || type === 'High') {
    bgColor = '#FEF3C7';
    textColor = '#D97706';
  } else if (type === 'danger' || type === 'Critical') {
    bgColor = '#FEE2E2';
    textColor = '#DC2626';
  } else if (type === 'info' || type === 'Idle') {
    bgColor = '#E0F2FE';
    textColor = '#0284C7';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      {(type === 'success' || type === 'Active' || type === 'Online') && (
        <View style={[styles.dot, { backgroundColor: textColor }]} />
      )}
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
