import type { Href } from 'expo-router';

/** Hrefs tipados — Expo typedRoutes às vezes atrasa após novos grupos. */
export const routes = {
  root: '/' as Href,
  authWelcome: '/(auth)/welcome' as Href,
  authSignIn: '/(auth)/sign-in' as Href,
  authSignUp: '/(auth)/sign-up' as Href,
  authForgotPassword: '/(auth)/forgot-password' as Href,
  authMigrate: '/(auth)/migrate' as Href,
  onboardingWelcome: '/(onboarding)/welcome' as Href,
  onboardingIncome: '/(onboarding)/income' as Href,
  onboardingAccountChoice: '/(onboarding)/account-choice' as Href,
  onboardingAccountAmount: '/(onboarding)/account-amount' as Href,
  appTabs: '/(app)/(tabs)' as Href,
  receiptCapture: '/(app)/receipt/capture' as Href,
  receiptProcessing: '/(app)/receipt/processing' as Href,
  receiptReview: '/(app)/receipt/review' as Href,
  receiptDetail: '/(app)/receipt/detail' as Href,
  receiptQr: '/(app)/receipt/qr' as Href,
  goalForm: '/(app)/goal/form' as Href,
  recurringForm: '/(app)/recurring/form' as Href,
  transactionForm: '/(app)/transaction/form' as Href,
  profileNotifications: '/(app)/profile/notifications' as Href,
  profileExport: '/(app)/profile/export' as Href,
};
