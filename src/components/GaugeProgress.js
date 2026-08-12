import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export const GaugeProgress = ({
  size = 140,
  strokeWidth = 12,
  progress = 28, // percentage 0 - 100
  valueText = '28%',
  statusText = 'Moderate',
  color = '#F59E0B',
  icon = 'sparkles-outline',
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Animated Ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Inner Label Content */}
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={24} color={color} style={{ marginBottom: 2 }} />}
        <Text style={styles.valueText}>{valueText}</Text>
        {statusText && <Text style={[styles.statusText, { color }]}>{statusText}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
