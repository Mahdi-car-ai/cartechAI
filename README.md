# CarTechAI

AI Mechanic Assistant

## Getting Started

### Prerequisites
- Node.js (recommended version: 16.x or later)
- npm or yarn
- For iOS: macOS, Xcode
- For Android: Android Studio, Android SDK

### Installation
```bash
# Install dependencies
npm install
# or with yarn
yarn install
```

### Running the Project
```bash
# Start the development server
npx expo start
# or
npm run start
# or
yarn start
```

## Development Builds

### Create a Development Build
```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## EAS Builds (Expo Application Services)

### Configure EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure
```

### Create EAS Builds

#### Development Build
```bash
# For iOS
eas build --platform ios --profile development

# For Android
eas build --platform android --profile development
```

#### Preview Build
```bash
# For iOS
eas build --platform ios --profile preview

# For Android
eas build --platform android --profile preview
```

#### Production Build
```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

### Submit to App Stores
```bash
# For iOS App Store
eas submit -p ios

# For Google Play Store
eas submit -p android
```

## Maintenance Commands

### Clear Cache
```bash
# Clear Expo/Metro cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Clear yarn cache
yarn cache clean

# Clear watchman cache (if installed)
watchman watch-del-all
```

### Update Dependencies
```bash
# Update all dependencies
npm update
# or
yarn upgrade

# Update Expo SDK
npx expo upgrade
```

### Troubleshooting
```bash
# Reset complete cache and node_modules
rm -rf node_modules
rm -rf .expo
yarn install
# or
npm install
```

## Common Commands Reference

### Development
- `npx expo start` - Start the development server
- `npx expo start --tunnel` - Start with tunnel connection
- `npx expo start --clear` - Start with cleared cache
- `npx expo start --web` - Start for web platform

### Testing
- `npm run test` - Run tests
- `npm run lint` - Run linter

### Updates
- `npx expo-doctor` - Check for issues in the project
- `npx expo install [package-name]` - Install expo-compatible packages

### EAS Update
```bash
# Publish an update
eas update --branch production --message "Update description"

# Roll back to a previous update
eas update:rollback
```
