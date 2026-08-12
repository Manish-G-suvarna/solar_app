import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Graphic Illustration */}
        <View style={styles.illustrationContainer}>
          <Svg width={width * 0.75} height={220} viewBox="0 0 300 220">
            <Defs>
              <LinearGradient id="sunGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FBBF24" />
                <Stop offset="100%" stopColor="#F59E0B" />
              </LinearGradient>
              <LinearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#1E3A8A" />
                <Stop offset="100%" stopColor="#0F172A" />
              </LinearGradient>
            </Defs>

            {/* Sun & Rays */}
            <Circle cx="80" cy="70" r="40" fill="url(#sunGlow)" opacity="0.9" />
            <Circle cx="80" cy="70" r="55" fill="#FBBF24" opacity="0.2" />

            {/* Solar Panel Base & Frame */}
            <Path d="M 100 170 L 250 130 L 260 175 L 90 200 Z" fill="url(#panelGrad)" />
            <Path d="M 130 180 L 135 210 L 145 210 L 140 180 Z" fill="#475569" />
            <Path d="M 210 160 L 215 195 L 225 195 L 220 160 Z" fill="#475569" />

            {/* Panel Grid Lines */}
            <Path d="M 175 150 L 175 188" stroke="#3B82F6" strokeWidth="2" />
            <Path d="M 125 160 L 255 145" stroke="#3B82F6" strokeWidth="1.5" />
            <Path d="M 115 178 L 258 163" stroke="#3B82F6" strokeWidth="1.5" />

            {/* Eco Leaves */}
            <Path d="M 40 180 C 20 160, 20 130, 60 140 C 60 170, 40 180, 40 180 Z" fill="#10B981" />
            <Path d="M 50 175 C 60 150, 90 140, 85 165 C 75 175, 50 175, 50 175 Z" fill="#34D399" />
          </Svg>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Svg width={28} height={28} viewBox="0 0 32 32">
                <Circle cx="16" cy="16" r="14" fill={Colors.accentLime} />
                <Path d="M 8 16 L 24 16 M 16 8 L 16 24" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
              </Svg>
            </View>
            <View>
              <Text style={styles.brandTitle}>SolarFlow</Text>
              <Text style={styles.brandSub}>Smart Solar Monitoring</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryBtnText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.secondaryBtnText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={styles.tagline}>Monitor. Optimize. Save.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  illustrationContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: '#C6EADF',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
