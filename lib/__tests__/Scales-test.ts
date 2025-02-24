import { getNotesForScale } from "../Scales";

it(`gets notes for C major scale`, () => {
  const notes = getNotesForScale("C", "major", 4, 1);

  expect(notes).toEqual([
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "B4",
    "A4",
    "G4",
    "F4",
    "E4",
    "D4",
    "C4",
  ]);
});

it(`gets multiple octaves`, () => {
  const notes = getNotesForScale("A", "minor", 4, 2);

  expect(notes).toEqual([
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
    "C6",
    "D6",
    "E6",
    "F6",
    "G6",
    "A6",
    "G6",
    "F6",
    "E6",
    "D6",
    "C6",
    "B5",
    "A5",
    "G5",
    "F5",
    "E5",
    "D5",
    "C5",
    "B4",
    "A4",
  ]);
});

it(`correctly spells melodic minor`, () => {
  const notes = getNotesForScale("C", "melodic minor", 4, 1);

  expect(notes).toEqual([
    "C4",
    "D4",
    "Eb4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "Bb4",
    "Ab4",
    "G4",
    "F4",
    "Eb4",
    "D4",
    "C4",
  ]);
});
