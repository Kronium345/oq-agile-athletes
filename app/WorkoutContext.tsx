import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
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

