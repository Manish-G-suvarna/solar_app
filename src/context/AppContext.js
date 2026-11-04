import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || 'c08af98ffc9dbcd88f423efea3a31729';

const fetchWeatherByQuery = async (locationStr) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationStr)}&appid=${WEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
};

const fetchWeatherByCoords = async (latitude, longitude) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
};

const parseWeatherData = (data) => ({
  temp: Math.round(data.main.temp),
  condition: data.weather?.[0]?.main || 'Clear',
  description: (data.weather?.[0]?.description || '')
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  humidity: data.main?.humidity ?? '--',
  windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6), // m/s -> km/h
  feelsLike: Math.round(data.main?.feels_like ?? data.main?.temp),
  iconCode: data.weather?.[0]?.icon || '01d',
  cityName: data.name ? `${data.name}${data.sys?.country ? ', ' + data.sys.country : ''}` : null,
});

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUserState] = useState({ name: 'Alex Johnson', email: 'alex@solarguard.io' });

  // On mount, restore persisted authentication session
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedAuth = await AsyncStorage.getItem('@solarguard_auth');
        const storedUser = await AsyncStorage.getItem('@solarguard_user');
        if (isMounted) {
          if (storedAuth === 'true') {
            setIsAuthenticatedState(true);
          }
          if (storedUser) {
            try {
              setUserState(JSON.parse(storedUser));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Could not restore auth session:', err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setIsAuthenticated = useCallback(async (val) => {
    setIsAuthenticatedState(val);
    try {
      if (val) {
        await AsyncStorage.setItem('@solarguard_auth', 'true');
      } else {
        await AsyncStorage.removeItem('@solarguard_auth');
      }
    } catch (e) {
      console.warn('Failed to persist auth status:', e);
    }
  }, []);

  const setUser = useCallback(async (newUserData) => {
    setUserState((prev) => {
      const updated = typeof newUserData === 'function' ? newUserData(prev) : { ...prev, ...newUserData };
      AsyncStorage.setItem('@solarguard_user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticatedState(false);
    try {
      await AsyncStorage.removeItem('@solarguard_auth');
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  }, []);

  // System Operational Telemetries
  const [systemOnline, setSystemOnline] = useState(true);
  const [sunTrackingActive, setSunTrackingActive] = useState(true);
  const [panelAngle, setPanelAngle] = useState(35); // degrees
  const [currentPower, setCurrentPower] = useState(2.45); // kW
  const [todayEnergy, setTodayEnergy] = useState(18.62); // kWh
  const [totalEnergy, setTotalEnergy] = useState(4.82); // MWh
  const [efficiency, setEfficiency] = useState(91.3); // %
  const [batteryLevel, setBatteryLevel] = useState(78); // %
  const [isCharging, setIsCharging] = useState(true);

  // Environmental Data
  const [temperature, setTemperature] = useState(26.5); // °C real-time synced
  const [dustLevel, setDustLevel] = useState(28); // %
  const [waterLevel, setWaterLevel] = useState(65); // %
  const [location, setLocation] = useState('Bangalore, India');
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [weather, setWeather] = useState({
    temp: '--',
    condition: 'Loading...',
    description: '',
    humidity: '--',
    windSpeed: '--',
    feelsLike: '--',
    iconCode: '01d',
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Fetch weather using either GPS coords or location query string
  const refreshWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let data;
      if (coords && coords.latitude && coords.longitude) {
        data = await fetchWeatherByCoords(coords.latitude, coords.longitude);
      } else {
        data = await fetchWeatherByQuery(location);
      }
      const parsed = parseWeatherData(data);
      if (parsed.cityName && (!coords || !location)) {
        setLocation(parsed.cityName);
      }
      setWeather(parsed);
      setTemperature(parsed.temp);
    } catch (e) {
      setWeatherError('Unable to fetch weather');
    } finally {
      setWeatherLoading(false);
    }
  }, [coords, location]);

  // Detect GPS location from device and fetch real-time weather
  const detectDeviceLocationAndWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Permission denied: fallback to current location query
        const data = await fetchWeatherByQuery(location);
        const parsed = parseWeatherData(data);
        setWeather(parsed);
        setTemperature(parsed.temp);
        setWeatherError('Location permission denied (using saved city)');
        return { success: false, reason: 'Permission denied' };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      const data = await fetchWeatherByCoords(latitude, longitude);
      const parsed = parseWeatherData(data);
      if (parsed.cityName) {
        setLocation(parsed.cityName);
      }
      setWeather(parsed);
      setTemperature(parsed.temp);
      return { success: true, cityName: parsed.cityName, temp: parsed.temp };
    } catch (err) {
      console.warn('GPS detection failed, falling back to query:', err);
      try {
        const data = await fetchWeatherByQuery(location);
        const parsed = parseWeatherData(data);
        setWeather(parsed);
        setTemperature(parsed.temp);
      } catch (fallbackErr) {
        setWeatherError('Unable to fetch weather');
      }
      return { success: false, reason: err.message };
    } finally {
      setWeatherLoading(false);
    }
  }, [location]);

  // Fetch weather for any custom city entered by user
  const fetchWeatherForCity = useCallback(async (cityName) => {
    if (!cityName || !cityName.trim()) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchWeatherByQuery(cityName.trim());
      const parsed = parseWeatherData(data);
      const resolvedName = parsed.cityName || cityName.trim();
      setCoords(null);
      setLocation(resolvedName);
      setWeather(parsed);
      setTemperature(parsed.temp);
      return { success: true, cityName: resolvedName, temp: parsed.temp };
    } catch (err) {
      setWeatherError(`Could not find weather for "${cityName}"`);
      return { success: false, reason: err.message };
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // On initial mount: attempt GPS detection, then schedule auto-refresh every 10 min
  useEffect(() => {
    detectDeviceLocationAndWeather();
    const interval = setInterval(refreshWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Maintenance & System Controls State
  const [isCleaningActive, setIsCleaningActive] = useState(false);
  const [cleaningTimer, setCleaningTimer] = useState(0);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [cleaningStatusText, setCleaningStatusText] = useState('Ready');
  const cleaningIntervalRef = useRef(null);

  // ESP32 Hardware Integration State (Dual LDR, Servo Tracker, Relay Pump, DS18B20 Temp)
  const [pumpOn, setPumpOn] = useState(false);
  const [wiperStatus, setWiperStatus] = useState('IDLE'); // 'IDLE', '30CM_FRONT', '30CM_BACK', 'PAUSED'
  const [espConfig, setEspConfig] = useState({
    ip: '192.168.194.44:5005', // Default PC Bridge or ESP32 Wi-Fi IP
    connected: false,
    lastSeen: null,
    leftLdr: 1850,
    rightLdr: 1920,
    servoAngle: 90,
    hardwareTemp: 26.5,
    tempValid: true,
    wiperStatus: 'IDLE',
  });

  const [invertRelay, setInvertRelay] = useState(false);

  const toggleInvertRelay = useCallback((val) => {
    const nextVal = typeof val === 'boolean' ? val : !invertRelay;
    setInvertRelay(nextVal);
    try {
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      fetch(`http://${cleanHost}/invert?state=${nextVal ? 1 : 0}`);
    } catch (e) {}
  }, [invertRelay, espConfig.ip]);

  // Method to send pump ON/OFF command to ESP32 and update state
  const setPumpState = useCallback(async (state) => {
    // Optimistically update local state immediately
    setPumpOn(state);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      const endpoint = state ? 'pump/on' : 'pump/off';
      const url = `http://${cleanHost}/${endpoint}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        console.log(`[ESP32] Pump command sent → ${state ? 'ON' : 'OFF'}, response:`, data);
        setEspConfig((prev) => ({
          ...prev,
          connected: true,
          lastSeen: new Date().toLocaleTimeString(),
        }));
      }
    } catch (err) {
      console.warn(`[ESP32] Bridge unreachable at ${espConfig.ip} — running in simulation mode`);
      setEspConfig((prev) => ({ ...prev, connected: false }));
    }
  }, [espConfig.ip]);

  // Wiper 30cm slider motor commands
  const triggerWiperCycle = useCallback(async () => {
    setWiperStatus('30CM_FRONT');
    try {
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      await fetch(`http://${cleanHost}/wiper/cycle`);
    } catch (e) {
      console.warn('[ESP32] Wiper cycle dispatch error (simulation mode)');
    }
  }, [espConfig.ip]);

  const triggerWiperForward = useCallback(async () => {
    setWiperStatus('30CM_FRONT');
    try {
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      await fetch(`http://${cleanHost}/wiper/forward`);
    } catch (e) {
      console.warn('[ESP32] Wiper forward dispatch error (simulation mode)');
    }
  }, [espConfig.ip]);

  const triggerWiperBackward = useCallback(async () => {
    setWiperStatus('30CM_BACK');
    try {
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      await fetch(`http://${cleanHost}/wiper/backward`);
    } catch (e) {
      console.warn('[ESP32] Wiper backward dispatch error (simulation mode)');
    }
  }, [espConfig.ip]);

  const triggerWiperStop = useCallback(async () => {
    setWiperStatus('IDLE');
    try {
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      await fetch(`http://${cleanHost}/wiper/stop`);
    } catch (e) {}
  }, [espConfig.ip]);

  const togglePump = useCallback(() => {
    setPumpState(!pumpOn);
  }, [pumpOn, setPumpState]);

  const updateEspIp = useCallback((newIp) => {
    if (newIp && newIp.trim()) {
      setEspConfig((prev) => ({ ...prev, ip: newIp.trim() }));
    }
  }, []);

  // Poll ESP32 hardware status every 3 seconds
  const syncHardwareStatus = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const cleanHost = espConfig.ip.replace(/^https?:\/\//, '').trim();
      const url = `http://${cleanHost}/status`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.pump === 'boolean') {
          setPumpOn(data.pump);
        }
        if (data.wiper) {
          setWiperStatus(data.wiper);
        }
        if (typeof data.servo === 'number') {
          setPanelAngle(Math.round(data.servo));
        }
        if (data.tempValid && typeof data.temp === 'number') {
          setTemperature(+(data.temp.toFixed(1)));
        }
        setEspConfig((prev) => ({
          ...prev,
          connected: true,
          lastSeen: new Date().toLocaleTimeString(),
          leftLdr: data.leftLdr ?? prev.leftLdr,
          rightLdr: data.rightLdr ?? prev.rightLdr,
          servoAngle: typeof data.servo === 'number' ? Math.round(data.servo) : prev.servoAngle,
          hardwareTemp: typeof data.temp === 'number' ? +(data.temp.toFixed(1)) : prev.hardwareTemp,
          tempValid: data.tempValid !== undefined ? !!data.tempValid : true,
          wiperStatus: data.wiper ?? prev.wiperStatus,
        }));
      }
    } catch (err) {
      setEspConfig((prev) => ({ ...prev, connected: false }));
    }
  }, [espConfig.ip, invertRelay]);

  useEffect(() => {
    syncHardwareStatus();
    const interval = setInterval(syncHardwareStatus, 3000);
    return () => clearInterval(interval);
  }, [syncHardwareStatus]);

  const [cleaningHistory, setCleaningHistory] = useState([
    {
      id: 'c1',
      time: 'Today, 06:30 AM',
      duration: '15 mins',
      mode: 'Standard Wash',
      status: 'Completed',
      dustReduced: '28% → 5%',
      waterUsed: '8 L',
    },
    {
      id: 'c2',
      time: 'May 10, 09:30 AM',
      duration: '15 mins',
      mode: 'Standard Wash',
      status: 'Completed',
      dustReduced: '34% → 6%',
      waterUsed: '8 L',
    },
    {
      id: 'c3',
      time: 'May 07, 08:00 AM',
      duration: '15 mins',
      mode: 'Standard Wash',
      status: 'Completed',
      dustReduced: '42% → 4%',
      waterUsed: '8 L',
    },
  ]);
  
  const [isCoolingActive, setIsCoolingActive] = useState(true);
  const [fanStatus, setFanStatus] = useState('On');

  // Schedules
  const [schedules, setSchedules] = useState([
    { id: '1', title: 'Auto Cleaning', time: 'May 12, 09:00 AM', enabled: true, type: 'Cleaning' },
    { id: '2', title: 'Dust Threshold', detail: '30%', enabled: true, type: 'Cleaning' },
    { id: '3', title: 'Auto Cooling', time: 'May 12, 11:00 AM', enabled: true, type: 'Cooling' },
    { id: '4', title: 'Temp. Threshold', detail: '45°C', enabled: true, type: 'Cooling' },
    { id: '5', title: 'Weather Based', detail: 'Adaptive schedule', enabled: true, type: 'Other' },
    { id: '6', title: 'Allowed Time', detail: '06:00 AM - 06:00 PM', enabled: true, type: 'Other' },
    { id: '7', title: 'Auto Actions', detail: 'AI Triggered', enabled: true, type: 'Other' },
  ]);

  // Faults List
  const [faults, setFaults] = useState([
    {
      id: 'f1',
      title: 'High Temperature',
      desc: 'Panel temp reached 42.3°C',
      severity: 'Critical',
      time: '5 min ago',
    },
    {
      id: 'f2',
      title: 'Dust Level High',
      desc: 'Dust level is 28%',
      severity: 'High',
      time: '18 min ago',
    },
    {
      id: 'f3',
      title: 'Tracker Motor Issue',
      desc: 'Motor not responding',
      severity: 'Medium',
      time: '1 hr ago',
    },
  ]);

  // Notifications List
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'High Dust Level',
      desc: 'Dust level is 28%',
      time: '2 min ago',
      category: 'Alerts',
      read: false,
    },
    {
      id: 'n2',
      title: 'High Temperature',
      desc: 'Panel temp reached 42.3°C',
      time: '5 min ago',
      category: 'Alerts',
      read: false,
    },
    {
      id: 'n3',
      title: 'Cleaning Completed',
      desc: 'Panel cleaned successfully',
      time: '1 hr ago',
      category: 'System',
      read: true,
    },
    {
      id: 'n4',
      title: 'Cooling Activated',
      desc: 'Cooling system turned on',
      time: '2 hr ago',
      category: 'System',
      read: true,
    },
    {
      id: 'n5',
      title: 'Low Battery',
      desc: 'Battery level is 78%',
      time: '3 hr ago',
      category: 'Info',
      read: true,
    },
    {
      id: 'n6',
      title: 'Device Offline',
      desc: 'Solar tracker is offline',
      time: '5 hr ago',
      category: 'Alerts',
      read: true,
    },
  ]);

  // Settings
  const [settings, setSettings] = useState({
    systemMode: 'Automatic',
    dustThreshold: 30,
    tempThreshold: 45,
    cleaningDuration: 15,
    coolingDuration: 20,
    notificationsEnabled: true,
  });

  // Action Methods
  const startCleaning = (mode = 'Standard Wash', totalSteps = 15, zone = 'All Arrays') => {
    if (cleaningIntervalRef.current) {
      clearInterval(cleaningIntervalRef.current);
    }
    setIsCleaningActive(true);
    setPumpState(true);
    triggerWiperCycle(); // Pin 27: 30cm front & back cycle
    setCleaningTimer(totalSteps);
    setCleaningProgress(0);
    setCleaningStatusText(`Initializing ${mode} on ${zone}...`);

    let currentStep = 0;
    cleaningIntervalRef.current = setInterval(() => {
      currentStep += 1;
      const remaining = totalSteps - currentStep;
      setCleaningTimer(remaining);
      const progressPct = Math.round((currentStep / totalSteps) * 100);
      setCleaningProgress(progressPct);

      if (currentStep <= 4) {
        setCleaningStatusText('Water pump & spray nozzles engaged...');
      } else if (currentStep <= 10) {
        setCleaningStatusText(`Wiping & washing ${zone} (${progressPct}%)...`);
      } else {
        setCleaningStatusText('Finishing wash cycle and drying panels...');
      }

      if (currentStep >= totalSteps) {
        clearInterval(cleaningIntervalRef.current);
        cleaningIntervalRef.current = null;
        setIsCleaningActive(false);
        setPumpState(false);
    triggerWiperStop();
        setCleaningProgress(100);
        setCleaningStatusText('Completed');
        setDustLevel((prev) => Math.max(3, Math.round(prev * 0.15)));
        setWaterLevel((prev) => Math.max(0, prev - 6));

        const now = new Date();
        const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        setCleaningHistory((prev) => [
          {
            id: String(Date.now()),
            time: timeStr,
            duration: `${totalSteps}s (sim)`,
            mode: 'Standard Wash',
            status: 'Completed',
            dustReduced: `${dustLevel}% → 4%`,
            waterUsed: '8 L',
          },
          ...prev,
        ]);
      }
    }, 450);
  };

  const stopCleaning = () => {
    if (cleaningIntervalRef.current) {
      clearInterval(cleaningIntervalRef.current);
      cleaningIntervalRef.current = null;
    }
    setIsCleaningActive(false);
    setPumpState(false);
    triggerWiperStop();
    setCleaningStatusText('Aborted by user');
  };

  const triggerCleaning = () => {
    startCleaning('Standard Wash', 15, 'All Arrays');
  };

  const refillWaterTank = () => {
    setWaterLevel(100);
  };

  const toggleCooling = () => {
    const nextState = !isCoolingActive;
    setIsCoolingActive(nextState);
    setFanStatus(nextState ? 'On' : 'Off');
  };

  const toggleSchedule = (id) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const addSchedule = (newSched) => {
    setSchedules((prev) => [
      ...prev,
      { id: String(Date.now()), enabled: true, ...newSched },
    ]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateSetting = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        isAuthLoading,
        setUser,
        logout,
        user,
        systemOnline,
        setSystemOnline,
        sunTrackingActive,
        setSunTrackingActive,
        panelAngle,
        currentPower,
        todayEnergy,
        totalEnergy,
        efficiency,
        batteryLevel,
        isCharging,
        temperature,
        dustLevel,
        setDustLevel,
        waterLevel,
        setWaterLevel,
        location,
        setLocation,
        coords,
        weather,
        weatherLoading,
        weatherError,
        refreshWeather,
        detectDeviceLocationAndWeather,
        fetchWeatherForCity,
        isCleaningActive,
        cleaningTimer,
        cleaningProgress,
        cleaningStatusText,
        cleaningHistory,
        startCleaning,
        stopCleaning,
        triggerCleaning,
        refillWaterTank,
        isCoolingActive,
        toggleCooling,
        fanStatus,
        schedules,
        toggleSchedule,
        addSchedule,
        faults,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsRead,
        pumpOn,
        setPumpState,
        togglePump,
        wiperStatus,
        triggerWiperCycle,
        triggerWiperForward,
        triggerWiperBackward,
        triggerWiperStop,
        espConfig,
        updateEspIp,
        syncHardwareStatus,
        invertRelay,
        toggleInvertRelay,
        setInvertRelay,
        settings,
        updateSetting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
