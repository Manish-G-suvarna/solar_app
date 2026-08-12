import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        let iconName = 'home';
        if (route.name === 'HomeTab') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'AnalyticsTab') iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'CleaningTab') iconName = isFocused ? 'sparkles' : 'sparkles-outline';
        else if (route.name === 'CoolingTab') iconName = isFocused ? 'thermometer' : 'thermometer-outline';
        else if (route.name === 'AIInsightsTab') iconName = isFocused ? 'hardware-chip' : 'hardware-chip-outline';
        else if (route.name === 'AlertsTab') iconName = isFocused ? 'warning' : 'warning-outline';
        else if (route.name === 'MoreTab') iconName = isFocused ? 'grid' : 'grid-outline';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, isFocused && styles.activeIconBox]}>
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text style={[styles.label, { color: isFocused ? Colors.primary : Colors.textMuted }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeIconBox: {
    backgroundColor: Colors.primarySoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
