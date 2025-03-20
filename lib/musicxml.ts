export namespace MusicXML {
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

  const _quarterNoteDivision = 4;
  export const Divisions = {
    "16th": _quarterNoteDivision / 4,
    eighth: _quarterNoteDivision / 2,
    quarter: _quarterNoteDivision,
    half: _quarterNoteDivision * 2,
    whole: _quarterNoteDivision * 4,
  } as const;

  export const getDuration = (measure: MusicXML.Measure) =>
    measure.notes.reduce((acc, note) => acc + note.duration, 0);

  const noteToMusicXML = (note: MeasureNote) => {
    const type = (() => {
      if (note.duration === Divisions["16th"]) {
        return "16th";
      } else if (note.duration === Divisions.eighth) {
        return "eighth";
      } else if (note.duration === Divisions.quarter) {
        return "quarter";
      } else if (note.duration === Divisions.half) {
        return "half";
      } else if (note.duration === Divisions.whole) {
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

  const attributesToMusicXML = (attributes: MeasureAttributes) => {
    return `
      <attributes>
        <divisions>${Divisions.quarter}</divisions>
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

  const measureToMusicXML = (measure: Measure) => {
    const doubleBarXML = `
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>
    `;

    const notesXML = measure.notes.map(noteToMusicXML).join("");

    return `
      <measure>
        ${measure.attributes ? attributesToMusicXML(measure.attributes) : ""}
        ${notesXML}
        ${measure.doubleBar ? doubleBarXML : ""}
      </measure>
    `;
  };

  export const generateMusicXML = (measures: Measure[]) => {
    const measuresXML = measures.map(measureToMusicXML);

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
  };
}
