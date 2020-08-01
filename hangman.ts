// Recreating my older Haskell hangman (./hangman.hs) in fp-ts.

import * as I from "fp-ts/lib/IO";
import { IO } from "fp-ts/lib/IO";
import * as A from "fp-ts/lib/Array";
import {
  head,
  takeLeft,
  filter,
  init,
  replicate,
  cons,
  zipWith,
} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { pipe, Predicate } from "fp-ts/lib/function";
import { randomInt } from "fp-ts/lib/Random";
import { log } from "fp-ts/lib/Console";
import * as fs from "fs";
import readlineSync = require("readline-sync");

const allWords: IO<string[]> = () =>
  fs.readFileSync("./dict.txt").toString("utf-8").split("\n");

const testAllWords: IO<void> = pipe(
  allWords,
  I.map(takeLeft(10)),
  I.chain(log)
);

const minWordLength = 5;
const maxWordLength = 9;

const rightLength: Predicate<string> = (word) => {
  let length = word.length;
  return length >= minWordLength && length <= maxWordLength;
};

const gameWords: IO<string[]> = I.map(filter(rightLength))(allWords);

const testGameWords: IO<void> = pipe(
  gameWords,
  I.map(takeLeft(10)),
  I.chain(log)
);

const chooseRandomWord = (words: string[]) =>
  pipe(
    randomInt(0, words.length),
    I.map((index) => words[index])
  );

const randomWord: IO<string> = I.chain(chooseRandomWord)(gameWords);

type Puzzle = {
  word: string;
  discovered: Option<string>[];
  guessed: string[];
};

const intersperse = <A>(sep: A) => (xs: A[]): A[] =>
  pipe(
    xs,
    A.chain((a: A) => [a, sep]),
    init,
    O.fold(
      () => [],
      (ans) => ans
    )
  );

const showPuzzle = ({ word, discovered, guessed }: Puzzle): IO<void> =>
  log(
    "So far you know: " +
    pipe(
      discovered, // [some('a'), none, some('c')]
      A.map(
        O.fold(
          () => "_",
          (letter) => letter
        ) // ['a', '_', 'c']
      ),
      intersperse(" ") // ['a', ' ', '_', ' ', 'c']
    ).join("") + // "a _ c"
      "\nGuessed so far: " +
      guessed
  );

const freshPuzzle = (word: string): Puzzle => ({
  word,
  discovered: replicate(word.length, O.none),
  guessed: [],
});

const charInWord = ({ word }: Puzzle) => (char: string): boolean =>
  word.includes(char);

const alreadyGuessed = ({ guessed }: Puzzle) => (char: string) =>
  guessed.includes(char);

const zipper = (guess: string) => (
  wordChar: string,
  guessChar: Option<string>
): Option<string> => (wordChar === guess ? O.some(wordChar) : guessChar);

const fillInCharacter = ({ word, discovered, guessed }: Puzzle) => (
  char: string
) => ({
  word,
  discovered: zipWith(word.split(""), discovered, zipper(char)),
  guessed: cons(char, guessed),
});

const handleGuess = (puzzle: Puzzle) => (guess: string): IO<Puzzle> => () => {
  console.log("Your guess is: " + guess);
  if (alreadyGuessed(puzzle)(guess)) {
    console.log("Character already guessed... Try something else.");
    return puzzle;
  }
  if (charInWord(puzzle)(guess)) {
    console.log("Good guess! Filling accordingly.");
    return fillInCharacter(puzzle)(guess);
  }
  console.log("Nope, not in the word.");
  return fillInCharacter(puzzle)(guess);
};

const gameOver = ({ word, guessed }: Puzzle): IO<void> => () => {
  if (guessed.length > 17) {
    console.log("You Lose!\nThe word was: " + word);
    process.exit();
  }
};

const gameWin = ({ word, discovered }: Puzzle): IO<void> => () => {
  if (discovered.every(O.isSome)) {
    console.log("You win!!! the word was: " + word);
    process.exit();
  }
};

const runGame = (puzzle: Puzzle): IO<void> => () => {
  gameWin(puzzle)();
  gameOver(puzzle);
  showPuzzle(puzzle)();
  let guess = readlineSync.question("Guess a letter: ");
  pipe(
    guess.split(""),
    head,
    O.fold(
      () => I.chain(() => runGame(puzzle))(log("Invalid input.")),
      (char: string) => I.chain(runGame)(handleGuess(puzzle)(char))
    )
  )();
};

const main: IO<void> = pipe(
  randomWord,
  I.chain((word: string) => runGame(freshPuzzle(word)))
);

main();
