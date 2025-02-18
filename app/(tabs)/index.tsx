import { WebView } from "react-native-webview";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";

import { Key, Note, Scale } from "tonal";
import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";

// Divisions per quarter note
const divisionCount = 4;

interface MeasureNote {
  pitch: {
    step: string;
    alter?: -1 | 1;
    octave: number;
  };

  /**
   * Duration of the note in beats. Relative to the divisions, which represents
   * the division of a quarter note.
   */
  duration: 1 | 2 | 4 | 8 | 16;

  beam?: {
    /**
     * Indicates eighth note through 1024th note beams using number values 1
     * thru 8 respectively. The default value is 1.
     */
    beamLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    value: "begin" | "continue" | "end";
  };
}

interface MeasureAttributes {
  key?: {
    fifths: number;
  };
  time?: {
    beats: number;
    beatType: number;
  };
  clef?: {
    sign: string;
    line: number;
  };
}

interface Measure {
  attributes?: MeasureAttributes;
  notes: MeasureNote[];
  doubleBar?: boolean;
}

type Mode = "major" | "minor" | "harmonic minor" | "melodic minor";

type Rhythm = "quarter" | "eighth" | "sixteenth";

function generateMusicXMLForScale(opts: {
  key: string;
  mode: Mode;
  rhythm: Rhythm;
  octaves: number;
}) {
  const note = (note: MeasureNote) => {
    const type = (() => {
      if (note.duration === 1) {
        return "16th";
      } else if (note.duration === 2) {
        return "eighth";
      } else if (note.duration === 4) {
        return "quarter";
      } else if (note.duration === 8) {
        return "half";
      } else if (note.duration === 16) {
        return "whole";
      } else {
        const _never: never = note.duration;
        throw new Error(`Unexpected duration: ${_never}`);
      }
    })();

    const beam = note.beam
      ? `<beam number="${note.beam.beamLevel ?? 1}">${note.beam.value}</beam>`
      : "";

    return `
      <note>
        <pitch>
          <step>${note.pitch.step}</step>j
          <alter>${note.pitch.alter ? note.pitch.alter : ""}</alter>
          <octave>${note.pitch.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${type}</type>
        ${beam}
      </note>
    `;
  };

  const attributes = (attributes: MeasureAttributes) => {
    return `
      <attributes>
        <divisions>${divisionCount}</divisions>
        ${attributes.key?.fifths ? `<key><fifths>${attributes.key.fifths}</fifths></key>` : ""}
        <time>
          <beats>${attributes.time?.beats}</beats>
          <beat-type>${attributes.time?.beatType}</beat-type>
        </time>
        <clef>
          <sign>${attributes.clef?.sign}</sign>
          <line>${attributes.clef?.line}</line>
        </clef>
      </attributes>
    `;
  };

  const measure = (measure: Measure) => {
    const doubleBarXML = `
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>
    `;

    const notesXML = measure.notes.map(note).join("");

    return `
      <measure>
        ${measure.attributes ? attributes(measure.attributes) : ""}
        ${notesXML}
        ${measure.doubleBar ? doubleBarXML : ""}
      </measure>
    `;
  };

  const scaleDegrees = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0, 0];
  const scaleName = `${opts.key}4 ${opts.mode}`;
  const names = scaleDegrees.map(Scale.steps(scaleName));
  const notes = names.map((note) => Note.get(note));

  const measures = [];
  let currentMeasure: Measure = { notes: [] };
  let timeAccumulator = 0;
  let startBeam = true;

  for (let i = 0; i < notes.length; i++) {
    const currentNote = notes[i];
    const duration = (() => {
      if (opts.rhythm === "quarter") {
        return 4;
      } else if (opts.rhythm === "eighth") {
        return 2;
      } else if (opts.rhythm === "sixteenth") {
        return 1;
      } else {
        const _never: never = opts.rhythm;
        throw new Error(`Unexpected rhythm: ${_never}`);
      }
    })();

    const newNote = {
      pitch: {
        step: currentNote.letter,
        alter:
          currentNote.alt === 1 ? 1 : currentNote.alt === -1 ? -1 : undefined,
        octave: currentNote.oct ?? 4,
      },
      duration,
      beam: {
        value: startBeam ? "begin" : "continue",
      },
    } as const;

    currentMeasure.notes.push(newNote);

    timeAccumulator += duration;

    if (!(timeAccumulator % 4)) {
      const lastNote = currentMeasure.notes.at(-1);
      if (lastNote && lastNote.beam) {
        lastNote.beam.value = "end";
      }
      startBeam = true;
    }

    if (timeAccumulator >= divisionCount * 4) {
      measures.push(currentMeasure);
      currentMeasure = { notes: [] };
      timeAccumulator = 0;
    }
  }

  if (currentMeasure.notes.length > 0) {
    measures.push(currentMeasure);
  }

  if (measures.length > 0) {
    const key = (() => {
      if (opts.mode === "major") {
        return Key.majorKey(opts.key);
      } else if (
        opts.mode === "minor" ||
        opts.mode === "harmonic minor" ||
        opts.mode === "melodic minor"
      ) {
        return Key.minorKey(opts.key);
      } else {
        const _never: never = opts.mode;
        throw new Error(`Unexpected mode: ${_never}`);
      }
    })();

    measures[0].attributes = {
      key: { fifths: key.alteration },
      time: { beats: 4, beatType: 4 },
      clef: { sign: "G", line: 2 },
    };

    measures[measures.length - 1].doubleBar = true;
  }

  const measuresXML = measures.map(measure).join("");

  const xml = `
    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="4.0">
      <part-list>
        <score-part id="P1">
          <part-name>Music</part-name>
        </score-part>
      </part-list>
      <part id="P1">
        ${measuresXML}
      </part>
    </score-partwise>
  `;

  return xml;
}

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
  const [rhythm, setRhythm] = useState<Rhythm>("eighth");

  const xml = generateMusicXMLForScale({
    key,
    mode,
    rhythm,
    octaves: 2,
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

  const availableRhythms: { label: string; value: Rhythm }[] = [
    { label: "Quarters", value: "quarter" },
    { label: "Eighths", value: "eighth" },
    { label: "Sixteenths", value: "sixteenth" },
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
