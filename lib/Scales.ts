import { Key, Note, Scale, Range } from "tonal";
import { MusicXML } from "./musicxml";

export type Mode = "major" | "minor" | "harmonic minor" | "melodic minor";
export type Rhythm = "quarter" | "eighth" | "sixteenth";
export type RhythmPattern =
  | "long octave"
  | "sixteenths"
  | "eighth two sixteenths";

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

export function generateMusicXMLForScale(opts: {
  key: string;
  mode: Mode;
  rhythm: RhythmPattern;
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
        alter: currentNote.note.alt
          ? 1
          : currentNote.note.alt === -1
            ? -1
            : undefined,
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
    // if the last note is longer than the (worst case: eighth) we would have landed on...
    if (currentMeasure.notes.length > 2) {
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
      // TODO handle 6/4
      measures.push({
        notes: [{ ...tonic, duration: MusicXML.Divisions.whole }],
      });
    }

    if (currentMeasure.notes.length === 1) {
      // Extend the last note
      const lastNote = currentMeasure.notes[0];
      lastNote.duration = MusicXML.Divisions.whole;
      measures.push(currentMeasure);
    }
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
