import { Key, Note, Scale, Range } from "tonal";

const _quarterNoteDivision = 4;
const divisions = {
  "16th": _quarterNoteDivision / 4,
  eighth: _quarterNoteDivision / 2,
  quarter: _quarterNoteDivision,
  half: _quarterNoteDivision * 2,
  whole: _quarterNoteDivision * 4,
} as const;

export type Mode = "major" | "minor" | "harmonic minor" | "melodic minor";

export type Rhythm = "quarter" | "eighth" | "sixteenth";

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

export type RhythmPattern =
  | "long octave"
  | "sixteenths"
  | "eighth two sixteenths";

export const applyRhythmPattern = (
  notes: ReturnType<typeof Note.get>[],
  pattern: RhythmPattern,
) => {
  const result = [];

  for (const [i, note] of notes.entries()) {
    const duration = (() => {
      if (pattern === "long octave") {
        if (i % 7 === 0) {
          return divisions.eighth;
        } else {
          return divisions["16th"];
        }
      } else if (pattern === "sixteenths") {
        return divisions["16th"];
      } else if (pattern === "eighth two sixteenths") {
        if (i % 3 === 0) {
          return divisions.eighth;
        } else {
          return divisions["16th"];
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

export interface MeasureNote {
  pitch: {
    step: string;
    alter?: -1 | 1;
    octave: number;
  };

  /**
   * Duration of the note in beats. Relative to the divisions, which represents
   * the division of a quarter note.
   */
  duration: number;
}

export interface MeasureAttributes {
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

export interface Measure {
  attributes?: MeasureAttributes;
  notes: MeasureNote[];
  doubleBar?: boolean;
}

export function generateMusicXMLForScale(opts: {
  key: string;
  mode: Mode;
  rhythm: RhythmPattern;
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
      }

      return "quarter";
    })();

    return `
      <note>
        <pitch>
          <step>${note.pitch.step}</step>j
          <alter>${note.pitch.alter ? note.pitch.alter : ""}</alter>
          <octave>${note.pitch.octave}</octave>
        </pitch>
        <duration>${note.duration}</duration>
        <type>${type}</type>
      </note>
    `;
  };

  const attributes = (attributes: MeasureAttributes) => {
    return `
      <attributes>
        <divisions>${divisions.quarter}</divisions>
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

  const getMeasureDuration = (measure: Measure) => {
    return measure.notes.reduce((acc, note) => acc + note.duration, 0);
  };

  const notes = getNotesForScale(
    opts.key,
    opts.mode,
    4,
    opts.octaves,
    opts.rhythm === "sixteenths" || opts.rhythm === "eighth two sixteenths",
  );
  const notesWithRhythm = applyRhythmPattern(notes, opts.rhythm);

  const measures: Measure[] = [];
  let currentMeasure: Measure = { notes: [] };
  let timeAccumulator = 0;

  const timeSignatureNumeralTop =
    opts.rhythm === "eighth two sixteenths" ? 6 : 4;
  const timeSignatureNumeralBottom = 4;

  const measureDuration = divisions.quarter * timeSignatureNumeralTop;

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

  console.log("==========");
  console.log(JSON.stringify(currentMeasure, null, 2));

  if (currentMeasure.notes.length > 0) {
    // if the last note is longer than the (worst case: eighth) we would have landed on...
    if (currentMeasure.notes.length > 2) {
      const tonic = currentMeasure.notes[currentMeasure.notes.length - 1];

      // pad out the last measure
      while (getMeasureDuration(currentMeasure) < measureDuration) {
        currentMeasure.notes.push({
          ...tonic,
          duration: divisions["16th"],
        });
      }

      measures.push(currentMeasure);
      // land on whole note tonic
      // TODO handle 6/4
      measures.push({ notes: [{ ...tonic, duration: divisions.whole }] });
    }

    if (currentMeasure.notes.length === 1) {
      // Extend the last note
      const lastNote = currentMeasure.notes[0];
      lastNote.duration = divisions.whole;
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

    measures[0].attributes = {
      key: { fifths: key.alteration },
      time: {
        beats: timeSignatureNumeralTop,
        beatType: timeSignatureNumeralBottom,
      },
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
