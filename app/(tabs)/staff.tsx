import { StaffCard } from '@/components/staff-card';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaffScreen() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.7}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Staff & Permissions</Text>
                    <TouchableOpacity activeOpacity={0.7}>
                        <MaterialIcons name="settings" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Intro */}
                    <View style={styles.intro}>
                        <Text style={styles.introTitle}>Manage Your Team</Text>
                        <Text style={styles.introDesc}>
                            Control who has access to your store's data and track their daily activities.
                        </Text>
                    </View>

                    {/* Add Staff Button */}
                    <TouchableOpacity style={[styles.addButton, Shadow.sm]} activeOpacity={0.7}>
                        <View style={styles.addIconContainer}>
                            <MaterialIcons name="person-add" size={22} color={Colors.light.primaryMuted} />
                        </View>
                        <Text style={styles.addButtonText}>Add New Staff Member</Text>
                        <MaterialIcons name="chevron-right" size={22} color={Colors.light.textMuted} />
                    </TouchableOpacity>

                    {/* Active Members */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Members</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>3</Text>
                        </View>
                    </View>

                    <StaffCard
                        name="Alex Morgan"
                        email="alex.morgan@store.com"
                        role="Owner"
                        permissions={['Full Access', 'Billing', 'API Keys']}
                    />
                    <StaffCard
                        name="Sarah Chen"
                        email="sarah.c@store.com"
                        role="Admin"
                        permissions={['Manage Staff', 'View Reports', 'Edit Products']}
                    />
                    <StaffCard
                        name="John Doe"
                        email="john.d@store.com"
                        role="Staff"
                        permissions={['View Orders', 'Process Refunds']}
                    />

                    {/* Pending Invites */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pending Invites</Text>
                    </View>

                    <StaffCard
                        name="Lisa Park"
                        email="lisa.p@store.com"
                        role="Staff"
                        permissions={['View Orders']}
                        isPending={true}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.backgroundAlt,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundAlt,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 100,
    },
    intro: {
        marginBottom: Spacing.xl,
        gap: Spacing.xs,
    },
    introTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    introDesc: {
        fontSize: FontSize.md,
        color: Colors.light.textSecondary,
        lineHeight: 22,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
        gap: Spacing.md,
    },
    addIconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.light.primaryMuted + '18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.light.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    countBadge: {
        backgroundColor: Colors.light.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.light.textInverse,
    },
});
