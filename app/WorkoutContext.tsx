import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import api from '../api/axios';
import {
  addCompletedExerciseName,
  loadCompletedExerciseNames,
} from '../lib/completedExercises';
import { getUserStorageId } from '../lib/stepStorageKeys';
import { useAuthContext } from './AuthProvider';

interface WorkoutExercise {
  id: string;
  name: string;
  gifUrl: string;
  sets?: number;
  bodyPart?: string;
  equipment?: string;
  target?: string;
}

interface WorkoutContextType {
  completed: string[];
  setCompleted: React.Dispatch<React.SetStateAction<string[]>>;
  markExerciseCompleted: (exerciseName: string) => Promise<void>;
  workout: number;
  setWorkout: React.Dispatch<React.SetStateAction<number>>;
  calories: number;
  setCalories: React.Dispatch<React.SetStateAction<number>>;
  minutes: number;
  setMinutes: React.Dispatch<React.SetStateAction<number>>;
}

const WorkoutItems = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutContext = ({ children }: { children: ReactNode }) => {
  const authContext = useAuthContext();
  const user = authContext?.user || null;
  const [completed, setCompleted] = useState<string[]>([]);
  const [workout, setWorkout] = useState(0);
  const [calories, setCalories] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const userId = getUserStorageId(user);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const hydrateCompleted = async () => {
      if (!userId) {
        setCompleted([]);
        return;
      }

      const names = await loadCompletedExerciseNames(user);
      if (!cancelled && userIdRef.current === userId) {
        setCompleted(names);
      }
    };

    void hydrateCompleted();
    return () => {
      cancelled = true;
    };
  }, [userId, user]);

  const markExerciseCompleted = useCallback(
    async (exerciseName: string) => {
      const trimmed = exerciseName.trim();
      if (!trimmed) return;

      if (!userIdRef.current) {
        setCompleted((prev) =>
          prev.some(
            (n) => n.trim().toLowerCase() === trimmed.toLowerCase(),
          )
            ? prev
            : [...prev, trimmed],
        );
        return;
      }

      const next = await addCompletedExerciseName(user, trimmed);
      if (userIdRef.current) {
        setCompleted(next);
      }
    },
    [user],
  );

  useEffect(() => {
    const loadStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/user-stats');
        const stats =
          (response as { data?: Record<string, number> } | null)?.data ??
          (response as Record<string, number> | null);
        if (stats && typeof stats === 'object') {
          setWorkout(stats.totalWorkouts || 0);
          setCalories(stats.totalCalories || 0);
          setMinutes(stats.totalMinutes || 0);
        }
      } catch (error: any) {
        console.error('Error loading user stats:', error);
        // If table doesn't exist or error, start with zeros
        setWorkout(0);
        setCalories(0);
        setMinutes(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return (
    <WorkoutItems.Provider
      value={{
        completed,
        setCompleted,
        markExerciseCompleted,
        workout,
        setWorkout,
        calories,
        setCalories,
        minutes,
        setMinutes,
      }}
    >
      {children}
    </WorkoutItems.Provider>
  );
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutItems);
  if (!context) {
    throw new Error('useWorkoutContext must be used within WorkoutContext');
  }
  return context;
};

