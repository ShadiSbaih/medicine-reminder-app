# Medicine Reminder Application

## Overview

The Medicine Reminder Application is a cross-platform mobile application built using React Native and Expo. It is designed to help users efficiently manage their medication schedules, track adherence, and receive timely notifications to ensure consistent health management.

## Key Features

- Cross-Platform Support: Seamlessly runs on iOS, Android, and Web platforms.
- Authentication & Security: Integrates robust authentication flows utilizing Passkeys, Apple Authentication, and Privy for secure user management.
- Local Storage & Encryption: Employs secure on-device storage for sensitive health data using Expo Secure Store and Crypto.
- Automated Notifications: Utilizes Expo Notifications to deliver reliable, scheduled medication reminders.
- Web3 Capabilities: Incorporates Web3 functionalities using Viem and Permissionless libraries for advanced integration options.
- User Interface: Features a clean, responsive design utilizing Expo Router for navigation, and integrated UI components such as circular progress indicators and QR code generation.

## Prerequisites

Before running the application, ensure the following are installed on your development machine:

- Node.js (v18.0.0 or later recommended)
- npm or Yarn package manager
- Expo CLI
- iOS Simulator (macOS only) or Android Studio Emulator for local testing

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShadiSbaih/medicine-reminder-app.git
   ```

2. Navigate into the project directory:
   ```bash
   cd medicine-reminder-app
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server, execute the following command:

```bash
npm start
```

This will launch the Expo CLI. From the terminal prompt, you can choose to:
- Press `i` to open the app in an iOS Simulator.
- Press `a` to open the app in an Android Emulator.
- Press `w` to open the app in a web browser.
- Scan the provided QR code with the Expo Go app on a physical device.

## Project Structure

- `app/`: Contains the primary application screens and file-based routing logic (Expo Router).
- `assets/`: Houses static resources such as images and fonts.
- `scripts/`: Includes utility scripts for project management.

## Contributing

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/YourFeatureName`).
3. Commit your changes (`git commit -m "Add YourFeatureName"`).
4. Push to the branch (`git push origin feature/YourFeatureName`).
5. Open a Pull Request for review.

## License

This project is licensed under the MIT License. See the LICENSE file for more information.
