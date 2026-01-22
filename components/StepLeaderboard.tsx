import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

// Blob Blurred Background Start
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const BlobBackground = () => {
    const blob1Animation = useSharedValue(0);
    const blob2Animation = useSharedValue(0);
    const blob3Animation = useSharedValue(0);

    useEffect(() => {
        const animate = (value: any, duration: number) => {
            'worklet';
            value.value = withRepeat(
                withTiming(1, { duration }),
                -1,
                true
            );
        };

        animate(blob1Animation, 8000);
        animate(blob2Animation, 12000);
        animate(blob3Animation, 10000);
    }, []);

    const createBlobStyle = (animation: any) => {
        'worklet';
        return useAnimatedStyle(() => ({
            transform: [
                { translateX: animation.value * 40 - 20 },
                { translateY: animation.value * 40 - 20 }
            ]
        }));
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={styles.backgroundContainer}>
                <AnimatedSvg style={[styles.blob, createBlobStyle(blob1Animation)]}>
                    <Circle r={100} cx={100} cy={100} fill={COLORS.primaryOverlay} />
                </AnimatedSvg>
                <AnimatedSvg style={[styles.blob, styles.blob2, createBlobStyle(blob2Animation)]}>
                    <Circle r={110} cx={110} cy={110} fill={COLORS.primaryLight} />
                </AnimatedSvg>
                <AnimatedSvg style={[styles.blob, styles.blob3, createBlobStyle(blob3Animation)]}>
                    <Circle r={90} cx={90} cy={90} fill="rgba(0, 0, 0, 0.4)" />
                </AnimatedSvg>
            </View>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
    );
};
// Blob Blurred Background End


const StepLeaderboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Streaks');

    // Sample data for different tabs
    const leaderboardData = {
        streaks: [
            { id: 1, name: 'Name', value: 5, avatar: 'R' },
            { id: 2, name: 'Name', value: 4, avatar: 'K' },
            { id: 3, name: 'Name', value: 0, avatar: 'J' },
            { id: 4, name: 'Name', value: 0, avatar: 'A' },
            { id: 5, name: 'Name', value: 0, avatar: 'S' },
            { id: 6, name: 'Name', value: 0, avatar: 'T' },
            { id: 7, name: 'Name', value: 0, avatar: 'A' },
            { id: 8, name: 'Name', value: 0, avatar: 'K' },
            { id: 9, name: 'Name', value: 0, avatar: 'J' },
            { id: 10, name: 'Name', value: 0, avatar: 'T' },
            { id: 11, name: 'Name', value: 0, avatar: 'A' },
            { id: 12, name: 'Name', value: 0, avatar: 'K' },
        ],

        stepsToday: [
            { id: 1, name: 'Name', value: 9235, avatar: 'K' },
            { id: 2, name: 'Name', value: 8150, avatar: 'J' },
            { id: 3, name: 'Name', value: 7430, avatar: 'R' },
            { id: 4, name: 'Name', value: 9235, avatar: 'K' },
            { id: 5, name: 'Name', value: 8150, avatar: 'J' },
            { id: 6, name: 'Name', value: 7430, avatar: 'R' },
            { id: 7, name: 'Name', value: 9235, avatar: 'K' },
            { id: 8, name: 'Name', value: 8150, avatar: 'J' },
            { id: 9, name: 'Name', value: 7430, avatar: 'R' },
            { id: 10, name: 'Name', value: 9235, avatar: 'K' },
            { id: 11, name: 'Name', value: 8150, avatar: 'J' },
            { id: 12, name: 'Name', value: 7430, avatar: 'R' },
        ],

        stepsWeek: [
            { id: 1, name: 'Name', value: 45235, avatar: 'K' },
            { id: 2, name: 'Name', value: 32150, avatar: 'J' },
            { id: 3, name: 'Name', value: 28430, avatar: 'R' },
            { id: 4, name: 'Name', value: 45235, avatar: 'K' },
            { id: 5, name: 'Name', value: 32150, avatar: 'J' },
            { id: 6, name: 'Name', value: 28430, avatar: 'R' },
            { id: 7, name: 'Name', value: 45235, avatar: 'K' },
            { id: 8, name: 'Name', value: 32150, avatar: 'J' },
            { id: 9, name: 'Name', value: 28430, avatar: 'R' },
            { id: 10, name: 'Name', value: 45235, avatar: 'K' },
            { id: 11, name: 'Name', value: 32150, avatar: 'J' },
            { id: 12, name: 'Name', value: 28430, avatar: 'R' },
        ],
    };

    const renderFriendRow = (friend: any, index: number) => {
        const value = activeTab === 'Streaks'
            ? `${friend.value} streaks`
            : `${friend.value.toLocaleString()} steps`;

        return (
            <BlurView
                intensity={20}
                tint="dark"
                style={styles.friendRowContainer}
            >
                <View key={friend.id} style={styles.friendRow}>
                    <View style={styles.friendInfo}>
                        <Text style={styles.friendRank}>{index + 1}</Text>
                        <View style={styles.friendAvatar}>
                            <Text style={styles.avatarText}>{friend.avatar}</Text>
                        </View>
                        <Text style={styles.friendName}>{friend.name}</Text>
                    </View>
                    <Text style={styles.valueText}>{value}</Text>
                </View>
            </BlurView>
        );
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 'Streaks':
                return leaderboardData.streaks;
            case 'Steps today':
                return leaderboardData.stepsToday;
            case 'Steps this week':
                return leaderboardData.stepsWeek;
            default:
                return leaderboardData.streaks;
        }
    };

    return (
        <View style={styles.container}>
            <BlobBackground />
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                        <Ionicons name="chevron-back" size={18} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leaderboard</Text>
            </View>

            <View style={styles.content}>
                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['Streaks', 'Steps today', 'Steps this week'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Leaderboard List */}
                <ScrollView
                    style={styles.leaderboardContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {getCurrentData().map((friend, index) => renderFriendRow(friend, index))}
                </ScrollView>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 26, 0, 1)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
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

    // Header Component Start
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 20,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    blurContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        paddingVertical: 8,
        paddingRight: 10,
        paddingLeft: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 0.5,
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    fixedContent: {
        paddingHorizontal: 20,
    },
    // Header Component End

    // Tab Component Start
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
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
    activeTabText: {
        color: '#000',
        fontWeight: '600',
    },
    // Tab Component End

    // Main Component Start
    leaderboardContainer: {
        flex: 1,
    },
    friendRowContainer: {
        borderRadius: 15,
        marginBottom: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendRank: {
        color: '#fff',
        width: 30,
        fontSize: 16,
        fontWeight: '500',
    },
    friendAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    friendName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    valueText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    // Main Component End
});

export default StepLeaderboard;

