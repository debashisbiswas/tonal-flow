import { Key, Note, Scale, Range } from "tonal";
import { MusicXML } from "./musicxml";

const Modes = ["major", "minor", "harmonic minor", "melodic minor"] as const;

export type Mode = (typeof Modes)[number];
export type Rhythm = "quarter" | "eighth" | "sixteenth";
export type RhythmPattern =
  | "long octave"
  | "sixteenths"
  | "eighth two sixteenths";

export type SlurPattern =
  // twos
  | "slur two tongue two"
  | "tongue two slur two"
  | "slur two slur two"
  | "tongue one slur two tongue one"

  // threes
  | "tongue one slur three"
  | "slur three tongue one"

  // fours
  | "tongued"
  | "slur four";

interface TimeSignature {
  top: number;
  bottom: number;
}

export const getNotesForScale = (
  key: string,
  mode: Mode,
  startOctave: number,
  octaves: number,
  overshootOctave = false,
) => {
  const fullName = `${key}${startOctave} ${mode}`;
  const scaleSteps = Scale.steps(fullName);

  const startNote = 0;
  const endNote = 7 * octaves + (overshootOctave ? 1 : 0);

  // Ascending notes include the octave, so remove it when descending.
  const ascendingNotes = Range.numeric([startNote, endNote]).map(scaleSteps);
  const descendingNotes =
    mode === "melodic minor"
      ? Range.numeric([endNote, startNote])
          .map(Scale.steps(`${key}${startOctave} minor`))
          .slice(1)
      : ascendingNotes.toReversed().slice(1);

  return ascendingNotes
    .concat(descendingNotes)
    .filter((note) => note != null)
    .map(Note.get);
};

export const applyRhythmPattern = (
  notes: ReturnType<typeof Note.get>[],
  pattern: RhythmPattern,
) => {
  const result = [];

  for (const [i, note] of notes.entries()) {
    const duration = (() => {
      if (pattern === "long octave") {
        if (i % 7 === 0) {
          return MusicXML.Divisions.eighth;
        } else {
          return MusicXML.Divisions["16th"];
        }
      } else if (pattern === "sixteenths") {
        return MusicXML.Divisions["16th"];
      } else if (pattern === "eighth two sixteenths") {
        if (i % 3 === 0) {
          return MusicXML.Divisions.eighth;
        } else {
          return MusicXML.Divisions["16th"];
        }
      } else {
        const _never: never = pattern;
        throw new Error(`Unexpected rhythm pattern: ${_never}`);
      }
    })();

    result.push({ note, duration });
  }

  return result;
};

function getSlurType(
  slurPattern: SlurPattern,
  timeAccumulator: number,
): MusicXML.MeasureNote["slurState"] {
  const currentSixteenth = timeAccumulator % 4;

  switch (slurPattern) {
    case "slur two tongue two":
      if (currentSixteenth === 0) return "start";
      if (currentSixteenth === 1) return "stop";
      break;

    case "tongue two slur two":
      if (currentSixteenth === 2) return "start";
      if (currentSixteenth === 3) return "stop";
      break;

    case "slur two slur two":
      if (currentSixteenth === 0 || currentSixteenth === 2) return "start";
      if (currentSixteenth === 1 || currentSixteenth === 3) return "stop";
      break;

    case "tongue one slur two tongue one":
      if (currentSixteenth === 1) return "start";
      if (currentSixteenth === 2) return "stop";
      break;

    case "slur three tongue one":
      if (currentSixteenth === 0) return "start";
      if (currentSixteenth === 2) return "stop";
      break;

    case "tongue one slur three":
      if (currentSixteenth === 1) return "start";
      if (currentSixteenth === 3) return "stop";
      break;

    case "slur four":
      if (currentSixteenth === 0) return "start";
      if (currentSixteenth === 3) return "stop";
      break;

    case "tongued":
      break;

    default:
      const _never: never = slurPattern;
      throw new Error(`Unexpected slur pattern: ${_never}`);
  }
}

function narrowAlter(alt: number) {
  return alt === 1 || alt === -1 ? alt : undefined;
}

