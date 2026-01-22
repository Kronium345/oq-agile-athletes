import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Sentry from '@sentry/react-native';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export const useGoogleSignIn = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const configureGoogleSignIn = () => {
        try {
            const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
            const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

            if (!webClientId || !iosClientId) {
                console.warn('Google Sign-In: Please set your Client IDs in environment variables');
            }

            GoogleSignin.configure({
                webClientId: webClientId,
                iosClientId: iosClientId,
                offlineAccess: false,
                hostedDomain: '',
                forceCodeForRefreshToken: true,
            });
            setIsConfigured(true);
        } catch (error) {
            console.error('Google Sign-In configuration error:', error);
            Sentry.captureException(error);
        }
    };

    const signIn = async () => {
        if (!isConfigured) {
            throw new Error('Google Sign-In not configured');
        }

        setIsSigningIn(true);
        try {
            // Check if device has Google Play Services (Android)
            await GoogleSignin.hasPlayServices();

            // Perform the sign-in
            const userInfo = await GoogleSignin.signIn();

            // Debug: Check what we received from Google
            console.log('Google Sign-In userInfo:', JSON.stringify(userInfo, null, 2));
            console.log('idToken:', userInfo.data.idToken);

            if (!userInfo.data.idToken) {
                throw new Error('No idToken received from Google');
            }

            // Send idToken to your backend
            const response = await api.post('/auth/google', {
                token: userInfo.data.idToken
            });

            // Store user data and token
            await AsyncStorage.setItem('user', JSON.stringify(response.data.result));
            await AsyncStorage.setItem('token', response.data.token);

            return {
                success: true,
                user: response.data.result,
                token: response.data.token,
                isNewUser: response.data.result.isNewUser
            };

        } catch (error) {
            console.error('Google Sign-In error:', error);
            Sentry.captureException(error);

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                throw new Error('Sign-in was cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                throw new Error('Sign-in is already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Google Play Services not available');
            } else {
                throw new Error('Google Sign-In failed');
            }
        } finally {
            setIsSigningIn(false);
        }
    };

    const signOut = async () => {
        try {
            await GoogleSignin.signOut();
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Google Sign-Out error:', error);
            Sentry.captureException(error);
        }
    };

    const isSignedIn = async () => {
        try {
            return await GoogleSignin.isSignedIn();
        } catch (error) {
            return false;
        }
    };

    return {
        signIn,
        signOut,
        isSignedIn,
        isSigningIn,
        isConfigured
    };
}; 