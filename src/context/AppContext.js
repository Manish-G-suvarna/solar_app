import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ name: 'Alex Johnson', email: 'alex@solarflow.io' });

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
  const [temperature, setTemperature] = useState(42.3); // °C
  const [dustLevel, setDustLevel] = useState(28); // %
  const [waterLevel, setWaterLevel] = useState(65); // %
  const [location, setLocation] = useState('Bangalore, India');
  const [weather, setWeather] = useState({ temp: 32, condition: 'Sunny' });

  // Maintenance & System Controls State
  const [isCleaningActive, setIsCleaningActive] = useState(false);
  const [cleaningTimer, setCleaningTimer] = useState(0);
  
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
  const triggerCleaning = () => {
    setIsCleaningActive(true);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setCleaningTimer(count);
      if (count >= 15) {
        clearInterval(interval);
        setIsCleaningActive(false);
        setDustLevel(5); // Dust drops after cleaning!
      }
    }, 400);
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
        waterLevel,
        location,
        weather,
        isCleaningActive,
        cleaningTimer,
        triggerCleaning,
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
        settings,
        updateSetting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
