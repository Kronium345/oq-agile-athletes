import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import { useAuthContext } from '../app/AuthProvider';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { COLORS } from '../constants/theme';

// Nav Bar Tab Icons Start
const tabIcons = {
  more: {
    active: require('@/assets/icons/more-tab.png'),
    default: require('@/assets/icons/more-tab.png')
  },
  trainer: {
    active: require('@/assets/icons/trainer-tab.png'),
    default: require('@/assets/icons/trainer-tab.png')
  },
  home: {
    active: require('@/assets/icons/home-tab.png'),
    default: require('@/assets/icons/home-tab.png')
  },
  steps: {
    active: require('@/assets/icons/steps-tab.png'),
    default: require('@/assets/icons/steps-tab.png')
  },
  profile: {
    active: require('@/assets/icons/profile-tab.png'),
    default: require('@/assets/icons/profile-tab.png')
  },
  settings: require('@/assets/icons/settings.png')
};
// Nav Bar Tab Icons End


// BlobBackground is now imported from components


const { width: screenWidth } = Dimensions.get('window');


// Set Tracker Component Start
interface SetData {
  [key: number]: { rest: string; weight: string; reps: string };
}

interface SetTrackerProps {
  onLogExercise: (sets: number, reps: number, weight: number, setDetails: SetData) => void;
}

