import { WebView } from "react-native-webview";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import {
  generateMusicXMLForScale,
  getAvailableModes,
  Mode,
  RhythmPattern,
  SlurPattern,
} from "@/lib/Scales";

const CustomDropdown = <T,>(props: {
  data: { label: string; value: T }[];
  onChange: (arg: { label: string; value: T }) => void;
  value: T;
  style?: StyleProp<ViewStyle>;
}) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <Dropdown
      style={[styles.dropdown, props.style, isFocus && { borderColor: "blue" }]}
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
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
];

const availableStartOctaves = [
  { label: "3", value: 3 },
  { label: "4", value: 4 },
];

const availableSlurPatterns: { label: string; value: SlurPattern }[] = [
  { label: "slur two, tongue two", value: "slur two tongue two" },
  { label: "tongue two, slur two", value: "tongue two slur two" },
  { label: "slur two, slur two", value: "slur two slur two" },
  {
    label: "tongue one, slur two, tongue one",
    value: "tongue one slur two tongue one",
  },
  { label: "tongue one, slur three", value: "tongue one slur three" },
  { label: "slur three, tongue one", value: "slur three tongue one" },
  { label: "tongued", value: "tongued" },
  { label: "slur four", value: "slur four" },
];

export default function MusicScreen() {
  const [key, setKey] = useState<string>("C");
  const [mode, setMode] = useState<Mode>("major");
  const [rhythm, setRhythm] = useState<RhythmPattern>("long octave");
  const [octaves, setOctaves] = useState(1);
  const [startOctave, setStartOctave] = useState(4);
  const [slurPattern, setSlurPattern] = useState<SlurPattern>("tongued");

  const availableModesForKey = getAvailableModes(key);
  if (!availableModesForKey.includes(mode)) {
    setMode(availableModesForKey[0]);
  }

  const xml = generateMusicXMLForScale({
    key,
    mode,
    rhythm,
    slurPattern,
    octaves,
    startOctave,
  });

  const htmlContent = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://unpkg.com/opensheetmusicdisplay@0.8.3/build/opensheetmusicdisplay.min.js"></script>
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="osmd-container"></div>
    <script>
      const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(
        "osmd-container",
        {
          autoResize: true,
          backend: "svg",
          drawingParameters: "compacttight",
          autoBeam: true,
        },
      );

      osmd
        .load(\`${xml}\`)
        .then(() => osmd.render());
    </script>
  </body>
</html>
  `;

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.optionsContainer}>
            <CustomDropdown
              data={availableKeys}
              onChange={(item) => setKey(item.value)}
              value={key}
              style={styles.option}
            />

            <CustomDropdown
              data={availableModes.filter(({ value }) =>
                availableModesForKey.includes(value),
              )}
              onChange={(item) => setMode(item.value)}
              value={mode}
              style={styles.option}
            />

            <CustomDropdown
              data={availableRhythms}
              onChange={(item) => setRhythm(item.value)}
              value={rhythm}
              style={styles.option}
            />

            <CustomDropdown
              data={availableOctaves}
              onChange={(item) => setOctaves(item.value)}
              value={octaves}
              style={styles.option}
            />

            <CustomDropdown
              data={availableStartOctaves}
              onChange={(item) => setStartOctave(item.value)}
              value={startOctave}
              style={styles.option}
            />

            <CustomDropdown
              data={availableSlurPatterns}
              onChange={(item) => setSlurPattern(item.value)}
              value={slurPattern}
              style={styles.option}
            />
          </View>

          <WebView
            style={styles.container}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}></WebView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 32,
  },
  container: {
    flex: 1,
    height: 200,
  },
  row: {
    flexDirection: "row",
  },

  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 32,
  },

  option: {
    flex: 1,
  },

  dropdown: {
    height: 50,
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
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
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
    width: 350,
  },
});
