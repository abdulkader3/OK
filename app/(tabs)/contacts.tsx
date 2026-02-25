import { TransactionItem } from '@/components/transaction-item';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactProfileScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.7}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Contact Profile</Text>
                    <TouchableOpacity activeOpacity={0.7}>
                        <MaterialIcons name="more-vert" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Profile Card */}
                    <View style={[styles.profileCard, Shadow.sm]}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>JD</Text>
                        </View>
                        <Text style={styles.profileName}>John Doe</Text>
                        <View style={styles.profileMeta}>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="phone" size={14} color={Colors.light.textSecondary} />
                                <Text style={styles.metaText}>+1 234 567 890</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="badge" size={14} color={Colors.light.textSecondary} />
                                <Text style={styles.metaText}>ID: CNT-00451</Text>
                            </View>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity style={styles.contactActionBtn} activeOpacity={0.7}>
                                <MaterialIcons name="phone" size={18} color={Colors.light.primary} />
                                <Text style={styles.contactActionText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.contactActionBtn} activeOpacity={0.7}>
                                <MaterialIcons name="message" size={18} color={Colors.light.primary} />
                                <Text style={styles.contactActionText}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Balance Card */}
                    <View style={[styles.balanceCard, Shadow.md]}>
                        <Text style={styles.balanceLabel}>NET BALANCE</Text>
                        <Text style={styles.balanceAmount}>$150.00</Text>
                        <TouchableOpacity style={styles.settleUpBtn} activeOpacity={0.7}>
                            <Text style={styles.settleUpText}>Settle Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Attachments */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Attachments</Text>
                        <TouchableOpacity activeOpacity={0.7}>
                            <MaterialIcons name="add" size={22} color={Colors.light.primaryMuted} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.attachmentsRow}
                    >
                        {['Receipt.pdf', 'Contract.doc', 'Invoice.pdf'].map((file, i) => (
                            <TouchableOpacity key={i} style={[styles.attachmentCard, Shadow.sm]} activeOpacity={0.7}>
                                <MaterialIcons
                                    name={file.includes('.pdf') ? 'picture-as-pdf' : 'description'}
                                    size={28}
                                    color={Colors.light.primaryMuted}
                                />
                                <Text style={styles.attachmentName} numberOfLines={1}>{file}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* History */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>History</Text>
                        <View style={styles.historyBadge}>
                            <Text style={styles.historyBadgeText}>3</Text>
                        </View>
                    </View>

                    <TransactionItem
                        name="Loan"
                        description="Loan to John"
                        time="Oct 24 • 2:30 PM"
                        amount="$50.00"
                        isPositive={false}
                        avatarColor={Colors.light.accentOrange}
                    />
                    <TransactionItem
                        name="Payment"
                        description="Payment Received"
                        time="Oct 20 • 9:15 AM"
                        amount="$200.00"
                        isPositive={true}
                        avatarColor={Colors.light.accent}
                    />
                    <TransactionItem
                        name="Groceries"
                        description="Groceries"
                        time="Oct 18 • 5:45 PM"
                        amount="$120.50"
                        isPositive={false}
                        avatarColor={Colors.light.accentRed}
                    />
                </ScrollView>

                {/* Bottom Action Buttons */}
                <View style={[styles.bottomActions, Shadow.lg]}>
                    <TouchableOpacity
                        style={styles.bottomBtnPrimary}
                        onPress={() => router.push('/modal')}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="payment" size={20} color={Colors.light.textInverse} />
                        <Text style={styles.bottomBtnPrimaryText}>Record Payment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomBtnSecondary} activeOpacity={0.7}>
                        <MaterialIcons name="add-circle-outline" size={20} color={Colors.light.primary} />
                        <Text style={styles.bottomBtnSecondaryText}>New Entry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
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
    profileCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    profileAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.light.primaryMuted + '25',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    profileAvatarText: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.light.primaryMuted,
    },
    profileName: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    profileMeta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginTop: 2,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
    },
    contactActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    contactActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    contactActionText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.light.primary,
    },
    balanceCard: {
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    balanceLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.light.textInverse + 'AA',
        letterSpacing: 1.5,
    },
    balanceAmount: {
        fontSize: FontSize.hero,
        fontWeight: FontWeight.heavy,
        color: Colors.light.textInverse,
    },
    settleUpBtn: {
        backgroundColor: Colors.light.accent,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.sm,
    },
    settleUpText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.light.textInverse,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    attachmentsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    attachmentCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.sm,
        width: 100,
    },
    attachmentName: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    historyBadge: {
        backgroundColor: Colors.light.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.light.textInverse,
    },
    bottomActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
        backgroundColor: Colors.light.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
    },
    bottomBtnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.lg,
    },
    bottomBtnPrimaryText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.light.textInverse,
    },
    bottomBtnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    bottomBtnSecondaryText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        color: Colors.light.primary,
    },
});
