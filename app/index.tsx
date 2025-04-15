import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import {
  getAvailableModes,
  Mode,
  RhythmPattern,
  SlurPattern,
} from "@/lib/Scales";

import { ThemedText } from "@/components/ThemedText";
import { useScaleOptions } from "@/lib/ScaleContext";

const CustomDropdown = <T,>(props: {
  data: { label: string; value: T }[];
  onChange: (arg: { label: string; value: T }) => void;
  value: T;
  style?: StyleProp<ViewStyle>;
  label: string;
}) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={props.style}>
      <ThemedText style={styles.dropdownLabel}>{props.label}</ThemedText>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: "blue" }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        containerStyle={styles.containerStyle}
        iconStyle={styles.iconStyle}
        data={props.data}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? "Select item" : "..."}
        searchPlaceholder="Search..."
        value={props.value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          props.onChange({ label: item.label, value: item.value });
          setIsFocus(false);
        }}
      />
    </View>
  );
};

const availableKeys: { label: string; value: string }[] = [
  { label: "C", value: "C" },
  { label: "C#", value: "C#" },
  { label: "Db", value: "Db" },
  { label: "D", value: "D" },
  { label: "D#", value: "D#" },
  { label: "Eb", value: "Eb" },
  { label: "E", value: "E" },
  { label: "F", value: "F" },
  { label: "F#", value: "F#" },
  { label: "Gb", value: "Gb" },
  { label: "G", value: "G" },
  { label: "G#", value: "G#" },
  { label: "Ab", value: "Ab" },
  { label: "A", value: "A" },
  { label: "A#", value: "A#" },
  { label: "Bb", value: "Bb" },
  { label: "B", value: "B" },
];

const availableModes: {
  label: string;
  value: Mode;
}[] = [
  { label: "Major", value: "major" },
  { label: "Minor", value: "minor" },
  { label: "Harmonic Minor", value: "harmonic minor" },
  { label: "Melodic Minor", value: "melodic minor" },
];

const availableRhythms: { label: string; value: RhythmPattern }[] = [
  { label: "Long Octave", value: "long octave" },
  { label: "Sixteenths", value: "sixteenths" },
  { label: "Eighth, Two Sixteenths", value: "eighth two sixteenths" },
];

const availableOctaves = [
  { label: "1 octave", value: 1 },
  { label: "2 octaves", value: 2 },
  { label: "3 octaves", value: 3 },
];

const availableStartOctaves = [
  { label: "Start on octave 3", value: 3 },
  { label: "Start on octave 4", value: 4 },
];

const availableSlurPatterns: { label: string; value: SlurPattern }[] = [
  { label: "Slur two, tongue two", value: "slur two tongue two" },
  { label: "Tongue two, slur two", value: "tongue two slur two" },
  { label: "Slur two, slur two", value: "slur two slur two" },
  {
    label: "Tongue one, slur two, tongue one",
    value: "tongue one slur two tongue one",
  },
  { label: "Tongue one, slur three", value: "tongue one slur three" },
  { label: "Slur three, tongue one", value: "slur three tongue one" },
  { label: "Tongued", value: "tongued" },
  { label: "Slur four", value: "slur four" },
];

export default function HomeScreen() {
  const { options, updateOptions } = useScaleOptions();
  const { key, mode, rhythm, octaves, startOctave, slurPattern } = options;

  const availableModesForKey = getAvailableModes(key);

  // Make sure the selected mode is valid for the current key
  if (!availableModesForKey.includes(mode)) {
    updateOptions({ mode: availableModesForKey[0] });
  }

  const navigateToMusicNotation = () => {
    router.push("/scale");
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.headerContainer}>
            <ThemedText type="title">Tonal Flow</ThemedText>
          </View>

          <View style={styles.optionsContainer}>
            <View style={styles.optionsRow}>
              <CustomDropdown
                label="Key"
                data={availableKeys}
                onChange={(item) => updateOptions({ key: item.value })}
                value={key}
                style={styles.optionColumn}
              />

              <CustomDropdown
                label="Mode"
                data={availableModes.filter(({ value }) =>
                  availableModesForKey.includes(value),
                )}
                onChange={(item) => updateOptions({ mode: item.value })}
                value={mode}
                style={styles.optionColumn}
              />

              <CustomDropdown
                label="Octaves"
                data={availableOctaves}
                onChange={(item) => updateOptions({ octaves: item.value })}
                value={octaves}
                style={styles.optionColumn}
              />
            </View>

            <View style={styles.optionsRow}>
              <CustomDropdown
                label="Start Octave"
                data={availableStartOctaves}
                onChange={(item) => updateOptions({ startOctave: item.value })}
                value={startOctave}
                style={styles.optionColumn}
              />

              <CustomDropdown
                label="Rhythm Pattern"
                data={availableRhythms}
                onChange={(item) => updateOptions({ rhythm: item.value })}
                value={rhythm}
                style={styles.optionColumn}
              />

              <CustomDropdown
                label="Articulation"
                data={availableSlurPatterns}
                onChange={(item) => updateOptions({ slurPattern: item.value })}
                value={slurPattern}
                style={styles.optionColumn}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={navigateToMusicNotation}>
              <ThemedText style={styles.buttonText}>View Scale</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  subtitle: {
    marginTop: 5,
    opacity: 0.8,
  },
  optionsContainer: {
    padding: 15,
    gap: 12,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 15,
  },
  optionColumn: {
    flex: 1,
  },
  option: {
    marginBottom: 10,
  },
  dropdownLabel: {
    fontSize: 15,
    marginBottom: 4,
  },
  dropdown: {
    height: 45,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 14,
  },
  selectedTextStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  containerStyle: {
    maxWidth: 350,
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
