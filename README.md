# Pillora

Pillora is a cross-platform medication reminder and tracking application built with React Native and Expo. It helps users manage daily doses, monitor adherence, review history, and track refill needs in an offline-first experience.

## Current Product Scope

Pillora provides a focused daily workflow for medication management:

- Secure device-level authentication using biometric login with local fallback handling.
- A home dashboard with daily progress, dose focus, and quick navigation.
- Full medication management flow: add, edit, and delete medications.
- Custom validation modal that lists missing or invalid form fields.
- Local reminder scheduling for medication and refill workflows.
- Calendar and History modules to review adherence activity.
- History filtering by status, date range, and search query.

## Core Features

### Authentication

- Biometric authentication with system fallback handling.
- Local-only authentication flow with no required backend service.
- Developer bypass entry is available only in development mode.

### Home Dashboard

- Daily progress ring for scheduled doses.
- Dose Focus card showing next due medication and overdue status.
- Quick Actions for Medications, Calendar, History, and Refill Tracker.
- Persistent notification read/unread indicators.

### Medication Management

- Add medications with dosage, schedule, duration, and visual color coding.
- Edit existing medications with prefilled values.
- Delete medications from the management screen or edit screen.
- Support for both scheduled-time medications and as-needed medications.
- Refill tracking fields with validation and threshold checks.
- Validation modal with detailed issues instead of a generic error alert.

### Notifications

- Local scheduling with expo-notifications.
- Deduplicated reminder updates when medication settings change.
- Read/unread notification state persisted in local storage.

### Calendar, History, and Refills

- Calendar view for day-based medication review.
- History log for recorded doses grouped by date.
- History filters: All, Taken, Missed.
- History date-range filters: All Time, Today, 7 Days, 30 Days.
- Search in history by medication name, dosage, or scheduled time.
- Refill tracker for stock monitoring and low-inventory awareness.

## Tech Stack

- React Native 0.81
- Expo SDK 54
- Expo Router
- TypeScript
- AsyncStorage
- expo-local-authentication
- expo-notifications
- react-native-svg
- expo-linear-gradient

## Project Structure

- app: Route-based screens (auth, home, calendar, history, medications, refills)
  - medications/index.tsx: Medication management list (edit/delete entry point)
  - medications/add.tsx: Add/edit form with custom validation modal
- assets: Images and app icon resources
- components: Reusable UI components
- constants: Theme tokens and shared constants
- hooks: Shared React hooks
- utils: Storage and notification utilities

## Data Model Notes

Medication records currently include:

- name, dosage, frequency, times, duration, startDate
- reminderEnabled, refillReminder
- currentSupply, totalSupply, refillAt
- color and optional notes

Dose history entries include:

- medicationId, timestamp, taken, scheduledTime

## Getting Started

### Prerequisites

- Node.js LTS
- npm
- Expo CLI (optional, but recommended)

### Installation

```bash
npm install
```

### Run in Development

```bash
npm run start
```

Useful shortcuts in Expo terminal:

- a: Run on Android
- i: Run on iOS
- w: Run on Web

You can also run platform commands directly:

```bash
npm run android
npm run ios
npm run web
```

### Linting

```bash
npm run lint
```

## Production Builds (EAS)

This project includes EAS configuration in eas.json.

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

1. Log in to Expo:

```bash
eas login
```

1. Build Android artifact:

```bash
eas build -p android --profile preview
```

## Notes

- Notifications require proper device permissions.
- Push notification behavior varies by platform and simulator capabilities.
- The app icon and splash branding are configured in app.json.
- Notification behavior should be tested on a physical Android device for best accuracy.
