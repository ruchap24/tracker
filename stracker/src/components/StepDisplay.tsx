import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useStepContext } from '../context/StepContext';

const BACKGROUND_COLOR = '#FBFBF9';
const TEXT_COLOR = '#1C1C1C';
const ACCENT_COLOR = '#556B2F';

export const StepDisplay: React.FC = () => {
  const { steps, distanceKm, calories, isWalking, isSupported, initialized, resetSteps } =
    useStepContext();

  if (!initialized) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  if (!isSupported) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.unsupportedTitle}>Step tracking not supported on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Daily Movement</Text>
      </View>

      <View style={styles.centerpiece}>
        <Text style={styles.stepsText}>{steps}</Text>
        <Text style={styles.stepsLabel}>{isWalking ? 'Walking' : 'Idle'}</Text>
      </View>

      <View style={styles.bottomGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Distance</Text>
          <Text style={styles.gridValue}>{distanceKm.toFixed(2)} km</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Calories</Text>
          <Text style={styles.gridValue}>{calories.toFixed(0)} kcal</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetSteps}>
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 16,
    color: TEXT_COLOR,
    opacity: 0.8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'InstrumentSerif_400Regular',
  },
  centerpiece: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsText: {
    fontSize: 96,
    color: TEXT_COLOR,
    fontFamily: 'InstrumentSerif_400Regular',
  },
  stepsLabel: {
    marginTop: 8,
    fontSize: 18,
    color: TEXT_COLOR,
    opacity: 0.7,
  },
  bottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 14,
    color: TEXT_COLOR,
    opacity: 0.7,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    color: ACCENT_COLOR,
    fontWeight: '600',
    fontFamily: 'InstrumentSerif_400Regular',
  },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  resetText: {
    fontSize: 16,
    color: ACCENT_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  unsupportedTitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
    fontSize: 20,
    color: TEXT_COLOR,
    fontFamily: 'InstrumentSerif_400Regular',
  },
});

export default StepDisplay;