export function generateMusicXMLForScale(opts: {
  key: string;
  mode: Mode;
  rhythm: RhythmPattern;
  slurPattern: SlurPattern;
  octaves: number;
  startOctave: number;
}) {
  const notes = getNotesForScale(
    opts.key,
    opts.mode,
    opts.startOctave,
    opts.octaves,
    opts.rhythm === "sixteenths" ||
      (opts.rhythm === "eighth two sixteenths" && opts.octaves === 1),
  );
  const notesWithRhythm = applyRhythmPattern(notes, opts.rhythm);

  const measures: MusicXML.Measure[] = [];
  let currentMeasure: MusicXML.Measure = { notes: [] };
  let timeAccumulator = 0;

  const timeSignatureTop = (() => {
    if (opts.rhythm === "eighth two sixteenths") {
      if (opts.octaves === 1) {
        return 6;
      } else if (opts.octaves === 2) {
        return 5;
      } else if (opts.octaves === 3) {
        return 7;
      }
    }
    return 4;
  })();

  const timeSignature: TimeSignature = {
    top: timeSignatureTop,
    bottom: 4,
  };

  const measureDuration = MusicXML.Divisions.quarter * timeSignature.top;

  for (const currentNote of notesWithRhythm) {
    const newNote = {
      pitch: {
        step: currentNote.note.letter,
        alter: narrowAlter(currentNote.note.alt),
        octave: currentNote.note.oct ?? 4,
      },
      duration: currentNote.duration,
    } as const;

    currentMeasure.notes.push(newNote);

    timeAccumulator += currentNote.duration;

    if (timeAccumulator >= measureDuration) {
      measures.push(currentMeasure);
      currentMeasure = { notes: [] };
      timeAccumulator = 0;
    }
  }

  if (currentMeasure.notes.length > 0) {
    const remainingDuration =
      measureDuration - MusicXML.getDuration(currentMeasure);

    if (remainingDuration === 3) {
      // 1 3 5 3 1
      const tonic = currentMeasure.notes[currentMeasure.notes.length - 1];
      const third = Note.get(
        Note.transpose(
          `${tonic.pitch.step}${tonic.pitch.octave}`,
          `3${getDescendingThirdModeLetter(opts.key, opts.mode)}`,
        ),
      );
      const fifth = Note.get(
        Note.transpose(`${tonic.pitch.step}${tonic.pitch.octave}`, "5P"),
      );

      currentMeasure.notes.push({
        pitch: {
          step: third.letter,
          alter: narrowAlter(third.alt),
          octave: third.oct ?? 4,
        },
        duration: MusicXML.Divisions["16th"],
      });

      currentMeasure.notes.push({
        pitch: {
          step: fifth.letter,
          alter: narrowAlter(fifth.alt),
          octave: fifth.oct ?? 4,
        },
        duration: MusicXML.Divisions["16th"],
      });

      currentMeasure.notes.push({
        pitch: {
          step: third.letter,
          alter: narrowAlter(third.alt),
          octave: third.oct ?? 4,
        },
        duration: MusicXML.Divisions["16th"],
      });

      measures.push(currentMeasure);
      // land on whole note tonic
      measures.push({
        notes: [{ ...tonic, duration: MusicXML.Divisions.whole }],
      });
    } else if (remainingDuration === 1) {
      const tonic = currentMeasure.notes[currentMeasure.notes.length - 1];
      const fifth = Note.get(
        Note.transpose(`${tonic.pitch.step}${tonic.pitch.octave}`, "5P"),
      );

      currentMeasure.notes.push({
        pitch: {
          step: fifth.letter,
          alter: narrowAlter(fifth.alt),
          octave: fifth.oct ?? 4,
        },
        duration: MusicXML.Divisions["16th"],
      });

      measures.push(currentMeasure);
      // land on whole note tonic
      measures.push({
        notes: [{ ...tonic, duration: MusicXML.Divisions.whole }],
      });
    } else if (currentMeasure.notes.length === 1) {
      // Extend the last note
      const lastNote = currentMeasure.notes[0];
      lastNote.duration = MusicXML.Divisions.whole;
      measures.push(currentMeasure);
    } else if (currentMeasure.notes.length > 2) {
      // if the last note is longer than the (worst case: eighth) we would have landed on...
      const tonic = currentMeasure.notes[currentMeasure.notes.length - 1];

      // pad out the last measure
      while (MusicXML.getDuration(currentMeasure) < measureDuration) {
        currentMeasure.notes.push({
          ...tonic,
          duration: MusicXML.Divisions["16th"],
        });
      }

      measures.push(currentMeasure);
      // land on whole note tonic
      measures.push({
        notes: [{ ...tonic, duration: MusicXML.Divisions.whole }],
      });
    }
  }

  for (const measure of measures) {
    let timeAccumulator = 0;
    for (const note of measure.notes) {
      if (note.duration !== MusicXML.Divisions.whole) {
        const slurState = getSlurType(opts.slurPattern, timeAccumulator);
        note.slurState = slurState;
      }

      timeAccumulator += note.duration;
    }
  }

  if (measures.length > 0) {
    const key = getKeyWithMode(opts.key, opts.mode);

    // Add attributes to first measure
    const trebleClef = { sign: "G", line: 2 };
    measures[0].attributes = {
      key: { fifths: key.alteration },
      time: {
        beats: timeSignature.top,
        beatType: timeSignature.bottom,
      },
      clef: trebleClef,
    };

    // Double bar last measure
    measures[measures.length - 1].doubleBar = true;
  }

  const xml = MusicXML.generateMusicXML(measures);
  return xml;
}

const getKeyWithMode = (key: string, mode: Mode) => {
  if (mode === "major") {
    return Key.majorKey(key);
  } else if (
    mode === "minor" ||
    mode === "harmonic minor" ||
    mode === "melodic minor"
  ) {
    return Key.minorKey(key);
  } else {
    const _never: never = mode;
    throw new Error(`Unexpected mode: ${_never}`);
  }
};

const getDescendingThirdModeLetter = (key: string, mode: Mode) => {
  if (mode === "major") {
    return "M";
  } else if (
    mode === "minor" ||
    mode === "harmonic minor" ||
    mode === "melodic minor"
  ) {
    return "m";
  } else {
    const _never: never = mode;
    throw new Error(`Unexpected mode: ${_never}`);
  }
};

export const getAvailableModes = (forKey: string): Mode[] => {
  return Modes.filter((mode) => {
    const key = getKeyWithMode(forKey, mode);
    return Math.abs(key.alteration) <= 7;
  });
};
