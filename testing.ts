import { IO, io } from "fp-ts/lib/IO";
import { now } from "fp-ts/lib/Date";
import { log } from "fp-ts/lib/Console";
import { Do } from "fp-ts-contrib/lib/Do";

const fibonacci = (n: number): number =>
  n <= 1 ? 1 : fibonacci(n - 1) + fibonacci(n - 2);

export const time = <A>(ma: IO<A>) =>
  io.chain(now, (start) =>
    io.chain(ma, (a) =>
      io.chain(now, (end) =>
        io.map(log(`time elapsed: ${end - start}`), () => a)
      )
    )
  );

// Trying to recreate the above example with do-notation.
// This does not work though, probably because the bindings are lazy.
export const timeDo = <A>(effect: IO<A>) =>
  Do(io)
    .bind("start", now)
    .bind("result", effect)
    .bind("end", now)
    .doL(({ start, end }) => log(`timeDo elapsed: ${end - start}`))
    .return(({ result }) => result);

// time(log(fibonacci(40)))();
// timeDo(log(fibonacci(40)))();

const io1 = io.map(
  () => {
    console.log("starting fibonaccei on io1");
    let ans = fibonacci(40);
    console.log("ending fibonacci on io1");
    return ans;
  },
  () => 1
);

const io2 = io.map(
  () => {
    console.log("starting fibonaccei on io2");
    let ans = fibonacci(40);
    console.log("ending fibonacci on io2");
    return ans;
  },
  () => 2
);

const testing = Do(io)
  .bind("one", io1)
  .bind("two", io2)
  .do(log("after one and two"))
  .done();

io.chain(testing, log)();
