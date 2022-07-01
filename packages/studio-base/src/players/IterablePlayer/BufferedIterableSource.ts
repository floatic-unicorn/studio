// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { sortedIndexBy } from "lodash";

import { signal, Signal } from "@foxglove/den/async";
import Log from "@foxglove/log";
import { subtract, add as addTime, Time, toNanoSec, compare } from "@foxglove/rostime";
import { Range } from "@foxglove/studio-base/util/ranges";

import {
  IIterableSource,
  Initalization,
  IteratorResult,
  MessageIteratorArgs,
} from "./IIterableSource";

const log = Log.getLogger(__filename);

class BufferedIterableSource {
  private source: IIterableSource;

  private readDone = false;
  private aborted = false;

  private readSignal?: Signal<void>;
  private writeSignal?: Signal<void>;

  // message records in a continuous array
  // fixme - this should only have successful message events?
  // what do we do with problems?
  private iteratorResults: IteratorResult[] = [];

  private active = false;

  private activeLoader?: Promise<void>;

  private initResult?: Initalization;

  private readUntil: Time = { sec: 0, nsec: 0 };

  constructor(source: IIterableSource) {
    this.source = source;
  }

  async initialize(): Promise<Initalization> {
    this.initResult = await this.source.initialize();

    // fixme - get the block load duration so we can use it as the _end_ time for our source iterators
    // we don't want to make iterators for the whole source since that will send more data than we need to buffer
    // maybe not - the source handles these request durations for us behind the scenes...

    return this.initResult;
  }

  // fixme - cache the range result
  loadedRanges(): Range[] {
    const firstTime = this.iteratorResults[0]?.msgEvent?.receiveTime;
    const lastTime = this.iteratorResults[this.iteratorResults.length - 1]?.msgEvent?.receiveTime;
    if (!firstTime || !lastTime || !this.initResult) {
      return [{ start: 0, end: 0 }];
    }

    const rangeNs = Number(toNanoSec(subtract(this.initResult.end, this.initResult.start)));
    if (rangeNs === 0) {
      return [{ start: 0, end: 0 }];
    }

    const start = Number(toNanoSec(subtract(firstTime, this.initResult.start))) / rangeNs;
    const end = Number(toNanoSec(subtract(lastTime, this.initResult.start))) / rangeNs;

    return [{ start, end }];
  }

  async start(args: MessageIteratorArgs): Promise<void> {
    log.debug("buffering started");

    try {
      this.readDone = false;

      // fixme - do not clear iteratorResults
      //this.iteratorResults = [];

      // where is the read cursor?

      let startReadTime = args.start;

      {
        const lastResult = this.iteratorResults[this.iteratorResults.length - 1];
        // fixme - this technically has us re-read the same time
        if (lastResult?.msgEvent) {
          startReadTime = lastResult.msgEvent.receiveTime;
        }

        console.log("start read time", startReadTime);
      }

      // fixme - if we are before the first message time, then we only need to read up to that time

      // fixme - should only make this when we need to read past the last receive time and readUntil
      const sourceIterator = this.source.messageIterator({
        topics: args.topics,
        start: startReadTime,
      });

      for (;;) {
        if (this.aborted) {
          break;
        }

        const lastResult = this.iteratorResults[this.iteratorResults.length - 1];

        // If the last message we have has a receive time after readUntil, then there's no reading for us to do
        // We wait until the readUntil moved forward
        if (lastResult?.msgEvent && compare(lastResult.msgEvent.receiveTime, this.readUntil) >= 0) {
          this.writeSignal = signal();
          await this.writeSignal;
          this.writeSignal = undefined;

          continue;
        }

        const result = await sourceIterator.next();
        if (result.done === true) {
          break;
        }

        this.iteratorResults.push(result.value);

        this.readSignal?.resolve();

        // If there's no msgEvent or if the receive time is before our readUntil, keep reading
        if (
          !result.value.msgEvent ||
          compare(result.value.msgEvent.receiveTime, this.readUntil) < 0
        ) {
          continue;
        }

        this.writeSignal = signal();
        await this.writeSignal;
        this.writeSignal = undefined;
      }

      await sourceIterator.return?.();
    } finally {
      this.readDone = true;
      this.readSignal?.resolve();
    }

    log.debug("buffering done");
  }

  async stop(): Promise<void> {
    this.aborted = true;
    this.writeSignal?.resolve();
    await this.activeLoader;
  }

  messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    if (!this.initResult) {
      throw new Error("Invariant: uninitialized");
    }

    if (this.active) {
      throw new Error("Invariant: BufferedIterableSource allows only one messageIterator");
    }

    const start = args.start ?? this.initResult.start;

    this.readUntil = addTime(start, { sec: 5, nsec: 0 });

    this.aborted = false;
    this.activeLoader = this.start(args);

    // binary search with a value and function to compare the value with the item values
    const res: IteratorResult = {
      connectionId: undefined,
      problem: undefined,
      msgEvent: {
        topic: "",
        receiveTime: start,
        message: undefined,
        sizeInBytes: 0,
      },
    };

    console.log("first time", this.iteratorResults[0]?.msgEvent?.receiveTime);
    console.log(
      "last time",
      this.iteratorResults[this.iteratorResults.length - 1]?.msgEvent?.receiveTime,
    );

    let readIdx = sortedIndexBy(this.iteratorResults, res, (result) =>
      toNanoSec(result.msgEvent?.receiveTime),
    );
    console.log("starting read at index", readIdx);

    // Need to alias this for the generator function
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return (async function* bufferedIterableGenerator() {
      self.active = true;

      try {
        for (;;) {
          const result = self.iteratorResults[readIdx];
          // signal the writer we've consumed
          self.writeSignal?.resolve();

          if (!result) {
            // If no result and reading is done then we won't be getting any more results
            if (self.readDone) {
              break;
            }

            self.readSignal = signal();
            await self.readSignal;
            self.readSignal = undefined;
            continue;
          }

          if (result.msgEvent) {
            self.readUntil = addTime(result.msgEvent.receiveTime, { sec: 5, nsec: 0 });
          }

          readIdx += 1;
          yield result;
        }
      } finally {
        log.debug("ending buffered message iterator");
        self.active = false;
        await self.stop();
      }
    })();
  }
}

export { BufferedIterableSource };
