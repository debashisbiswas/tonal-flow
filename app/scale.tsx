import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { generateMusicXMLForScale } from "@/lib/Scales";
import { useScaleOptions } from "@/lib/ScaleContext";
import { Ionicons } from "@expo/vector-icons";
import { MusicXMLViewer } from "@/components/MusicXMLViewer";

export default function MusicNotationScreen() {
  const { options } = useScaleOptions();
  const { key, mode, rhythm, slurPattern, octaves, startOctave } = options;

  const xml = generateMusicXMLForScale({
    key,
    mode,
    rhythm,
    slurPattern,
    octaves,
    startOctave,
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <MusicXMLViewer musicXML={xml} style={styles.webview} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: "#0a7ea4",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
