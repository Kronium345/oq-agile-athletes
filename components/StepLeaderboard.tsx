import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradient from './BackgroundGradient';
import BlobBackground from './BlobBackground';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

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
        <BackgroundGradient>
            <BlobBackground variant="scale" />
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                {/* Fixed Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                            <Ionicons name="chevron-back" size={18} color={COLORS.textButton} />
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
            </SafeAreaView>
        </BackgroundGradient>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    // Header Component Start
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        paddingTop: SPACING.xl,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: SPACING.lg,
        zIndex: 1,
    },
    blurContainer: {
        borderRadius: BORDER_RADIUS.medium,
        overflow: 'hidden',
        paddingVertical: SPACING.sm,
        paddingRight: SPACING.md,
        paddingLeft: SPACING.sm,
        backgroundColor: COLORS.backgroundCard,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.large,
        fontWeight: TYPOGRAPHY.fontWeight.semiBold,
        letterSpacing: 0.5,
        color: COLORS.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    fixedContent: {
        paddingHorizontal: SPACING.lg,
    },
    // Header Component End

    // Tab Component Start
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: BORDER_RADIUS.large,
        padding: SPACING.xs,
        marginBottom: SPACING.lg,
        ...SHADOWS.card,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.large,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.regular,
        fontWeight: TYPOGRAPHY.fontWeight.regular,
    },
    activeTabText: {
        color: COLORS.textButton,
        fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    },
    // Tab Component End

    // Main Component Start
    leaderboardContainer: {
        flex: 1,
    },
    friendRowContainer: {
        borderRadius: BORDER_RADIUS.medium,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        backgroundColor: COLORS.backgroundCard,
        ...SHADOWS.card,
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: BORDER_RADIUS.medium,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendRank: {
        color: COLORS.textPrimary,
        width: 30,
        fontSize: TYPOGRAPHY.fontSize.medium,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    friendAvatar: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.circle,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarText: {
        color: COLORS.textPrimary,
        fontSize: TYPOGRAPHY.fontSize.medium,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    friendName: {
        color: COLORS.textPrimary,
        fontSize: TYPOGRAPHY.fontSize.medium,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    valueText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.regular,
    },
    // Main Component End
});

export default StepLeaderboard;

