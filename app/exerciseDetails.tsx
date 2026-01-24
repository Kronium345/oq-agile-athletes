import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import BackgroundGradient from '../components/BackgroundGradient';
import BlobBackground from '../components/BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuthContext } from './AuthProvider';



// BlobBackground is now imported from components


const { width: screenWidth } = Dimensions.get('window');


// Set Tracker Component Start
interface SetData {
  [key: number]: { rest: string; weight: string; reps: string };
}

interface SetTrackerProps {
  onLogExercise: (sets: number, reps: number, weight: number, setDetails: SetData) => Promise<void>;
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

  const handleLogExercise = async () => {
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

    try {
      // Call the parent logging function and wait for it to complete
      await onLogExercise(totalSets, avgReps, avgWeight, setData);
      
      // Only show success message if the API call succeeded
      setLogStatus('success');
      setTimeout(() => setLogStatus('idle'), 3000);
      
      console.log('=== Set Tracker Log Process Completed Successfully ===\n');
    } catch (error) {
      console.log('=== Set Tracker Log Process Failed ===', error);
      // Don't show success status if there was an error
      setLogStatus('idle');
    }
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
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.restColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.rest}
              onChangeText={(value) => updateSetValue(setNumber, 'rest', value)}
              keyboardType="default"
              placeholder="0s"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.kgColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.weight}
              onChangeText={(value) => updateSetValue(setNumber, 'weight', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <View style={styles.repsColumn}>
            <TextInput
              style={styles.setInput}
              value={setData[setNumber]?.reps}
              onChangeText={(value) => updateSetValue(setNumber, 'reps', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={[styles.checkButton, completedSets.has(setNumber) && { backgroundColor: COLORS.primary }]}
            onPress={() => handleComplete(setNumber)}
          >
            <Feather
              name={completedSets.has(setNumber) ? "check" : "circle"}
              size={20}
              color={completedSets.has(setNumber) ? COLORS.textButton : COLORS.textSecondary}
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
  
  console.log('=== EXERCISE DETAIL COMPONENT DEBUG ===');
  console.log('Component rendered');
  
  const authContext = useAuthContext() as any;
  const user = authContext?.user || null;
  const [activeTab, setActiveTab] = useState('Details');
  
  console.log('Auth context:', authContext);
  console.log('User from context:', user);
  console.log('User type:', typeof user);
  
  // Add effect to check AsyncStorage directly
  React.useEffect(() => {
    const checkAsyncStorage = async () => {
      console.log('=== CHECKING ASYNC STORAGE ===');
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('session'); // Check session token too
        const storedTokenOld = await AsyncStorage.getItem('token'); // Check old token key
        
        console.log('Stored user (raw):', storedUser);
        console.log('Stored session token:', storedToken);
        console.log('Stored token (old key):', storedTokenOld);
        
        if (storedUser) {
          console.log('Parsed stored user:', JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking AsyncStorage:', error);
      }
    };
    
    checkAsyncStorage();
  }, []);

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
    // Suppress CSS-related errors on web during logging
    const originalConsoleError = console.error;
    if (Platform.OS === 'web') {
      console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && (
          message.includes('CSSStyleDeclaration') || 
          message.includes('indexed property') || 
          message.includes('property setter is not supported') ||
          message.includes('Failed to set an indexed property')
        )) {
          return; // Suppress CSS errors
        }
        originalConsoleError(...args);
      };
    }

    console.log('=== Starting Exercise Log Process ===');
    console.log('Initial data:', { sets, reps, weight });
    console.log('Set details:', setDetails);
    console.log('==== USER DEBUG INFO ====');
    console.log('User object:', user);
    console.log('User type:', typeof user);
    console.log('User keys:', user ? Object.keys(user) : 'no user');
    console.log('User._id:', user?._id);
    console.log('User.userId:', (user as any)?.userId);
    console.log('User.email:', user?.email);
    console.log('==== EXERCISE DEBUG INFO ====');
    console.log('Exercise name:', name);
    console.log('Name type:', typeof name);
    console.log('Name length:', name ? name.length : 'no name');

    if (!user || !name) {
      console.log('=== VALIDATION FAILED ===');
      console.log('Has user:', !!user);
      console.log('Has name:', !!name);
      console.log('User truthiness:', Boolean(user));
      console.log('Name truthiness:', Boolean(name));
      
      Toast.show({
        type: 'error',
        text1: 'Exercise Logging Failed',
        text2: !user ? 'User not logged in' : 'Exercise name is missing',
      });
      throw new Error(!user ? 'User not logged in' : 'Exercise name is missing');
    }

    try {
      const logEntry = {
        userId: (user as any)?._id || (user as any)?.userId || '', 
        exerciseName: String(name || ''),
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
        setDetails: setDetails,
        duration: 30, // Default duration in minutes
        caloriesBurned: Math.round(weight * reps * sets * 0.5), // Rough calorie calculation
      };

      console.log('Prepared log entry:', JSON.stringify(logEntry, null, 2));
      console.log('Sending request to server...');

      // Use template endpoint: POST /history/history
      const response = await api.post('/history/history', logEntry);
      console.log('Server response:', response.data);
      console.log('Exercise logged successfully!');

      // Success toast
      Toast.show({
        type: 'success',
        text1: 'Exercise Logged Successfully',
        text2: `${name}: ${sets} sets, ${reps} reps, ${weight}kg`,
      });

    } catch (error: any) {
      console.error('Error logging exercise:', error);
      
      // Show proper error toast instead of Alert
      Toast.show({
        type: 'error',
        text1: 'Exercise Logging Failed',
        text2: error.response?.data?.message || error.message || 'Failed to log exercise. Please try again.',
      });
      
      // Re-throw the error so SetTracker knows it failed
      throw error;
    } finally {
      // Restore original console.error
      if (Platform.OS === 'web') {
        setTimeout(() => {
          console.error = originalConsoleError;
        }, 1000);
      }
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
              <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
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
                activeTab === tab && { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.semiBold }
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
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
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

        <Toast />
      </SafeAreaView>
      </View>
    </BackgroundGradient>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
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


  // Header Start
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    position: 'relative',
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.sm,
    backgroundColor: COLORS.backgroundOverlay,
  },
  // Header End

  // Tabs Component Start
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xs,
    marginHorizontal: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.large,
  },
  activeTab: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.regular,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxxl,
  },
  emptyTabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.medium,
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: BORDER_RADIUS.large,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    marginHorizontal: SPACING.lg,
  },
  detailsContainer: {
    marginHorizontal: SPACING.lg,
  },
  detailsTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  // Exercise Details End

  // Set Tracker Component Start
  setTrackerWrapper: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.card,
    borderRadius: BORDER_RADIUS.large,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.large,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    width: '60%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: SPACING.xl,
  },
  logButtonText: {
    color: COLORS.textButton,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
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
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    width: 40,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: BORDER_RADIUS.medium,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  setInput: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.medium,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    opacity: 0.2,
  },
  addSetButton: {
    color: COLORS.textButton,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
  removeSetButton: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.medium,
  },
});

export default ExerciseDetail;

