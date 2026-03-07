import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.notes': 'Notes',
    'common.tags': 'Tags',
    'common.amount': 'Amount',
    'common.date': 'Date',
    'common.type': 'Type',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.all': 'All',
    'common.noResults': 'No results found',
    'common.add': 'Add',
    
    // Dashboard
    'dashboard.welcomeBack': 'WELCOME BACK',
    'dashboard.owedToMe': 'Owed to Me',
    'dashboard.iOwe': 'I Owe',
    'dashboard.overdue': 'Overdue',
    'dashboard.highPriority': 'High Priority',
    'dashboard.bigBossManagement': 'Big Boss Management',
    'dashboard.staffManagement': 'Staff Management',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.viewAll': 'View All',
    'dashboard.noRecentActivity': 'No recent activity',
    'dashboard.filters.allActivity': 'All Activity',
    'dashboard.filters.dueSoon': 'Due Soon',
    'dashboard.filters.highAmount': 'High Amount',
    'dashboard.synced': 'Synced',
    'dashboard.pendingOperations': 'pending operation(s)',
    
    // Big Boss
    'bigboss.title': 'Big Boss Management',
    'bigboss.addBigBoss': 'Add Big Boss',
    'bigboss.createBigBoss': 'Create Big Boss',
    'bigboss.editBigBoss': 'Edit Big Boss',
    'bigboss.bigBossName': 'Big Boss Name',
    'bigboss.description': 'Description',
    'bigboss.optional': '(Optional)',
    'bigboss.totalPaid': 'Total Paid',
    'bigboss.noBigBosses': 'No Big Bosses yet',
    'bigboss.addFirstBigBoss': 'Add your first Big Boss to get started',
    'bigboss.bills': 'Bills',
    'bigboss.noBills': 'No bills yet',
    'bigboss.addBill': 'Add Bill',
    'bigboss.createBill': 'Create Bill',
    'bigboss.month': 'Month',
    'bigboss.year': 'Year',
    'bigboss.amount': 'Amount',
    'bigboss.attachment': 'Attachment',
    'bigboss.addAttachment': 'Add Attachment',
    'bigboss.removeAttachment': 'Remove Attachment',
    'bigboss.january': 'January',
    'bigboss.february': 'February',
    'bigboss.march': 'March',
    'bigboss.april': 'April',
    'bigboss.may': 'May',
    'bigboss.june': 'June',
    'bigboss.july': 'July',
    'bigboss.august': 'August',
    'bigboss.september': 'September',
    'bigboss.october': 'October',
    'bigboss.november': 'November',
    'bigboss.december': 'December',
    
    // Contacts
    'contacts.title': 'Contacts',
    'contacts.addContact': 'Add Contact',
    'contacts.searchPlaceholder': 'Search contacts...',
    'contacts.noContactsYet': 'No contacts yet',
    'contacts.noContactsMatchSearch': 'No contacts match your search',
    'contacts.addFirstContact': 'Add your first contact to get started',
    'contacts.contactProfile': 'Contact Profile',
    'contacts.call': 'Call',
    'contacts.message': 'Message',
    'contacts.netBalance': 'NET BALANCE',
    'contacts.owsMe': 'Owes Me',
    'contacts.iOwe': 'I Owe',
    'contacts.settleUp': 'Settle Up',
    'contacts.recordPayment': 'Record Payment',
    'contacts.newEntry': 'New Entry',
    'contacts.ledgers': 'Ledgers',
    'contacts.ledger': 'ledger',
    'contacts.ledgers_plural': 'ledgers',
    'contacts.moreTags': '+ more',
    
    // Ledger
    'ledger.title': 'Debt Ledger',
    'ledger.export': 'Export',
    'ledger.searchPlaceholder': 'Search debts...',
    'ledger.recentEntries': 'Recent Entries',
    'ledger.noLedgersFound': 'No ledgers found',
    'ledger.createFirstLedger': 'Create your first ledger to get started',
    'ledger.filter.all': 'All',
    'ledger.filter.lent': 'Lent',
    'ledger.filter.borrowed': 'Borrowed',
    'ledger.filter.overdue': 'Overdue',
    'ledger.filter.settled': 'Settled',
    'ledger.filterByDueDate': 'Filter by Due Date',
    'ledger.fromDate': 'From Date',
    'ledger.toDate': 'To Date',
    'ledger.clear': 'Clear',
    'ledger.apply': 'Apply',
    'ledger.tapToRetry': 'Tap to retry',
    
    // Staff
    'staff.title': 'Staff & Permissions',
    'staff.manageYourTeam': 'Manage Your Team',
    'staff.controlAccess': "Control who has access to your store's data and track their daily activities.",
    'staff.addNewStaffMember': 'Add New Staff Member',
    'staff.activeMembers': 'Active Members',
    'staff.inactivePending': 'Inactive / Pending',
    'staff.managePermissions': 'Manage Permissions',
    'staff.permissions.createLedger': 'Create Ledger',
    'staff.permissions.editLedger': 'Edit Ledger',
    'staff.permissions.deleteLedger': 'Delete Ledger',
    'staff.permissions.recordPayment': 'Record Payment',
    'staff.permissions.viewAllLedgers': 'View All Ledgers',
    'staff.permissions.manageStaff': 'Manage Staff',
    'staff.userCanAccess': 'User can access the app',
    'staff.userCannotAccess': 'User cannot access the app',
    'staff.saveChanges': 'Save Changes',
    'staff.createNewAccount': 'Create a new account for your team',
    'staff.fullName': 'Full Name',
    'staff.password': 'Password',
    'staff.role': 'Role',
    'staff.staff': 'Staff',
    'staff.admin': 'Admin',
    'staff.phoneOptional': 'Phone (Optional)',
    'staff.fillRequiredFields': 'Please fill in all required fields',
    'staff.staffAdded': 'Staff member added successfully',
    'staff.permissionRequired': 'Permission Required',
    'staff.noPermissionManageStaff': 'You do not have permission to manage staff.',
    
    // Modal
    'modal.newLedger': 'New Ledger',
    'modal.recordPayment': 'Record Payment',
    'modal.newContact': 'New Contact',
    'modal.createLedger': 'Create Ledger',
    'modal.confirmPayment': 'Confirm Payment',
    'modal.createContact': 'Create Contact',
    'modal.outstandingBalance': 'Outstanding Balance:',
    'modal.partialPaymentHelp': 'Record partial payment — outstanding will reduce automatically.',
    'modal.theyOweMe': 'They Owe Me',
    'modal.iOweThem': 'I Owe Them',
    'modal.enterNameOrCompany': 'Enter name or company',
    'modal.initialAmount': 'Initial Amount',
    'modal.notesOptional': 'Notes (Optional)',
    'modal.addNotes': 'Add notes...',
    'modal.paymentAmount': 'Payment Amount',
    'modal.method': 'Method',
    'modal.cash': 'Cash',
    'modal.bank': 'Bank',
    'modal.other': 'Other',
    'modal.noteOptional': 'Note (Optional)',
    'modal.addNotePayment': 'Add a note about this payment...',
    'modal.receiptOptional': 'Receipt (Optional)',
    'modal.attachReceipt': 'Attach receipt',
    'modal.receiptAttached': 'Receipt attached',
    'modal.ledgerFullySettled': 'This ledger is fully settled!',
    'modal.enterContactName': 'Enter contact name',
    'modal.enterEmail': 'Enter email address',
    'modal.enterPhone': 'Enter phone number',
    'modal.enterAddress': 'Enter address',
    'modal.addNotesContact': 'Add notes about this contact...',
    'modal.friendWorkFamily': 'friend, work, family (comma separated)',
    'modal.pleaseEnterName': 'Please enter a counterparty name',
    'modal.pleaseEnterValidAmount': 'Please enter a valid amount',
    'modal.paymentExceedBalance': 'Payment amount cannot exceed outstanding balance',
    'modal.pleaseEnterContactName': 'Please enter a contact name',
    'modal.ledgerCreated': 'Ledger created successfully',
    'modal.paymentRecorded': 'Payment recorded successfully!',
    'modal.newBalance': 'New balance:',
    'modal.contactCreated': 'Contact created successfully',
    'modal.idempotentResponse': 'This payment was already recorded (idempotent response)',
    
    // Ledger Detail
    'ledgerDetail.title': 'Ledger Details',
    'ledgerDetail.initial': 'Initial',
    'ledgerDetail.outstanding': 'Outstanding',
    'ledgerDetail.dueDate': 'Due Date',
    'ledgerDetail.na': 'N/A',
    'ledgerDetail.attachments': 'Attachments',
    'ledgerDetail.receipt': 'Receipt',
    'ledgerDetail.recordPayment': 'Record Payment',
    'ledgerDetail.addMoreDebt': 'Add More Debt',
    'ledgerDetail.paymentHistory': 'Payment History',
    'ledgerDetail.noPaymentsYet': 'No payments yet',
    'ledgerDetail.recordedBy': 'Recorded by',
    'ledgerDetail.outstandingStatus': 'Outstanding:',
    'ledgerDetail.editLedger': 'Edit Ledger',
    'ledgerDetail.priority': 'Priority',
    'ledgerDetail.low': 'Low',
    'ledgerDetail.medium': 'Medium',
    'ledgerDetail.high': 'High',
    'ledgerDetail.addTag': 'Add tag...',
    'ledgerDetail.addDebt': 'Add Debt',
    'ledgerDetail.enterName': 'Enter name',
    'ledgerDetail.enterAmount': 'Enter amount',
    'ledgerDetail.addNoteOptional': 'Add a note...',
    'ledgerDetail.theyOweMe': 'They owe me',
    'ledgerDetail.iOweThem': 'I owe them',
    'ledgerDetail.ledgerUpdated': 'Ledger updated successfully',
    'ledgerDetail.ledgerUpdatedError': 'Failed to update ledger',
    'ledgerDetail.deleteLedger': 'Delete Ledger',
    'ledgerDetail.deleteLedgerError': 'Failed to delete ledger',
    'ledgerDetail.enterValidAmount': 'Please enter a valid amount greater than 0',
    'ledgerDetail.ledgerDeleted': 'Ledger deleted',
    'ledgerDetail.deleteConfirm': 'Are you sure you want to delete this ledger? This action cannot be undone.',
    'ledgerDetail.debtAdded': 'Debt added successfully',
    'ledgerDetail.debtAddedError': 'Failed to add debt',
    'ledgerDetail.noActionsAvailable': 'No actions available',
    'ledgerDetail.ledgerNotFound': 'Ledger not found',
    'ledgerDetail.goBack': 'Go back',
    'ledgerDetail.overdueBy': 'Overdue by',
    'ledgerDetail.days': 'days',
    
    // Audit
    'audit.title': 'Audit Logs',
    'audit.noAuditLogs': 'No audit logs found',
    'audit.changes': 'Changes:',
    'audit.all': 'All',
    'audit.users': 'Users',
    'audit.ledgers': 'Ledgers',
    'audit.payments': 'Payments',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.editProfile': 'Edit Profile',
    'settings.account': 'Account',
    'settings.changePassword': 'Change Password',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.bangla': 'Bangla',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmPassword': 'Confirm Password',
    'settings.passwordsNotMatch': 'New passwords do not match',
    'settings.passwordMinLength': 'Password must be at least 6 characters',
    'settings.passwordChanged': 'Password changed successfully',
    'settings.profileUpdated': 'Profile updated successfully',
    'settings.addPhoto': 'Add Photo',
    'settings.company': 'Company',
    'settings.yourCompany': 'Your company',
    'settings.yourName': 'Your name',
    'settings.yourPhone': '+1 234 567 8900',
    'settings.enterCurrentPassword': 'Enter current password',
    'settings.enterNewPassword': 'Enter new password',
    'settings.confirmNewPassword': 'Confirm new password',
    'settings.change': 'Change',
  },
  bn: {
    // Common
    'common.cancel': 'বাতিল',
    'common.save': 'সংরক্ষণ',
    'common.delete': 'মুছুন',
    'common.edit': 'সম্পাদনা',
    'common.error': 'ত্রুটি',
    'common.success': 'সফল',
    'common.loading': 'লোড হচ্ছে...',
    'common.retry': 'আবার চেষ্টা',
    'common.close': 'বন্ধ',
    'common.search': 'অনুসন্ধান',
    'common.name': 'নাম',
    'common.email': 'ইমেইল',
    'common.phone': 'ফোন',
    'common.address': 'ঠিকানা',
    'common.notes': 'নোট',
    'common.tags': 'ট্যাগ',
    'common.amount': 'পরিমাণ',
    'common.date': 'তারিখ',
    'common.type': 'ধরন',
    'common.active': 'সক্রিয়',
    'common.inactive': 'নিষ্ক্রিয়',
    'common.all': 'সব',
    'common.noResults': 'কোনো ফলাফল পাওয়া যায়নি',
    'common.add': 'যোগ করুন',
    
    // Dashboard
    'dashboard.welcomeBack': 'স্বাগতম',
    'dashboard.owedToMe': 'আমাকে দেওয়া বাকি',
    'dashboard.iOwe': 'আমি দেই',
    'dashboard.overdue': 'বকেয়া',
    'dashboard.highPriority': 'উচ্চ অগ্রাধিকার',
    'dashboard.recentActivity': 'সাম্প্রতিক কার্যক্রম',
    'dashboard.viewAll': 'সব দেখুন',
    'dashboard.noRecentActivity': 'কোনো সাম্প্রতিক কার্যক্রম নেই',
    'dashboard.filters.allActivity': 'সব কার্যক্রম',
    'dashboard.filters.dueSoon': 'শীঘ্রই দেওয়ার তারিখ',
    'dashboard.filters.highAmount': 'উচ্চ পরিমাণ',
    'dashboard.synced': 'সিঙ্ক হয়েছে',
    'dashboard.pendingOperations': 'টি মেয়াদী অপারেশন',
    
    // Contacts
    'contacts.title': 'যোগাযোগ',
    'contacts.addContact': 'যোগাযোগ যোগ করুন',
    'contacts.searchPlaceholder': 'যোগাযোগ অনুসন্ধান...',
    'contacts.noContactsYet': 'এখনও কোনো যোগাযোগ নেই',
    'contacts.noContactsMatchSearch': 'আপনার অনুসন্ধানের সাথে কোনো যোগাযোগ মেলেনি',
    'contacts.addFirstContact': 'শুরু করতে আপনার প্রথম যোগাযোগ যোগ করুন',
    'contacts.contactProfile': 'যোগাযোগ প্রোফাইল',
    'contacts.call': 'কল',
    'contacts.message': 'মেসেজ',
    'contacts.netBalance': 'মোট ব্যালেন্স',
    'contacts.owsMe': 'আমাকে দেয়',
    'contacts.iOwe': 'আমি দেই',
    'contacts.settleUp': 'বিল পরিশোধ',
    'contacts.recordPayment': 'পেমেন্ট রেকর্ড',
    'contacts.newEntry': 'নতুন এন্ট্রি',
    'contacts.ledgers': 'লেজার',
    'contacts.ledger': 'লেজার',
    'contacts.ledgers_plural': 'লেজার',
    'contacts.moreTags': '+ আরও',
    
    // Ledger
    'ledger.title': 'ঋণ লেজার',
    'ledger.export': 'রপ্তানি',
    'ledger.searchPlaceholder': 'ঋণ অনুসন্ধান...',
    'ledger.recentEntries': 'সাম্প্রতিক এন্ট্রি',
    'ledger.noLedgersFound': 'কোনো লেজার পাওয়া যায়নি',
    'ledger.createFirstLedger': 'শুরু করতে আপনার প্রথম লেজার তৈরি করুন',
    'ledger.filter.all': 'সব',
    'ledger.filter.lent': 'দেওয়া',
    'ledger.filter.borrowed': 'নেওয়া',
    'ledger.filter.overdue': 'বকেয়া',
    'ledger.filter.settled': 'পরিশোধিত',
    'ledger.filterByDueDate': 'দেওয়ার তারিখ অনুযায়ী ফিল্টার',
    'ledger.fromDate': 'শুরু তারিখ',
    'ledger.toDate': 'শেষ তারিখ',
    'ledger.clear': 'মুছুন',
    'ledger.apply': 'প্রয়োগ',
    'ledger.tapToRetry': 'আবার চেষ্টা করতে ট্যাপ করুন',
    
    // Staff
    'staff.title': 'স্টাফ ও অনুমতি',
    'staff.manageYourTeam': 'আপনার টিম পরিচালনা করুন',
    'staff.controlAccess': 'আপনার স্টোরের ডেটায় কার অ্যাক্সেস আছে তা নিয়ন্ত্রণ করুন এবং তাদের দৈনিক কার্যক্রম ট্র্যাক করুন।',
    'staff.addNewStaffMember': 'নতুন স্টাফ সদস্য যোগ করুন',
    'staff.activeMembers': 'সক্রিয় সদস্য',
    'staff.inactivePending': 'নিষ্ক্রিয় / মুলতুবি',
    'staff.managePermissions': 'অনুমতি পরিচালনা',
    'staff.permissions.createLedger': 'লেজার তৈরি',
    'staff.permissions.editLedger': 'লেজার সম্পাদনা',
    'staff.permissions.deleteLedger': 'লেজার মুছুন',
    'staff.permissions.recordPayment': 'পেমেন্ট রেকর্ড',
    'staff.permissions.viewAllLedgers': 'সব লেজার দেখুন',
    'staff.permissions.manageStaff': 'স্টাফ পরিচালনা',
    'staff.userCanAccess': 'ব্যবহারকারী অ্যাপ অ্যাক্সেস করতে পারে',
    'staff.userCannotAccess': 'ব্যবহারকারী অ্যাপ অ্যাক্সেস করতে পারে না',
    'staff.saveChanges': 'পরিবর্তন সংরক্ষণ',
    'staff.createNewAccount': 'আপনার টিমের জন্য একটি নতুন অ্যাকাউন্ট তৈরি করুন',
    'staff.fullName': 'পুরো নাম',
    'staff.password': 'পাসওয়ার্ড',
    'staff.role': 'ভূমিকা',
    'staff.staff': 'স্টাফ',
    'staff.admin': 'অ্যাডমিন',
    'staff.phoneOptional': 'ফোন (ঐচ্ছিক)',
    'staff.fillRequiredFields': 'অনুগ্রহ করে সব প্রয়োজনীয় ফিল্ড পূরণ করুন',
    'staff.staffAdded': 'স্টাফ সদস্য সফলভাবে যোগ করা হয়েছে',
    'staff.permissionRequired': 'অনুমতি প্রয়োজন',
    'staff.noPermissionManageStaff': 'স্টাফ পরিচালনা করার অনুমতি আপনার নেই।',
    
    // Modal
    'modal.newLedger': 'নতুন লেজার',
    'modal.recordPayment': 'পেমেন্ট রেকর্ড',
    'modal.newContact': 'নতুন যোগাযোগ',
    'modal.createLedger': 'লেজার তৈরি',
    'modal.confirmPayment': 'পেমেন্ট নিশ্চিত',
    'modal.createContact': 'যোগাযোগ তৈরি',
    'modal.outstandingBalance': 'বকেয়া ব্যালেন্স:',
    'modal.partialPaymentHelp': 'আংশিক পেমেন্ট রেকর্ড করুন — বকেয়া স্বয়ংক্রিয়ভাবে কমে যাবে।',
    'modal.theyOweMe': 'ওরা আমাকে দেয়',
    'modal.iOweThem': 'আমি ওদের দেই',
    'modal.enterNameOrCompany': 'নাম বা কোম্পানি লিখুন',
    'modal.initialAmount': 'প্রাথমিক পরিমাণ',
    'modal.notesOptional': 'নোট (ঐচ্ছিক)',
    'modal.addNotes': 'নোট যোগ করুন...',
    'modal.paymentAmount': 'পেমেন্ট পরিমাণ',
    'modal.method': 'পদ্ধতি',
    'modal.cash': 'ক্যাশ',
    'modal.bank': 'ব্যাংক',
    'modal.other': 'অন্যান্য',
    'modal.noteOptional': 'নোট (ঐচ্ছিক)',
    'modal.addNotePayment': 'এই পেমেন্ট সম্পর্কে একটি নোট যোগ করুন...',
    'modal.receiptOptional': 'রসিদ (ঐচ্ছিক)',
    'modal.attachReceipt': 'রসিদ সংযুক্ত করুন',
    'modal.receiptAttached': 'রসিদ সংযুক্ত',
    'modal.ledgerFullySettled': 'এই লেজার সম্পূর্ণ পরিশোধিত!',
    'modal.enterContactName': 'যোগাযোগের নাম লিখুন',
    'modal.enterEmail': 'ইমেইল ঠিকানা লিখুন',
    'modal.enterPhone': 'ফোন নম্বর লিখুন',
    'modal.enterAddress': 'ঠিকানা লিখুন',
    'modal.addNotesContact': 'এই যোগাযোগ সম্পর্কে নোট যোগ করুন...',
    'modal.friendWorkFamily': 'বন্ধু, কাজ, পরিবার (কমা দিয়ে আলাদা)',
    'modal.pleaseEnterName': 'অনুগ্রহ করে কাউন্টারপার্টির নাম লিখুন',
    'modal.pleaseEnterValidAmount': 'অনুগ্রহ করে একটি বৈধ পরিমাণ লিখুন',
    'modal.paymentExceedBalance': 'পেমেন্ট পরিমাণ বকেয়া ব্যালেন্স অতিক্রম করতে পারে না',
    'modal.pleaseEnterContactName': 'অনুগ্রহ করে যোগাযোগের নাম লিখুন',
    'modal.ledgerCreated': 'লেজার সফলভাবে তৈরি হয়েছে',
    'modal.paymentRecorded': 'পেমেন্ট সফলভাবে রেকর্ড হয়েছে!',
    'modal.newBalance': 'নতুন ব্যালেন্স:',
    'modal.contactCreated': 'যোগাযোগ সফলভাবে তৈরি হয়েছে',
    'modal.idempotentResponse': 'এই পেমেন্ট ইতিমধ্যে রেকর্ড হয়েছে (idempotent response)',
    
    // Ledger Detail
    'ledgerDetail.title': 'লেজার বিবরণ',
    'ledgerDetail.initial': 'প্রাথমিক',
    'ledgerDetail.outstanding': 'বকেয়া',
    'ledgerDetail.dueDate': 'দেওয়ার তারিখ',
    'ledgerDetail.na': 'এন/এ',
    'ledgerDetail.attachments': 'সংযুক্তি',
    'ledgerDetail.receipt': 'রসিদ',
    'ledgerDetail.recordPayment': 'পেমেন্ট রেকর্ড',
    'ledgerDetail.addMoreDebt': 'আরও ঋণ যোগ',
    'ledgerDetail.paymentHistory': 'পেমেন্ট ইতিহাস',
    'ledgerDetail.noPaymentsYet': 'এখনও কোনো পেমেন্ট নেই',
    'ledgerDetail.recordedBy': 'রেকর্ড করেছেন',
    'ledgerDetail.outstandingStatus': 'বকেয়া:',
    'ledgerDetail.editLedger': 'লেজার সম্পাদনা',
    'ledgerDetail.priority': 'অগ্রাধিকার',
    'ledgerDetail.low': 'কম',
    'ledgerDetail.medium': 'মাঝারি',
    'ledgerDetail.high': 'উচ্চ',
    'ledgerDetail.addTag': 'ট্যাগ যোগ...',
    'ledgerDetail.addDebt': 'ঋণ যোগ',
    'ledgerDetail.enterName': 'নাম লিখুন',
    'ledgerDetail.enterAmount': 'পরিমাণ লিখুন',
    'ledgerDetail.addNoteOptional': 'একটি নোট যোগ করুন...',
    'ledgerDetail.theyOweMe': 'ওরা আমাকে দেয়',
    'ledgerDetail.iOweThem': 'আমি ওদের দেই',
    'ledgerDetail.ledgerUpdated': 'লেজার সফলভাবে আপডেট হয়েছে',
    'ledgerDetail.ledgerUpdatedError': 'লেজার আপডেট করতে ব্যর্থ',
    'ledgerDetail.deleteLedger': 'লেজার মুছুন',
    'ledgerDetail.deleteLedgerError': 'লেজার মুছতে ব্যর্থ',
    'ledgerDetail.enterValidAmount': 'অনুগ্রহ করে ০ এর বেশি একটি বৈধ পরিমাণ লিখুন',
    'ledgerDetail.ledgerDeleted': 'লেজার মুছে ফেলা হয়েছে',
    'ledgerDetail.deleteConfirm': 'আপনি কি নিশ্চিত যে আপনি এই লেজার মুছতে চান? এই কাজটি পূরণ করা যাবে না।',
    'ledgerDetail.debtAdded': 'ঋণ সফলভাবে যোগ করা হয়েছে',
    'ledgerDetail.debtAddedError': 'ঋণ যোগ করতে ব্যর্থ',
    'ledgerDetail.noActionsAvailable': 'কোনো অ্যাকশন উপলব্ধ নেই',
    'ledgerDetail.ledgerNotFound': 'লেজার পাওয়া যায়নি',
    'ledgerDetail.goBack': 'ফিরে যান',
    'ledgerDetail.overdueBy': 'বকেয়া',
    'ledgerDetail.days': 'দিন',
    
    // Audit
    'audit.title': 'অডিট লগ',
    'audit.noAuditLogs': 'কোনো অডিট লগ পাওয়া যায়নি',
    'audit.changes': 'পরিবর্তন:',
    'audit.all': 'সব',
    'audit.users': 'ব্যবহারকারী',
    'audit.ledgers': 'লেজার',
    'audit.payments': 'পেমেন্ট',
    
    // Settings
    'settings.title': 'সেটিংস',
    'settings.profile': 'প্রোফাইল',
    'settings.editProfile': 'প্রোফাইল সম্পাদনা',
    'settings.account': 'অ্যাকাউন্ট',
    'settings.changePassword': 'পাসওয়ার্ড পরিবর্তন',
    'settings.about': 'সম্পর্কে',
    'settings.version': 'ভার্সন',
    'settings.language': 'ভাষা',
    'settings.english': 'ইংরেজি',
    'settings.bangla': 'বাংলা',
    'settings.currentPassword': 'বর্তমান পাসওয়ার্ড',
    'settings.newPassword': 'নতুন পাসওয়ার্ড',
    'settings.confirmPassword': 'পাসওয়ার্ড নিশ্চিত করুন',
    'settings.passwordsNotMatch': 'নতুন পাসওয়ার্ড মিলছে না',
    'settings.passwordMinLength': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
    'settings.passwordChanged': 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে',
    'settings.profileUpdated': 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
    'settings.addPhoto': 'ফোটো যোগ করুন',
    'settings.company': 'কোম্পানি',
    'settings.yourCompany': 'আপনার কোম্পানি',
    'settings.yourName': 'আপনার নাম',
    'settings.yourPhone': '+1 234 567 8900',
    'settings.enterCurrentPassword': 'বর্তমান পাসওয়ার্ড লিখুন',
    'settings.enterNewPassword': 'নতুন পাসওয়ার্ড লিখুন',
    'settings.confirmNewPassword': 'নতুন পাসওয়ার্ড নিশ্চিত করুন',
    'settings.change': 'পরিবর্তন',
  },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang === 'en' || savedLang === 'bn') {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.log('LanguageContext: AsyncStorage not available yet');
      } finally {
        setIsReady(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {});
    } catch (error) {
      console.log('LanguageContext: AsyncStorage not available');
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language][key] || key;
  };

  if (!isReady) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: (key: string) => TRANSLATIONS['en'][key] || key }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
