import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export const MetricCard = ({
  icon,
  iconColor = Colors.primary,
  label,
  value,
  unit,
  subtitle,
  onPress,
  style,
}) => {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
