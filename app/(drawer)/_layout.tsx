import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../../api/axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useAuthContext } from '../AuthProvider';

const { width, height } = Dimensions.get('window');

export default function DrawerLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authContext = useAuthContext();
  const user = authContext?.user || null;
  const [selectedDate] = useState(new Date());
  const [activityData, setActivityData] = useState<{ [key: string]: boolean }>({});

  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const menuIconOpacity = useRef(new Animated.Value(1)).current;
  
  // Widget animations
  const profileAnim = useRef(new Animated.Value(0)).current;
  const promoAnim = useRef(new Animated.Value(0)).current;
  const quadAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const socialAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    
    // Fade out menu icon
    Animated.timing(menuIconOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Content scale up
    Animated.spring(contentScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Staggered widget animations
    const widgets = [profileAnim, promoAnim, quadAnim, calendarAnim, socialAnim];
    widgets.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 50);
    });
  };

  const closeDrawer = () => {
    setIsClosing(true);
    
    // All animations out
    const widgets = [profileAnim, promoAnim, quadAnim, calendarAnim, socialAnim];
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      ...widgets.map(anim => 
        Animated.timing(anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
      
      // Fade in menu icon with delay
      setTimeout(() => {
        Animated.timing(menuIconOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }, 200);
    });
  };

  const createWidgetStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        })
      }
    ]
  });

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?._id || parsedUser?.userId || (user as any)?._id || (user as any)?.userId;
        if (!userId) return;

        const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

        const response = await api.get(`/activity/${userId}/${startDate}/${endDate}`);
        const activities = (response.data || []).reduce(
          (acc: { [key: string]: boolean }, activity: any) => {
            if (activity?.date) {
              const date = format(new Date(activity.date), 'yyyy-MM-dd');
              acc[date] = true;
            }
            return acc;
          },
          {},
        );

        setActivityData(activities);
      } catch (error) {
        console.error('Error fetching drawer activity data:', error);
      }
    };

    if (isDrawerOpen) {
      fetchActivityData();
    }
  }, [isDrawerOpen, selectedDate, user]);

  const firstDayOfMonth = getDay(startOfMonth(selectedDate));
  const daysInMonth = endOfMonth(selectedDate).getDate();
  const monthLabel = format(selectedDate, 'MMMM yyyy');

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      
      {/* Menu Button */}
      <Animated.View 
        style={[
          styles.menuButton,
          {
            top: Platform.OS === 'ios' ? Math.max(insets.top, 20) : insets.top,
            opacity: menuIconOpacity,
          }
        ]}
      >
        <TouchableOpacity onPress={openDrawer}>
          <LinearGradient
            colors={[COLORS.primaryDark, 'rgba(0, 0, 0, 0.3)']}
            style={styles.menuButtonGradient}
          >
            <Feather name="menu" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Drawer Overlay */}
      {(isDrawerOpen || isClosing) && (
        <Animated.View 
          style={[
            styles.drawerOverlay,
            { opacity: backgroundOpacity }
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.7)',
              'rgba(243, 112, 33, 0.1)', // OrangeQuery primary with low opacity
              'rgba(51, 51, 51, 0.7)'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          
          <Animated.View 
            style={[
              styles.drawerContent,
              {
                transform: [{ scale: contentScale }],
                marginTop: Math.max(insets.top + 24, 40),
                height: '88%',
              }
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeDrawer}>
              <Feather name="x" size={18} color="white" />
            </TouchableOpacity>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Section */}
              <Animated.View style={[styles.profileSection, createWidgetStyle(profileAnim)]}>
                <View style={styles.profileImageContainer}>
                  {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={[styles.profileImage, styles.defaultAvatar]}>
                      <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.statusIndicator} />
                </View>
              </Animated.View>


              {/* Quad Widget (Saved Items) */}
              <Animated.View style={createWidgetStyle(quadAnim)}>
                <View style={styles.widgetSection}>
                  <Text style={styles.widgetSectionTitle}>Quick Access</Text>
                  <View style={styles.widgetBackground}>
                    <View style={styles.widgetGrid}>
                      <TouchableOpacity 
                        style={styles.widgetCard}
                        onPress={() => {
                          closeDrawer();
                          router.push('/(drawer)/(tabs)/exercises');
                        }}
                      >
                        <View style={styles.widgetIconContainer}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.widgetIcon}
                          >
                            <Ionicons name="barbell" size={20} color="#fff" />
                          </LinearGradient>
                        </View>
                        <View style={styles.widgetCardContent}>
                          <Text style={styles.widgetCardTitle}>Exercises</Text>
                          <Text style={styles.widgetCardSubtitle}>Browse workouts</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.widgetCard}
                        onPress={() => {
                          closeDrawer();
                          router.push('/(drawer)/(tabs)/stepCount');
                        }}
                      >
                        <View style={styles.widgetIconContainer}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.widgetIcon}
                          >
                            <Ionicons name="walk" size={20} color="#fff" />
                          </LinearGradient>
                        </View>
                        <View style={styles.widgetCardContent}>
                          <Text style={styles.widgetCardTitle}>Steps</Text>
                          <Text style={styles.widgetCardSubtitle}>Track daily steps</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.widgetCard}
                        onPress={() => {
                          closeDrawer();
                          router.push('/(drawer)/workoutHistory');
                        }}
                      >
                        <View style={styles.widgetIconContainer}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.widgetIcon}
                          >
                            <Ionicons name="time" size={20} color="#fff" />
                          </LinearGradient>
                        </View>
                        <View style={styles.widgetCardContent}>
                          <Text style={styles.widgetCardTitle}>History</Text>
                          <Text style={styles.widgetCardSubtitle}>View workouts</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.widgetCard}
                        onPress={() => {
                          closeDrawer();
                          router.push('/(drawer)/(tabs)/profile');
                        }}
                      >
                        <View style={styles.widgetIconContainer}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.widgetIcon}
                          >
                            <Ionicons name="person" size={20} color="#fff" />
                          </LinearGradient>
                        </View>
                        <View style={styles.widgetCardContent}>
                          <Text style={styles.widgetCardTitle}>Profile</Text>
                          <Text style={styles.widgetCardSubtitle}>View your profile</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Calendar Activity Widget */}
              <Animated.View style={createWidgetStyle(calendarAnim)}>
                <View style={styles.calendarSection}>
                  <Text style={styles.widgetSectionTitle}>Activity Calendar</Text>
                  <View style={styles.calendarBackground}>
                    <Text style={styles.calendarTitle}>{monthLabel}</Text>
                    <View style={styles.calendarGrid}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <Text key={index} style={styles.dayHeader}>{day}</Text>
                      ))}
                      {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.dayCell} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const dateString = format(
                          new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            day,
                          ),
                          'yyyy-MM-dd',
                        );
                        const isActiveDay = Boolean(activityData[dateString]);
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

                        return (
                        <View key={day} style={styles.dayCell}>
                          <View style={[
                            styles.dayWrapper,
                            isToday && styles.todayWrapper,
                            isActiveDay ? styles.usedDayWrapper : styles.unusedDayWrapper
                          ]}>
                            <Text style={styles.dayText}>{day}</Text>
                          </View>
                        </View>
                      )})}
                    </View>
                  </View>
                </View>
              </Animated.View>

              <View style={{ height: 100 }} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    left: 12,
    width: 40,
    height: 40,
    zIndex: 1000,
  },
  menuButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(255, 255, 255)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContent: {
    width: '90%',
    height: '98%',
    backgroundColor: 'transparent',
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: 16,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  profileSection: {
    paddingTop: 10,
    paddingLeft: 4,
    paddingBottom: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  defaultAvatar: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.7)',
  },
  promoSection: {
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  promoSectionTitle: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  runClubPromoCard: {
    width: width - 16,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
  },
  runClubPromoGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  runClubPromoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  runClubPromoContent: {
    flex: 1,
  },
  runClubPromoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  runClubPromoSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 12,
  },
  runClubPromoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  runClubPromoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  widgetSection: {
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  widgetSectionTitle: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  widgetBackground: {
    borderRadius: 20,
    padding: 16,
    paddingBottom: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  widgetCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 8,
  },
  widgetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  widgetIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetCardContent: {
    flex: 1,
  },
  widgetCardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  widgetCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  calendarSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  calendarBackground: {
    borderRadius: 20,
    padding: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  calendarTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayWrapper: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12.5,
  },
  usedDayWrapper: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  unusedDayWrapper: {
    backgroundColor: 'rgba(255, 82, 82, 0.3)',
  },
  todayWrapper: {
    borderWidth: 1,
    borderColor: '#fff',
  },
  dayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  socialSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  socialIconWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  socialIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
