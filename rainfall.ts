// Count the number of water blocks trapped in the given terrain after rain.
// -- rainfall :: [Int] -> Int
// -- rainfall xs = sum (zipWith (-) mins xs)
// --     where mins = zipWith min maxl maxr
// --           maxl = scanl1 max xs
// --           maxr = scanr1 max xs

import {
  zipWith,
  scanLeft,
  head,
  tail,
  init,
  last,
  scanRight,
  reduce,
} from "fp-ts/lib/Array";
import { pipe, flip } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import * as O from "fp-ts/lib/Option";
import { max, min, ordNumber } from "fp-ts/lib/Ord";

//scanLeft: <A, B>(b: B, f: (b: B, a: A) => B) => (as: A[]) => B[]
// const ch = <A, B>(ma: O.Option<A>, f: (a: A) => O.Option<B>) => O.chain(f)(ma);
// const mp = <A, B>(fa: O.Option<A>, f: (a: A) => B) => O.map(f)(fa);
// ch(head(array), (x) =>
//   mp(tail(array), (xs) =>
//     (scanType == "left" ? scanLeft(x, func) : scanRight(x, func))(xs)
//   )
// );

// TIL: There are two "chain" functions on monads. One in the monad instance itself
// (which is used in the do notation nested example) and one in the module of the type.
// They have different signatures. Above is my misguided attempt to recreate the chain
// and map functions I wanted instead of using the correct ones.

const sum: (fa: number[]) => number = reduce(0, (a, b: number) => a + b);

type ScanDirection = "left" | "right";

const scan1 = (scanDirection: ScanDirection) => <A>(
  func: (a: A, b: A) => A
) => (array: A[]): A[] => {
  let ans: O.Option<A[]>;
  switch (scanDirection) {
    case "left":
      ans = Do(O.option)
        .bind("x", head(array))
        .bind("xs", tail(array))
        .return(({ x, xs }) => scanLeft(x, func)(xs));
      break;
    case "right":
      ans = Do(O.option)
        .bind("xs", init(array))
        .bind("x", last(array))
        .return(({ xs, x }) => scanRight(x, flip(func))(xs));
      break;
  }
  return O.fold(
    () => [],
    (ans: A[]) => ans
  )(ans);
};

const rainfall = (xs: number[]): number => {
  let maxl = scan1("left")(max(ordNumber))(xs);
  let maxr = scan1("right")(max(ordNumber))(xs);
  let mins = zipWith(maxl, maxr, min(ordNumber));
  return sum(zipWith(mins, xs, (a: number, b: number) => a - b));
};

console.log(rainfall(JSON.parse(process.argv[2])));
