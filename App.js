import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppProvider, useApp } from './src/context/AppContext';
import { CustomTabBar } from './src/components/CustomTabBar';

// Screens
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LivePanelStatusScreen } from './src/screens/LivePanelStatusScreen';
import { EnergyAnalyticsScreen } from './src/screens/EnergyAnalyticsScreen';
import { CleaningScreen } from './src/screens/CleaningScreen';
import { CoolingScreen } from './src/screens/CoolingScreen';
import { SchedulingScreen } from './src/screens/SchedulingScreen';
import { FaultsMaintenanceScreen } from './src/screens/FaultsMaintenanceScreen';
import { AIInsightsScreen } from './src/screens/AIInsightsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WeatherForecastScreen } from './src/screens/WeatherForecastScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="AnalyticsTab"
        component={EnergyAnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="CleaningTab"
        component={CleaningScreen}
        options={{ tabBarLabel: 'Cleaning' }}
      />
      <Tab.Screen name="CoolingTab" component={CoolingScreen} options={{ tabBarLabel: 'Cooling' }} />
      <Tab.Screen
        name="AIInsightsTab"
        component={AIInsightsScreen}
        options={{ tabBarLabel: 'AI Insights' }}
      />
      <Tab.Screen name="MoreTab" component={SettingsScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { isAuthenticated, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Welcome'}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="LivePanelStatus" component={LivePanelStatusScreen} />
        <Stack.Screen name="WeatherForecast" component={WeatherForecastScreen} />
        <Stack.Screen name="EnergyAnalytics" component={EnergyAnalyticsScreen} />
        <Stack.Screen name="Cleaning" component={CleaningScreen} />
        <Stack.Screen name="Cooling" component={CoolingScreen} />
        <Stack.Screen name="Scheduling" component={SchedulingScreen} />
        <Stack.Screen name="FaultsMaintenance" component={FaultsMaintenanceScreen} />
        <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <NavigationRoot />
        </SafeAreaProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FCFBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
