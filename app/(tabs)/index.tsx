import { WebView } from "react-native-webview";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";

import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { generateMusicXMLForScale, Mode, RhythmPattern } from "@/lib/Scales";

const CustomDropdown = <T,>(props: {
  data: { label: string; value: T }[];
  onChange: (arg: { label: string; value: T }) => void;
  value: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <Dropdown
      style={[styles.dropdown, props.style, isFocus && { borderColor: "blue" }]}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
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

export default function MusicScreen() {
  const [key, setKey] = useState<string>("C");
  const [mode, setMode] = useState<Mode>("major");
  const [rhythm, setRhythm] = useState<RhythmPattern>("long octave");

  const xml = generateMusicXMLForScale({
    key,
    mode,
    rhythm,
    octaves: 1,
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

  const availableKeys: { label: string; value: string }[] = [
    { label: "C", value: "C" },
    { label: "Db", value: "Db" },
    { label: "D", value: "D" },
    { label: "Eb", value: "Eb" },
    { label: "E", value: "E" },
    { label: "F", value: "F" },
    { label: "Gb", value: "Gb" },
    { label: "G", value: "G" },
    { label: "Ab", value: "Ab" },
    { label: "A", value: "A" },
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

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <ScrollView>
          <ThemedText type="title" style={styles.title}>
            Tonal Flow
          </ThemedText>

          <View style={styles.optionsContainer}>
            <CustomDropdown
              data={availableKeys}
              onChange={(item) => setKey(item.value)}
              value={key}
              style={styles.option}
            />

            <CustomDropdown
              data={availableModes}
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
});
