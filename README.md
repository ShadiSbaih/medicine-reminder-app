# Medicine Reminder Application

A cross-platform React Native application built with [Expo](https://expo.dev/) designed to help users track and remember their medication schedules.

## 🚀 Features

- **Medication Scheduling**: Easily add and manage medication routines.
- **Push Notifications**: Timely local reminders for taking medications.
- **Secure Authentication**: Integrated with [Privy](https://privy.io/) and Passkeys for secure, passwordless login.
- **Cross-Platform**: Runs natively on Android, iOS, and Web.
- **Local Storage**: Securely stores user data using `expo-secure-store` and `AsyncStorage`.

## 🛠 Tech Stack

- **Framework**: React Native & Expo (SDK 54)
- **Navigation**: Expo Router & React Navigation
- **Authentication**: Privy (`@privy-io/expo`) & Passkeys
- **Blockchain/Web3**: `viem`, `permissionless`
- **UI/Styling**: Custom components, `react-native-reanimated`, `react-native-svg`

## 📦 Installation

1. **Clone the repository** (if applicable) and navigate to the project directory:
   ```bash
   cd medicine_reminder
   ```

2. **Install dependencies**:
   *Note: This project uses a `.npmrc` file with `legacy-peer-deps=true` to resolve specific Web3/Privy peer dependencies.*
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

This project is configured to use Expo Application Services (EAS) to build a standalone Android APK.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo** (if you haven't already):
   ```bash
   eas login
   ```

3. **Build the Android APK** (Preview Profile):
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   *Once the build completes, EAS will provide a direct link in the terminal to download your `.apk` file so you can install it on an Android device.*

## 📂 Project Structure

- `/app` - Expo Router file-based routing (pages like `home.tsx`, `auth.tsx`, `medications/`, etc.)
- `/components` - Reusable UI components (buttons, text, modals)
- `/constants` - Theme colors, styling constants, and configurations
- `/hooks` - Custom React hooks
- `/utils` - Helper functions (e.g., `notifications.ts`, `storage.ts`)
- `/assets` - Static assets like images and icons

## 🐛 Troubleshooting

- **npm ERESOLVE errors**: If you run into dependency issues during install, ensure you are running `npm install` so it respects the local `.npmrc` rules (`legacy-peer-deps=true`).
- **expo doctor warnings**: The package `@react-navigation/native` is intentionally excluded from Expo's strict version validation in `package.json` to support the required navigation features.
