import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { StepProvider } from '../src/context/StepContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular: require('../assets/fonts/InstrumentSerif-Regular.ttf'),
    InstrumentSerif_700Bold: require('../assets/fonts/InstrumentSerif-Italic.ttf'),
  });

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== 'android') {
        setPermissionChecked(true);
        return;
      }

      try {
        await PermissionsAndroid.requestMultiple(
          // Casting to any to allow newer Android permission constants without strict typing issues
          [PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION] as any,
        );
      } finally {
        setPermissionChecked(true);
      }
    };

    void requestPermissions();
  }, []);

  if (!fontsLoaded || !permissionChecked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBFBF9',
        }}>
        <ActivityIndicator size="large" color="#556B2F" />
      </View>
    );
  }

  return (
    <StepProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </StepProvider>
  );
}

