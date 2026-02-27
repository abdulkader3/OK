import { StaffCard } from '@/components/staff-card';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { getUsers, updateUserPermissions, User, UserPermissions } from '@/services/usersService';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERMISSIONS_LIST: { key: keyof UserPermissions; label: string; description: string }[] = [
  { key: 'canCreateLedger', label: 'Create Ledger', description: 'Can create new ledgers' },
  { key: 'canEditLedger', label: 'Edit Ledger', description: 'Can edit existing ledgers' },
  { key: 'canDeleteLedger', label: 'Delete Ledger', description: 'Can delete ledgers' },
  { key: 'canRecordPayment', label: 'Record Payment', description: 'Can record payments' },
  { key: 'canViewAllLedgers', label: 'View All Ledgers', description: 'Can view all ledgers (not just own)' },
  { key: 'canManageStaff', label: 'Manage Staff', description: 'Can manage staff and permissions' },
];

export default function StaffScreen() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);
  const [saving, setSaving] = useState(false);

  const canManageStaff = currentUser?.permissions?.canManageStaff ?? false;
  const isOwner = currentUser?.role === 'owner';

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleManagePermissions = (user: User) => {
    if (!canManageStaff && !isOwner) {
      Alert.alert('Permission Required', 'You do not have permission to manage staff.');
      return;
    }
    setSelectedUser(user);
    setTempPermissions({ ...user.permissions });
    setPermissionModalVisible(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !tempPermissions) return;

    setSaving(true);
    try {
      await updateUserPermissions(selectedUser._id, { permissions: tempPermissions });
      await fetchUsers();
      await refreshUser();
      setPermissionModalVisible(false);
      Alert.alert('Success', 'Permissions updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionLabels = (permissions: UserPermissions): string[] => {
    const labels: string[] = [];
    if (permissions.canCreateLedger) labels.push('Create Ledger');
    if (permissions.canEditLedger) labels.push('Edit Ledger');
    if (permissions.canDeleteLedger) labels.push('Delete Ledger');
    if (permissions.canRecordPayment) labels.push('Record Payment');
    if (permissions.canViewAllLedgers) labels.push('View All');
    if (permissions.canManageStaff) labels.push('Manage Staff');
    return labels;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryMuted} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff & Permissions</Text>
          {(canManageStaff || isOwner) ? (
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialIcons name="settings" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Manage Your Team</Text>
            <Text style={styles.introDesc}>
              Control who has access to your store's data and track their daily activities.
            </Text>
          </View>

          {/* Add Staff Button */}
          {(canManageStaff || isOwner) && (
            <TouchableOpacity style={[styles.addButton, Shadow.sm]} activeOpacity={0.7}>
              <View style={styles.addIconContainer}>
                <MaterialIcons name="person-add" size={22} color={Colors.light.primaryMuted} />
              </View>
              <Text style={styles.addButtonText}>Add New Staff Member</Text>
              <MaterialIcons name="chevron-right" size={22} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}

          {/* Active Members */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Members</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{users.filter(u => u.active).length}</Text>
            </View>
          </View>

          {users.filter(u => u.active).map((user) => (
            <TouchableOpacity
              key={user._id}
              onPress={() => handleManagePermissions(user)}
              activeOpacity={canManageStaff || isOwner ? 0.7 : 1}
            >
              <StaffCard
                name={user.name}
                email={user.email}
                role={user.role.charAt(0).toUpperCase() + user.role.slice(1) as 'Owner' | 'Admin' | 'Staff'}
                permissions={getPermissionLabels(user.permissions)}
              />
            </TouchableOpacity>
          ))}

          {/* Inactive/Pending Members */}
          {users.filter(u => !u.active).length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Inactive / Pending</Text>
              </View>
              {users.filter(u => !u.active).map((user) => (
                <StaffCard
                  key={user._id}
                  name={user.name}
                  email={user.email}
                  role={user.role.charAt(0).toUpperCase() + user.role.slice(1) as 'Owner' | 'Admin' | 'Staff'}
                  permissions={getPermissionLabels(user.permissions)}
                  isPending
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Permissions Modal */}
        <Modal
          visible={permissionModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPermissionModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPermissionModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle}>
                <View style={styles.modalHandleBar} />
              </View>

              <Text style={styles.modalTitle}>
                Manage Permissions - {selectedUser?.name}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedUser?.role ? selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1) : ''}
              </Text>

              <ScrollView style={styles.permissionsList}>
                {PERMISSIONS_LIST.map((perm) => (
                  <View key={perm.key} style={styles.permissionRow}>
                    <View style={styles.permissionInfo}>
                      <Text style={styles.permissionLabel}>{perm.label}</Text>
                      <Text style={styles.permissionDesc}>{perm.description}</Text>
                    </View>
                    <Switch
                      value={tempPermissions?.[perm.key] ?? false}
                      onValueChange={(value) => {
                        setTempPermissions((prev) => prev ? { ...prev, [perm.key]: value } : null);
                      }}
                      trackColor={{ false: Colors.light.border, true: Colors.light.primary + '60' }}
                      thumbColor={tempPermissions?.[perm.key] ? Colors.light.primary : Colors.light.surface}
                      disabled={selectedUser?.role === 'owner' || saving}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPermissionModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSavePermissions}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '80%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textMuted,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionsList: {
    paddingHorizontal: Spacing.xl,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  permissionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  permissionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  permissionDesc: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.textInverse,
  },
});