const SetTracker: React.FC<SetTrackerProps> = ({ onLogExercise }) => {
  const [sets, setSets] = useState<number[]>([1]);
  const [logStatus, setLogStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [setData, setSetData] = useState<SetData>({
    1: { rest: '0s', weight: '0', reps: '0' }
  });
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

  const addSet = () => {
    const newSetNumber = sets.length + 1;
    setSets([...sets, newSetNumber]);
    setSetData(prev => ({
      ...prev,
      [newSetNumber]: { rest: '0s', weight: '0', reps: '0' }
    }));
  };

  const handleComplete = (setNumber: number) => {
    setCompletedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setNumber)) {
        newSet.delete(setNumber);
      } else {
        newSet.add(setNumber);
      }
      return newSet;
    });
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      const newSets = sets.slice(0, -1);
      const lastSet = sets[sets.length - 1];
      setSets(newSets);
      const newSetData: SetData = { ...setData };
      delete newSetData[lastSet];
      setSetData(newSetData);
    }
  };

  const updateSetValue = (setNumber: number, field: string, value: string) => {
    setSetData(prev => ({
      ...prev,
      [setNumber]: {
        ...(prev[setNumber] || { rest: '0s', weight: '0', reps: '0' }),
        [field]: value
      }
    }));
  };

  const handleLogExercise = () => {
    console.log('=== Set Tracker Log Process ===');
    console.log('Current sets:', sets);
    console.log('Current setData:', setData);
    console.log('Completed sets:', Array.from(completedSets));

    // Validate that all fields have values and setData exists
    if (!setData || Object.keys(setData).length === 0) {
      console.log('Validation failed: No set data available');
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'No set data available',
        position: 'bottom',
      });
      return;
    }

    const hasEmptyFields = Object.values(setData).some(
      set => !set || set.weight === '0' || set.reps === '0'
    );

    if (hasEmptyFields) {
      console.log('Validation failed: Empty fields detected');
      console.log('Set data with empty fields:',
        Object.entries(setData)
          .filter(([_, set]) => !set || set.weight === '0' || set.reps === '0')
      );
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please fill in weight and reps for all sets',
        position: 'bottom',
      });
      return;
    }

    const totalSets = sets.length;
    const avgReps = Math.round(
      Object.values(setData).reduce((sum, set) => sum + parseInt(String(set?.reps || 0), 10), 0) / totalSets
    );
    const avgWeight = parseFloat(
      (Object.values(setData).reduce((sum, set) => sum + parseFloat(String(set?.weight || 0)), 0) / totalSets).toFixed(2)
    );

    console.log('Calculated values:', {
      totalSets,
      avgReps,
      avgWeight,
      setDetails: setData
    });

    // Pass the full setData along with the averages
    onLogExercise(totalSets, avgReps, avgWeight, setData);
    console.log('=== End Set Tracker Log Process ===\n');
    setLogStatus('success');
    setTimeout(() => setLogStatus('idle'), 3000); // Hide after 3 seconds

  };

  return (
    <View style={styles.setTrackerContainer}>
      <View style={styles.headerRow}>
        <Text style={[styles.columnHeader, styles.setColumn]}>SET</Text>
        <Text style={[styles.columnHeader, styles.restColumn]}>REST</Text>
        <Text style={[styles.columnHeader, styles.kgColumn]}>KG</Text>
        <Text style={[styles.columnHeader, styles.repsColumn]}>REPS</Text>
        <Text style={styles.columnHeader}></Text>
      </View>

      {sets.map((setNumber) => (
        <View key={setNumber} style={styles.setRow}>
          <View style={styles.setColumn}>
            <TextInput
              style={styles.setInput}
              value={setNumber.toString()}
              onChangeText={(value) => {
                const newSetNumber = parseInt(value, 10);
                if (!isNaN(newSetNumber) && newSetNumber > 0) {
                  // Update the set data with the new set number
                  setSetData(prev => {
                    const newData = { ...prev };
                    delete newData[setNumber];
                    newData[newSetNumber] = prev[setNumber] || { rest: '0s', weight: '0', reps: '0' };
                    return newData;
                  });
                  // Update the sets array
                  setSets(prev => prev.map(num => num === setNumber ? newSetNumber : num).sort((a, b) => a - b));
                }
              }}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <View style={styles.restColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.rest}
              onChangeText={(value) => updateSetValue(setNumber, 'rest', value)}
              keyboardType="default"
              placeholder="0s"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <View style={styles.kgColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.weight}
              onChangeText={(value) => updateSetValue(setNumber, 'weight', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <View style={styles.repsColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.reps}
              onChangeText={(value) => updateSetValue(setNumber, 'reps', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <TouchableOpacity
            style={[styles.checkButton, completedSets.has(setNumber) && { backgroundColor: COLORS.primary }]}
            onPress={() => handleComplete(setNumber)}
          >
            <Feather
              name={completedSets.has(setNumber) ? "check" : "circle"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={addSet}
        >
          <Text style={styles.addSetButton}>+ Add Set</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={removeLastSet}
        >
          <Text style={styles.removeSetButton}>Remove Set</Text>
        </TouchableOpacity>
      </View>

      {logStatus === 'success' && (
        <Text style={{ color: '#00FF00', textAlign: 'center', marginTop: 10 }}>
          Exercise saved ✅
        </Text>
      )}

      <TouchableOpacity
        style={styles.logButton}
        onPress={handleLogExercise}
      >
        <Text style={styles.logButtonText}>Log Exercise</Text>
      </TouchableOpacity>

    </View>
  );
};
// Set Tracker Component End


const ExerciseDetail = () => {
  const router = useRouter();
  // Use useLocalSearchParams to access route parameters
  const { id, name, description, image, equipment, exerciseType, majorMuscle, minorMuscle, modifications } = useLocalSearchParams();
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');
  const [isAnimating, setIsAnimating] = useState(false);

  // More Modal + Animation Start
  const fadeAnims = [
    React.useRef(new Animated.Value(0)).current,
    React.useRef(new Animated.Value(0)).current,
    React.useRef(new Animated.Value(0)).current,
    React.useRef(new Animated.Value(0)).current,
    React.useRef(new Animated.Value(0)).current,
  ];
  const scaleAnims = fadeAnims.map(() => React.useRef(new Animated.Value(0.1)).current);

  const animateItems = useCallback((isOpening: boolean) => {
    if (isOpening) {
      // Reset animation values before starting new animation
      fadeAnims.forEach(anim => anim.setValue(0));
      scaleAnims.forEach(anim => anim.setValue(0.1));

      setIsAnimating(true);

      const itemAnimations = fadeAnims.map((fadeAnim, index) => {
        const scaleAnim = scaleAnims[index];
        const delay = index * 50;

        return Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
            delay: delay,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
            delay: delay,
          })
        ]);
      });

      Animated.parallel(itemAnimations).start(() => {
        setIsAnimating(false);
      });
    } else {
      // Reset animation values when closing
      fadeAnims.forEach(anim => anim.setValue(0));
      scaleAnims.forEach(anim => anim.setValue(0.1));
      setIsMoreModalVisible(false);
    }
  }, []);

  React.useEffect(() => {
    if (isMoreModalVisible) {
      animateItems(true);
    }
  }, [isMoreModalVisible]);
  // More Modal + Animation End

  // Ensure the id exists before proceeding
  if (!id) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.titleNo}>Exercise details unavailable</Text>
      </ScrollView>
    );
  }

  // ExerciseId is passed through the URL from the exercises.jsx component
  const exerciseId = id;

  const showToast = (type: string, text1: string, text2?: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  const handleLogExercise = async (sets: number, reps: number, weight: number, setDetails: SetData) => {
    console.log('=== Starting Exercise Log Process ===');
    console.log('Initial data:', { sets, reps, weight });
    console.log('Set details:', setDetails);
    console.log('User:', user?._id);
    console.log('Exercise name:', name);

    if (!user || !name) {
      console.log('Validation failed:', { hasUser: !!user, hasName: !!name });
      Toast.show({
        type: 'error',
        text1: 'Exercise Logging Failed',
        text2: 'User not logged in or Exercise name is invalid',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const logEntry = {
        userId: (user as any)?._id || (user as any)?.userId || '',
        exerciseName: String(name || ''),
        sets: Array.isArray(setDetails) ? setDetails.length : sets,
        reps: Array.isArray(setDetails) ? Math.round(Object.values(setDetails).reduce((sum: number, set: any) => sum + parseInt(String(set?.reps || 0), 10), 0) / Object.keys(setDetails).length) : reps,
        weight: Array.isArray(setDetails) ? parseFloat((Object.values(setDetails).reduce((sum: number, set: any) => sum + parseFloat(String(set?.weight || 0)), 0) / Object.keys(setDetails).length).toFixed(2)) : weight,
        setDetails: setDetails
      };

      console.log('Prepared log entry:', JSON.stringify(logEntry, null, 2));
      console.log('Sending request to server...');

      const response = await api.post('/exercises/', logEntry);
      console.log('Server response:', response.data);
      console.log('Exercise logged successfully!');

      // Success toast
      Toast.show({
        type: 'success',
        text1: 'Exercise Logged Successfully',
        text2: `${name}: ${sets} sets, ${reps} reps, ${weight}kg`,
        position: 'bottom',
        visibilityTime: 3000,
      });

    } catch (error: any) {
      console.error('Error logging exercise:', error);
      Alert.alert('Error', error.message || 'Failed to log exercise. Please try again.');
    }
    console.log('=== End Exercise Log Process ===\n');
  };


  return (
    <BackgroundGradient>
      <BlobBackground variant="scale" />
      <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, top: -10 }} edges={['top', 'right', 'left']}>
        {/* Header Start */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BlurView intensity={20} tint="light" style={styles.blurContainer}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name || 'Exercise Details'}</Text>
        </View>
        {/* Header End */}

        {/* Tabs Component Start */}
        <View style={styles.tabsContainer}>
          {['Details', 'Tutorial', 'Workouts'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && { color: '#000', fontWeight: '600' }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Tabs Component End */}

        {/* Main Component (Scrollable Content) Start */}
        <ScrollView style={styles.scrollContent}>
          {activeTab === 'Details' && (
            <>
              {image && typeof image === 'string' && (
                <Image source={{ uri: image }} style={styles.exercisePreview} />
              )}
              <Text style={styles.description}>{description || 'No description available.'}</Text>

              {/* Exercise Details Start */}
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>
                  <Ionicons name="information-circle-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  {name || 'Exercise Details'}
                </Text>
                <Text style={styles.detailText}>Equipment: {equipment || 'Not specified'}</Text>
                <Text style={styles.detailText}>Exercise Type: {exerciseType || 'Not specified'}</Text>
                <Text style={styles.detailText}>Major Muscle: {majorMuscle || 'Not specified'}</Text>
                <Text style={styles.detailText}>Minor Muscle: {minorMuscle || 'Not specified'}</Text>
                <Text style={styles.detailText}>Modifications to Help: {modifications || 'Not specified'}</Text>
              </View>
              {/* Exercise Details End */}

              {/* Set Tracker Component Start */}
              <View style={styles.setTrackerWrapper}>
                <Text style={styles.sectionTitle}>Track Your Sets</Text>
                <SetTracker onLogExercise={handleLogExercise} />
              </View>
              {/* Set Tracker Component End */}
            </>
          )}

          {activeTab === 'Tutorial' && (
            <View style={styles.emptyTabContainer}>
              {/* TODO: Add Tutorial Content
              Suggested content:
              - Video player component
              - Step-by-step instructions
              - Form tips
              - Common mistakes to avoid
            */}
              <Text style={styles.emptyTabText}>Tutorial content coming soon</Text>
            </View>
          )}

          {activeTab === 'Workouts' && (
            <View style={styles.emptyTabContainer}>
              {/* TODO: Add Workouts Content
              Suggested content:
              - List of workouts featuring this exercise
              - Recommended workout combinations
              - Training programs
              - User-created workouts
            */}
              <Text style={styles.emptyTabText}>Workouts content coming soon</Text>
            </View>
          )}
        </ScrollView>
        {/* Main Component (Scrollable Content) End */}


        {/* Custom Tab Bar Start */}
        <CustomTabBar setIsMoreModalVisible={setIsMoreModalVisible} />
        {/* Custom Tab Bar End */}


        {/* More Modal Start */}
        <Modal
          visible={isMoreModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => {
            animateItems(false);
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              animateItems(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalGrid}>
                <LinearGradient
                  colors={['#003300', '#000000']}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 20,
                  }}
                />
                {[
                  { route: '/exercises', icon: require('@/assets/icons/exercises-tab.png'), text: 'Exercises', isActive: true },
                  { route: '/workout', icon: require('@/assets/icons/workout-tab.png'), text: 'Workout' },
                  { route: '/mental', icon: require('@/assets/icons/mental-tab.png'), text: 'Mental' },
                  { route: '/foodScreen', icon: require('@/assets/icons/food-tracker-tab.png'), text: 'Food Tracker' },
                  { route: '/settings', icon: tabIcons.settings, text: 'Settings' }
                ].map((item, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: fadeAnims[index],
                      transform: [{ scale: scaleAnims[index] }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        animateItems(false);
                        setTimeout(() => {
                          router.push(item.route as any);
                        }, 300);
                      }}
                    >
                      <Image
                        source={item.icon}
                        style={[
                          styles.modalIcon,
                          item.isActive && { tintColor: '#fff' }
                        ]}
                        resizeMode="contain"
                      />
                      <Text style={[
                        styles.modalText,
                        item.isActive && { color: '#fff' }
                      ]}>
                        {item.text}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        {/* More Modal End */}

        <Toast />
      </SafeAreaView>
      </View>
    </BackgroundGradient>
  );
};

// Custom Tab Bar Start
const CustomTabBar = ({ setIsMoreModalVisible }: { setIsMoreModalVisible: (visible: boolean) => void }) => {
  const router = useRouter();
  return (
    <View style={styles.tabBar}>
      <LinearGradient
        colors={['#003300', '#000000']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      />
      <TouchableOpacity
        style={styles.tabItem}
        onPress={(e) => {
          e.preventDefault();
          setIsMoreModalVisible(true);
        }}
      >
        <Image
          source={tabIcons.more.default}
          style={{
            width: 22,
            height: 22,
            tintColor: 'rgba(255, 255, 255, 0.6)'
          }}
          resizeMode="contain"
        />
        <Text style={styles.tabLabel}>More</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/exercises' as any)}
      >
        <Image
          source={tabIcons.trainer.default}
          style={{
            width: 22,
            height: 22,
            tintColor: 'rgba(255, 255, 255, 0.6)'
          }}
          resizeMode="contain"
        />
        <Text style={styles.tabLabel}>Trainer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push('/home' as any)}
      >
        <Image
          source={tabIcons.home.default}
          style={{
            width: 22,
            height: 22,
            tintColor: 'rgba(255, 255, 255, 0.6)'
          }}
          resizeMode="contain"
        />
        <Text style={styles.tabLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/stepCount' as any)}
      >
        <Image
          source={tabIcons.steps.default}
          style={{
            width: 22,
            height: 22,
            tintColor: 'rgba(255, 255, 255, 0.6)'
          }}
          resizeMode="contain"
        />
        <Text style={styles.tabLabel}>Steps</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push('/(tabs)/exercises' as any)}
      >
        <Image
          source={tabIcons.profile.default}
          style={{
            width: 22,
            height: 22,
            tintColor: 'rgba(255, 255, 255, 0.6)'
          }}
          resizeMode="contain"
        />
        <Text style={styles.tabLabel}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};
// Custom Tab Bar End


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 26, 0, 1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Blob Blurred Background Start
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 200,
    height: 200,
    left: '10%',
    top: '20%',
  },
  blob2: {
    left: '60%',
    top: '45%',
  },
  blob3: {
    left: '30%',
    top: '70%',
  },
  // Blob Blurred Background End

  // Nav Bar Start
  tabBar: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 70,
    elevation: 0,
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    overflow: 'hidden',
    boxShadow: '0 0 14px rgba(0, 0, 0, 0.75)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 5,
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: 500,
  },
  activeTabLabel: {
    color: '#fff',
  },
  // Nav Bar End

  // More Modal Start
  modalContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    padding: 10,
    marginHorizontal: 10,
  },
  modalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 20,
    height: 70,
    paddingHorizontal: 20,
    overflow: 'hidden',
    boxShadow: '0 0 10px rgba(7, 94, 7, 0.75)',
  },
  modalItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    gap: 4,
  },
  modalIcon: {
    width: 22,
    height: 22,
    tintColor: 'rgba(255, 255, 255, 0.6)',
  },
  modalText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  // More Modal End

  // Header Start
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    position: 'relative',
    backgroundColor: 'rgba(0, 26, 0, 1)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: 0.5,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  blurContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingRight: 10,
    paddingLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Header End

  // Tabs Component Start
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
  },
  // Tabs Component End

  // Exercise Details Start
  titleNo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exercisePreview: {
    width: screenWidth - 40,
    height: (screenWidth) * 0.5625,
    marginTop: 12,
    marginBottom: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    marginHorizontal: 16,
  },
  detailsContainer: {
    marginHorizontal: 16,
  },
  detailsTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  // Exercise Details End

  // Set Tracker Component Start
  setTrackerWrapper: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 10,
    width: '60%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 20,
  },
  logButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  setTrackerContainer: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  columnHeader: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
  },
  setColumn: {
    width: 40,
  },
  restColumn: {
    width: 60,
  },
  kgColumn: {
    width: 60,
  },
  repsColumn: {
    width: 60,
  },
  checkButton: {
    width: 40,
  },
  setText: {
    color: '#fff',
    textAlign: 'center',
  },
  setInput: {
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: '#222',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  addSetButton: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  removeSetButton: {
    color: '#ff4444',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ExerciseDetail;

