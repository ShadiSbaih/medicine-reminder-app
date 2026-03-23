# MedRemind - Personal Medication Assistant

A comprehensive, cross-platform React Native application built with [Expo](https://expo.dev/) designed to help users track, manage, and remember their medication schedules securely.

## 🚀 Key Features

MedRemind provides a full suite of features to ensure you never miss a dose and always have your medications in stock.

### 1. Secure Authentication
Security is a priority when handling personal health data.
- **Biometric Login**: Seamlessly access the app using your device's native Face ID or Touch ID via `expo-local-authentication`.
- **PIN Fallback**: Secure PIN entry for devices without biometric hardware or if biometrics fail.
- **Privacy First**: All authentication is handled locally on the device, ensuring your health routines remain private.

### 2. Interactive Home Dashboard
The home screen acts as your daily command center.
- **Daily Progress Tracker**: Features a custom-built, animated circular progress ring (using `react-native-svg` and `Animated` API) that visualizes your daily adherence. It dynamically updates as you log taken doses.
- **Today's Schedule**: Automatically filters your active prescriptions to display exactly what you need to take today based on frequency and duration settings.
- **Quick Actions**: Fast navigation to Add Medication, Calendar View, History Log, and Refill Tracker through a sleek, gradient-styled UI.

### 3. Comprehensive Medication Management
Adding and managing medications is highly customizable to fit any prescription requirement.
- **Flexible Scheduling**: Set medication frequencies (Once daily, Twice daily, As needed, etc.) and specify exact times using native time pickers.
- **Duration Tracking**: Define how long a prescription lasts (e.g., 7 days, 30 days, or Ongoing) so the app knows exactly when to stop reminding you.
- **Visual Customization**: Assign colors and icons to different medications for quick visual identification.

### 4. Smart Push Notifications
Reliable, locally-scheduled notifications keep you on track without needing a constant internet connection.
- **Dose Reminders**: Uses `expo-notifications` to schedule precise local alerts matching your chosen medication times.
- **Smart Rollover**: Automatically calculates and schedules the next dose even if the time for the current day has passed.

### 5. Dose History & Calendar View
Keep a reliable log of your health habits.
- **History Log**: Records exactly when doses are taken or missed, timestamped and stored locally.
- **Calendar Integration**: A dedicated calendar view allows you to look back at past adherence or look ahead at future scheduled doses.

### 6. Refill Tracker & Inventory Management
Never run out of important medications unexpectedly.
- **Supply Tracking**: Input your total supply when adding a medication.
- **Low Stock Alerts**: Define a "Refill At" threshold. The app actively monitors your remaining doses and triggers a Refill Reminder notification when your supply drops to or below the threshold.

## 🛠 Tech Stack & Architecture

- **Framework**: React Native & Expo (SDK 54)
- **Navigation**: Expo Router (file-based routing) & React Navigation
- **Authentication**: `expo-local-authentication` (with `@privy-io/expo` & Passkeys configured in dependencies for future Web3/wallet integration)
- **Local Storage**: `@react-native-async-storage/async-storage` for robust, offline-first data persistence.
- **Notifications**: `expo-notifications` for local push scheduling.
- **UI/Styling**: Custom components, `react-native-reanimated`, `react-native-svg`, `expo-linear-gradient`, and `@expo/vector-icons`.

## � Project Structure

- `/app` - Expo Router file-based routing:
  - `index.tsx` - Animated Splash Screen
  - `auth.tsx` - Biometric/PIN Authentication Screen
  - `home.tsx` - Main Dashboard & Progress Tracker
  - `/medications` - Add and manage medication forms
  - `/calendar` - Calendar view for schedules
  - `/history` - Log of taken and missed doses
  - `/refills` - Supply and inventory tracking
- `/components` - Reusable UI components (buttons, parallax views, themed text)
- `/constants` - Theme colors, styling constants, and configurations
- `/hooks` - Custom React hooks for theming and color schemes
- `/utils` - Core business logic:
  - `storage.ts` - AsyncStorage wrappers for medications and dose history
  - `notifications.ts` - Push notification scheduling logic
- `/assets` - Static assets, images, and app icons

## �📦 Installation

1. **Clone the repository** (if applicable) and navigate to the project directory:
   ```bash
   cd medicine_reminder
   ```

2. **Install dependencies**:
   *Note: This project uses a `.npmrc` file with `legacy-peer-deps=true` to resolve specific peer dependencies.*
   ```bash
   npm install
   ```

## 🏃‍♂️ Running the App Locally

Start the Expo development server:

```bash
npx expo start
```

From there, you can:
- Press `a` to open on an Android emulator.
- Press `i` to open on an iOS simulator.
- Press `w` to open in a web browser.
- Scan the QR code with the Expo Go app on your physical device.

## 🏗 Building for Production / APK

This project is configured to use Expo Application Services (EAS) to build standalone apps.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Build the Android APK** (Preview Profile):
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   *Once the build completes, EAS will provide a direct link in the terminal to download your `.apk` file so you can install it on an Android device.*

## 🐛 Troubleshooting

- **npm ERESOLVE errors**: If you run into dependency issues during install, ensure you are running `npm install` so it respects the local `.npmrc` rules (`legacy-peer-deps=true`).
- **Push Notifications**: Note that push notifications do not work on iOS simulators. Test on a physical device or Android emulator.
