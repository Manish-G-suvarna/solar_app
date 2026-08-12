import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

export const CurvedGraph = ({
  width = 320,
  height = 160,
  data = [0.2, 0.5, 1.2, 2.45, 1.8, 0.6, 0.1],
  labels = ['00:00', '06:00', '12:00', '18:00', '24:00'],
  peakValue = '2.45 kW',
  peakTime = '12:00 PM',
  color = Colors.primary,
}) => {
  const paddingX = 24;
  const paddingY = 24;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const maxVal = Math.max(...data, 3);
  const minVal = 0;

  // Generate SVG path coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * graphWidth;
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

  // Peak point index (highest value)
  const peakIndex = points.reduce((maxIdx, pt, idx, arr) => (pt.val > arr[maxIdx].val ? idx : maxIdx), 0);
  const peakPt = points[peakIndex];

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
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
        <Path d={fillD} fill="url(#gradientArea)" />

        {/* Curved stroke path */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth="3" />

        {/* Vertical line indicator at peak point */}
        <Line
          x1={peakPt.x}
          y1={peakPt.y}
          x2={peakPt.x}
          y2={height - paddingY}
          stroke={color}
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />

        {/* Peak point indicator circle */}
        <Circle cx={peakPt.x} cy={peakPt.y} r="6" fill="#FFFFFF" stroke={color} strokeWidth="3" />

        {/* X Axis Labels */}
        {labels.map((label, idx) => {
          const x = paddingX + (idx / (labels.length - 1)) * graphWidth;
          return (
            <SvgText
              key={idx}
              x={x}
              y={height - 4}
              fontSize="10"
              fill={Colors.textMuted}
              textAnchor="middle"
              fontWeight="500"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Floating Tooltip Callout */}
      <View
        style={[
          styles.tooltip,
          {
            left: Math.min(Math.max(peakPt.x - 45, 10), width - 100),
            top: Math.max(peakPt.y - 42, 4),
          },
        ]}
      >
        <Text style={styles.tooltipVal}>{peakValue}</Text>
        <Text style={styles.tooltipTime}>{peakTime}</Text>
      </View>
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
    fontWeight: '500',
  },
});
