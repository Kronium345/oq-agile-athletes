import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

const useInitialNavigation = () => {
    const router = useRouter();

    useEffect(() => {
        const handleInitialNavigation = async () => {
            try {
                const user = await AsyncStorage.getItem('user');
                const lastPage = await AsyncStorage.getItem('lastPage');

                if (user) {
                    const parsedUser = JSON.parse(user);

                    // If user has no weight set, always go to weight input
                    if (!parsedUser.weight) {
                        router.replace('/weightInput');
                        return;
                    }

                    // If there's a last page and it's not weightInput, go there
                    if (lastPage && lastPage !== '/weightInput') {
                        router.replace(lastPage);
                    } else {
                        // Default to home if no last page
                        router.replace('/(drawer)/(tabs)/home');
                    }
                } else {
                    // No user, go to login
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Navigation error:', error);
                router.replace('/login');
            }
        };

        handleInitialNavigation();
    }, []);
};

export default useInitialNavigation; 