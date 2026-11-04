import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
  Line,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');
const SCENE_WIDTH = Math.min(width - 20, 400);
const SCENE_HEIGHT = Math.round(SCENE_WIDTH * 0.68);

export const WelcomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useApp();

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [isAuthenticated, navigation]);

  // Animation refs
  const sunPulseAnim = useRef(new Animated.Value(1)).current;
  const sunRotateAnim = useRef(new Animated.Value(0)).current;
  const photonAnim1 = useRef(new Animated.Value(0)).current;
  const photonAnim2 = useRef(new Animated.Value(0.33)).current;
  const photonAnim3 = useRef(new Animated.Value(0.66)).current;
  const shockwaveScale = useRef(new Animated.Value(1)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const houseGlowAnim = useRef(new Animated.Value(1)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  const [sunTapped, setSunTapped] = useState(false);
  const [houseSparkle, setHouseSparkle] = useState(false);

  // Continuous Breathing Sun & Flowing Photons
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulseAnim, {
          toValue: 1.12,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunPulseAnim, {
          toValue: 0.94,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const rotateLoop = Animated.loop(
      Animated.timing(sunRotateAnim, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    const runPhoton = (anim, duration = 1600, delay = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    runPhoton(photonAnim1, 1600, 0);
    runPhoton(photonAnim2, 1600, 500);
    runPhoton(photonAnim3, 1600, 1000);

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const handleSunTap = () => {
    setSunTapped(true);
    shockwaveScale.setValue(1);
    shockwaveOpacity.setValue(0.9);

    Animated.parallel([
      Animated.timing(shockwaveScale, {
        toValue: 2.8,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(shockwaveOpacity, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => setSunTapped(false));
  };

  const handleHouseTap = () => {
    setHouseSparkle(true);
    Animated.sequence([
      Animated.timing(houseGlowAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(houseGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start(() => setHouseSparkle(false));
  };

  const handlePress = (action) => {
    Animated.sequence([
      Animated.timing(btnScaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      if (action === 'getStarted') {
        navigation.navigate('SignUp');
      } else {
        navigation.navigate('Login');
      }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFCF7', '#FEF5E4', '#FEEFD6']}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Full-height non-scrolling layout */}
      <View
        style={[
          styles.inner,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 28 : 16),
            paddingBottom: Math.max(insets.bottom + 8, 24),
          },
        ]}
      >
        {/* ─── 1. Brand Header ─── */}
        <View style={styles.headerContainer}>
          <View style={styles.titleWrapper}>
            <View style={styles.headerSunGlow}>
              <Svg width={44} height={44} viewBox="0 0 46 46">
                <Defs>
                  <SvgRadialGradient id="headerGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                    <Stop offset="60%" stopColor="#FBBF24" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                <Circle cx="23" cy="23" r="22" fill="url(#headerGlow)" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <Line
                    key={i}
                    x1="23" y1="7" x2="23" y2="2"
                    stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"
                    transform={`rotate(${angle}, 23, 23)`}
                    opacity={0.65}
                  />
                ))}
              </Svg>
            </View>
            <Text style={styles.brandTitle}>Solar Guard</Text>
          </View>
        </View>

        {/* ─── 2. Illustration (flex: fills middle) ─── */}
        <View style={styles.illustrationSection}>
          <Animated.View
            style={[styles.illustrationWrapper, { transform: [{ scale: houseGlowAnim }] }]}
          >
            <Svg width={SCENE_WIDTH} height={SCENE_HEIGHT} viewBox="0 0 340 230">
              <Defs>
                <SvgRadialGradient id="sunGrad2" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="30%" stopColor="#FEF08A" stopOpacity="1" />
                  <Stop offset="75%" stopColor="#F59E0B" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#EA580C" stopOpacity="0.9" />
                </SvgRadialGradient>
                <SvgRadialGradient id="sunHalo2" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.6" />
                  <Stop offset="60%" stopColor="#FBBF24" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </SvgRadialGradient>
                <SvgLinearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.75" />
                  <Stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.4" />
                </SvgLinearGradient>
                <SvgLinearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FCD34D" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
                </SvgLinearGradient>
                <SvgLinearGradient id="panelGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="1" />
                  <Stop offset="50%" stopColor="#1E293B" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
                </SvgLinearGradient>
                <SvgLinearGradient id="houseWall2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFFDF7" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#F8F3E6" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>

              {/* Hills & wave */}
              <Path d="M 120 120 Q 200 65 330 110 L 330 190 L 120 190 Z" fill="url(#hillGrad2)" />
              <Path d="M 160 115 Q 220 70 260 100 T 330 90" stroke="url(#waveGrad2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <Line x1="200" y1="80" x2="200" y2="120" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              <Line x1="250" y1="75" x2="250" y2="120" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              <Line x1="300" y1="85" x2="300" y2="120" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

              {/* Sun */}
              <Circle cx="85" cy="65" r="38" fill="url(#sunHalo2)" />
              <Circle cx="85" cy="65" r="22" fill="url(#sunGrad2)" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <Line key={i} x1="85" y1="34" x2="85" y2="25"
                  stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"
                  transform={`rotate(${angle}, 85, 65)`} opacity={0.8} />
              ))}

              {/* Photon rays */}
              <Line x1="102" y1="78" x2="175" y2="95" stroke="#FDE047" strokeWidth="2" strokeDasharray="5,6" opacity={0.8} />
              <Line x1="94" y1="85" x2="148" y2="105" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4,6" opacity={0.6} />

              {/* Trees */}
              <Path d="M 68 185 C 45 185 45 140 68 135 C 91 140 91 185 68 185 Z" fill="#84A98C" stroke="#2D3748" strokeWidth="2" />
              <Line x1="68" y1="160" x2="68" y2="185" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M 48 185 C 38 185 36 160 52 155 C 62 165 58 185 48 185 Z" fill="#52796F" stroke="#2D3748" strokeWidth="1.8" />
              <Path d="M 276 185 C 260 185 260 145 276 138 C 292 145 292 185 276 185 Z" fill="#E0A96D" stroke="#2D3748" strokeWidth="2" />
              <Line x1="276" y1="165" x2="276" y2="185" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />

              {/* Shadow */}
              <Path d="M 50 190 Q 170 196 295 190 Q 170 200 50 190 Z" fill="#1E293B" opacity="0.18" />

              {/* House walls */}
              <Rect x="92" y="118" width="168" height="68" fill="url(#houseWall2)" stroke="#2D3748" strokeWidth="2.5" rx="2" />

              {/* Left gable */}
              <Path d="M 80 120 L 135 68 L 190 120 Z" fill="#2D3748" stroke="#2D3748" strokeWidth="2.5" strokeLinejoin="round" />
              <Path d="M 88 118 L 135 74 L 182 118 Z" fill="#F8F3E6" />

              {/* Circular attic window */}
              <Circle cx="135" cy="98" r="11" fill="#FEF08A" stroke="#2D3748" strokeWidth="2" />
              <Line x1="135" y1="87" x2="135" y2="109" stroke="#2D3748" strokeWidth="1.8" />
              <Line x1="124" y1="98" x2="146" y2="98" stroke="#2D3748" strokeWidth="1.8" />

              {/* Main roof */}
              <Path d="M 135 68 L 272 78 L 260 120 L 180 120 Z" fill="#334155" stroke="#2D3748" strokeWidth="2.5" strokeLinejoin="round" />

              {/* Solar panels */}
              <Path d="M 148 74 L 264 82 L 253 116 L 140 108 Z" fill="url(#panelGrad2)" stroke="#475569" strokeWidth="2" />
              <Line x1="168" y1="76" x2="168" y2="110" stroke="#38BDF8" strokeWidth="1.4" opacity="0.85" />
              <Line x1="192" y1="78" x2="194" y2="112" stroke="#38BDF8" strokeWidth="1.4" opacity="0.85" />
              <Line x1="216" y1="80" x2="220" y2="114" stroke="#38BDF8" strokeWidth="1.4" opacity="0.85" />
              <Line x1="240" y1="81" x2="243" y2="115" stroke="#38BDF8" strokeWidth="1.4" opacity="0.85" />
              <Line x1="145" y1="88" x2="260" y2="96" stroke="#60A5FA" strokeWidth="1.2" opacity="0.75" />
              <Line x1="142" y1="98" x2="256" y2="106" stroke="#60A5FA" strokeWidth="1.2" opacity="0.75" />
              <Path d="M 152 76 L 210 80 L 195 106 L 144 102 Z" fill="#FFFFFF" opacity="0.16" />

              {/* Windows & door */}
              <Rect x="104" y="142" width="14" height="22" fill="#FEF08A" stroke="#2D3748" strokeWidth="2" rx="1" />
              <Line x1="104" y1="153" x2="118" y2="153" stroke="#2D3748" strokeWidth="1.5" />
              <Rect x="132" y="136" width="22" height="48" fill="#475569" stroke="#2D3748" strokeWidth="2" rx="1" />
              <Circle cx="136" cy="162" r="2" fill="#FBBF24" />
              <Rect x="178" y="140" width="22" height="24" fill="#FEF08A" stroke="#2D3748" strokeWidth="2" rx="1" />
              <Line x1="189" y1="140" x2="189" y2="164" stroke="#2D3748" strokeWidth="1.5" />
              <Rect x="210" y="140" width="22" height="24" fill="#FEF08A" stroke="#2D3748" strokeWidth="2" rx="1" />
              <Line x1="221" y1="140" x2="221" y2="164" stroke="#2D3748" strokeWidth="1.5" />

              {/* Shrubs */}
              <Path d="M 88 186 C 88 178 100 178 106 186 Z" fill="#74A892" stroke="#2D3748" strokeWidth="1.8" />
              <Path d="M 160 186 C 160 176 174 176 180 186 Z" fill="#74A892" stroke="#2D3748" strokeWidth="1.8" />
              <Path d="M 238 186 C 238 175 256 175 264 186 Z" fill="#52796F" stroke="#2D3748" strokeWidth="1.8" />
            </Svg>

            {/* Animated Photon Beads */}
            {[photonAnim1, photonAnim2, photonAnim3].map((anim, idx) => {
              const pX = anim.interpolate({ inputRange: [0, 1], outputRange: [96 + idx * 4, 195 + idx * 18] });
              const pY = anim.interpolate({ inputRange: [0, 1], outputRange: [72, 98] });
              const pOpacity = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
              const pScale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.25, 0.7] });
              return (
                <Animated.View
                  key={idx}
                  pointerEvents="none"
                  style={[styles.photonParticle, { left: pX, top: pY, opacity: pOpacity, transform: [{ scale: pScale }] }]}
                >
                  <View style={styles.photonCore} />
                </Animated.View>
              );
            })}

            {/* Sun tap zone */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleSunTap} style={styles.sunTouchZone} />
            {/* House tap zone */}
            <TouchableOpacity activeOpacity={0.9} onPress={handleHouseTap} style={styles.houseTouchZone} />

            {sunTapped && (
              <Animated.View
                style={[styles.sunShockwave, { opacity: shockwaveOpacity, transform: [{ scale: shockwaveScale }] }]}
              />
            )}
          </Animated.View>
        </View>

        {/* ─── 3. Copy Section ─── */}
        <View style={styles.copyContainer}>
          <Text style={styles.headlineText}>{`Track. Optimize.\nPower.`}</Text>
          <Text style={styles.bodyDescription}>
            {'Empower your home with intelligent solar energy\nmanagement. Real-time insights, effortless savings.'}
          </Text>
        </View>

        {/* ─── 4. Action Buttons ─── */}
        <View style={styles.actionContainer}>
          <Animated.View style={{ width: '100%', transform: [{ scale: btnScaleAnim }] }}>
            <TouchableOpacity
              style={styles.primaryGetStartedBtn}
              activeOpacity={0.88}
              onPress={() => handlePress('getStarted')}
            >
              <LinearGradient
                colors={['#D97706', '#E8930A', '#F5A623']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.getStartedBtnText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.loginLinkBtn}
            activeOpacity={0.7}
            onPress={() => handlePress('login')}
          >
            <Text style={styles.loginLinkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEEFD6',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Header ──────────────────────────────────────────────────
  headerContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSunGlow: {
    position: 'absolute',
    right: -4,
    top: -16,
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
    zIndex: 2,
  },

  // ── Illustration ─────────────────────────────────────────────
  illustrationSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunTouchZone: {
    position: 'absolute',
    left: (SCENE_WIDTH * 0.5) - 100,
    top: 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 10,
  },
  houseTouchZone: {
    position: 'absolute',
    left: (SCENE_WIDTH * 0.5) - 80,
    top: 80,
    width: 170,
    height: 110,
    zIndex: 9,
  },
  sunShockwave: {
    position: 'absolute',
    left: (SCENE_WIDTH * 0.5) - 85,
    top: 45,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#F59E0B',
    zIndex: 5,
  },

  // Photon particles
  photonParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  photonCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },

  // ── Copy ─────────────────────────────────────────────────────
  copyContainer: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  headlineText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 10,
  },
  bodyDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Buttons ───────────────────────────────────────────────────
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryGetStartedBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 14,
  },
  btnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  loginLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.1,
  },
});
