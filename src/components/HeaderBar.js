import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const HeaderBar = ({
  title,
  showBack = true,
  onBackPress,
  navigation,
  rightIcon,
  onRightPress,
}) => {
  const { unreadNotificationsCount } = useApp();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleRight = () => {
    if (onRightPress) {
      onRightPress();
    } else if (navigation) {
      navigation.navigate('Notifications');
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.openDrawer?.()} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={26} color={Colors.primaryDark} />
        </TouchableOpacity>
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <TouchableOpacity style={styles.iconBtn} onPress={handleRight} activeOpacity={0.7}>
        <Ionicons
          name={rightIcon || 'notifications-outline'}
          size={24}
          color={Colors.primaryDark}
        />
        {!rightIcon && unreadNotificationsCount > 0 && (
          <View style={styles.badgeDot}>
            <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
    flex: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
