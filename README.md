# Pillora

Pillora is a cross-platform medication reminder and tracking application built with React Native and Expo. It helps users manage daily doses, monitor adherence, review history, and track refill needs in an offline-first experience.

## Overview

Pillora provides a focused daily workflow for medication management:

- Secure device-level authentication using biometrics through Expo Local Authentication.
- A home dashboard with daily adherence progress and upcoming dose focus.
- Medication scheduling with support for timed and as-needed entries.
- Local reminder notifications for active medication schedules.
- Calendar and history views for reviewing dose activity.
- Refill tracking to monitor inventory and restock thresholds.
- Notification center behavior with persistent read and unread state.

## Core Features

### Authentication

- Biometric authentication with system fallback handling.
- Local-only authentication flow with no required backend service.

### Home Dashboard

- Daily progress ring for scheduled doses.
- Dose Focus card showing next due medication and overdue status.
- Quick Actions for Add Medication, Calendar, History, and Refill Tracker.

### Medication Management

- Add medications with dosage, schedule, duration, and visual color coding.
- Support for both scheduled-time medications and as-needed medications.

### Notifications

- Local scheduling with expo-notifications.
- Read/unread notification state persisted in local storage.

### Calendar, History, and Refills

- Calendar view for day-based medication review.
- History log for recorded doses.
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
- assets: Images and app icon resources
- components: Reusable UI components
- constants: Theme tokens and shared constants
- hooks: Shared React hooks
- utils: Storage and notification utilities

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

2. Log in to Expo:

```bash
eas login
```

3. Build Android artifact:

```bash
eas build -p android --profile preview
```

## Notes

- Notifications require proper device permissions.
- Push notification behavior varies by platform and simulator capabilities.
- The app icon and splash branding are configured in app.json.
