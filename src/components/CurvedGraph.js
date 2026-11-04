import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

export const CurvedGraph = ({
  width = 320,
  height = 160,
  data = [0.2, 0.5, 1.2, 2.45, 1.8, 0.6, 0.1],
  labels = ['00:00', '06:00', '12:00', '18:00', '24:00'],
  timeDetails = null,
  peakValue = '2.45 kW',
  peakTime = '12:00 PM',
  color = Colors.primary,
  unit = 'kW',
  interactive = true,
  selectedIndex = null,
  onSelectPoint = null,
}) => {
  const [internalIndex, setInternalIndex] = useState(null);

  const paddingX = 24;
  const paddingY = 24;
  const graphWidth = Math.max(width - paddingX * 2, 10);
  const graphHeight = Math.max(height - paddingY * 2, 10);

  const maxVal = Math.max(...data, 1);
  const minVal = 0;

  // Generate SVG path coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / Math.max(data.length - 1, 1)) * graphWidth;
    const y = paddingY + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    return { x, y, val };
  });

  // Smooth bezier curve generator
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Determine active point (controlled prop > internal selection > default highest peak)
  const peakIndex = points.reduce((maxIdx, pt, idx, arr) => (pt.val > arr[maxIdx].val ? idx : maxIdx), 0);
  const activeIndex = selectedIndex !== null ? selectedIndex : (internalIndex !== null ? internalIndex : peakIndex);
  const activePt = points[activeIndex] || points[0];

  const displayVal = activePt ? `${activePt.val} ${unit}` : peakValue;
  const displayTime = (timeDetails && timeDetails[activeIndex]) || labels[activeIndex] || peakTime;

  const handleTouch = (evt) => {
    if (!interactive || data.length === 0) return;
    const touchX = evt.nativeEvent.locationX;
    const relativeX = touchX - paddingX;
    const clampedX = Math.max(0, Math.min(graphWidth, relativeX));
    const idx = Math.round((clampedX / graphWidth) * (data.length - 1));
    const validIdx = Math.max(0, Math.min(data.length - 1, idx));
    setInternalIndex(validIdx);
    if (onSelectPoint) {
      onSelectPoint(validIdx, data[validIdx], (timeDetails && timeDetails[validIdx]) || labels[validIdx]);
    }
  };

  const gradientId = `gradient_${color.replace('#', '')}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, i) => {
          const y = paddingY + graphHeight * pct;
          return (
            <Line
              key={i}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Filled gradient area under graph */}
        <Path d={fillD} fill={`url(#${gradientId})`} />

        {/* Curved stroke path */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth="3" />

        {/* Subtle dot indicators on all points */}
        {points.map((pt, i) => {
          if (i === activeIndex) return null;
          return (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#FFFFFF"
              stroke={color}
              strokeWidth="1.5"
              opacity="0.75"
            />
          );
        })}

        {/* Vertical dotted cursor indicator line at active point */}
        <Line
          x1={activePt.x}
          y1={activePt.y}
          x2={activePt.x}
          y2={height - paddingY}
          stroke={color}
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />

        {/* Outer pulse aura for active point */}
        <Circle
          cx={activePt.x}
          cy={activePt.y}
          r="10"
          fill={color}
          opacity="0.18"
        />

        {/* Active point indicator circle */}
        <Circle
          cx={activePt.x}
          cy={activePt.y}
          r="6"
          fill="#FFFFFF"
          stroke={color}
          strokeWidth="3"
        />

        {/* X Axis Labels */}
        {labels.map((label, idx) => {
          const x = paddingX + (idx / Math.max(labels.length - 1, 1)) * graphWidth;
          const isSelected = idx === activeIndex;
          return (
            <SvgText
              key={idx}
              x={x}
              y={height - 4}
              fontSize={isSelected ? '11' : '10'}
              fill={isSelected ? color : Colors.textMuted}
              textAnchor="middle"
              fontWeight={isSelected ? '700' : '500'}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Floating Tooltip Callout */}
      <View
        pointerEvents="none"
        style={[
          styles.tooltip,
          {
            left: Math.min(Math.max(activePt.x - 48, 6), width - 100),
            top: Math.max(activePt.y - 42, 2),
          },
        ]}
      >
        <Text style={styles.tooltipVal}>{displayVal}</Text>
        <Text style={styles.tooltipTime}>{displayTime}</Text>
      </View>

      {/* Touch Interaction Overlay */}
      {interactive && (
        <View
          style={[StyleSheet.absoluteFill, { width, height }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tooltipVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipTime: {
    color: Colors.accentLimeGlow,
    fontSize: 9,
    fontWeight: '600',
  },
});
