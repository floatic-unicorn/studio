// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@foxglove/rostime";
import { MessageEvent } from "@foxglove/studio";

import { IIterableSource, IteratorResult, MessageIteratorArgs } from "./IIterableSource";

// Range means we know we have all the topics from [start, end]
/// [       ][       ]
/// [A][A]   [A]   [A]
/// [B][B][B][B][B][B]
///          [C][C][C]

/// We go to read this range and realize we are missing [C]
/// We need to make an iterator to read [C] just for this range

/// MERGE: when two ranges have the same topics, we can consider them one?
/// Why bother? Means we need to merge arrays
/// Merging a range is bad because we can't partially load topics into it. Lets say we need to
/// subscribe to a new topic and during buffering we stop part-way through a blockrange. we lose what we fetched

/// Without fixed-size blocks we don't know if there is a gap in our messages
///

/// separate ranges per topic. Period is seek head
///     .
/// A: [      ]
/// B: [      ]
/// C: [      ]

/// After ^ has been buffered
/// Now we seek to some new place and start buffering messages for our topics
///                 .
/// A: [      ]    [    ]
/// B: [      ]    [    ]
/// C: [      ]    [    ]

/// Now we add a new topic D
/// D is missing from our buffer so we need to fetch only D
/// But we also want to buffer more data so once we've loaded D some, we need to make "yet another iterator"
/// To start reading all the topics again. Because we don't maintain separate iterators per topic stream?
///                 .
/// A: [      ]    [    ]
/// B: [      ]    [    ]
/// C: [      ]    [    ]
/// D:             [  ]

/// While D was loading we seek again so D ends up having only some data loaded?
///                    .
/// A: [      ]    [    ][  ]
/// B: [      ]    [    ][  ]
/// C: [      ]    [    ][  ]
/// D:             [  ][    ]

/// So now we need to fetch D for a tiny bit and then start fetching our other topics

type TopicCacheNode = {
  start: Time;
  end: Time;

  next?: TopicCacheNode;

  messages: MessageEvent<unknown>[];
};

// what if we treat each topic as a separate iterator?
// ignore the downside for local files for now
// reading the overall messages means looping through all the topic caches
// asking it for the next message time
// tracking the lowest message time cache
// and repeating this over and over? that feels not so good to loop all the topic caches each message read
// but we don't have an index... so we must?

class TopicCache {}

class CachingIterableSource {
  private source: IIterableSource;

  private topicCaches: Record<string, TopicCache>;

  private topicCursors = new Heap<TopicCursor>();

  constructor(source: IIterableSource) {
    this.source = source;
  }

  messageIterator(args: MessageIteratorArgs): AsyncIterator<Readonly<IteratorResult>> {
    //

    // loop all the topic caches
    // get iterators at our args.start
    // populate these into the topicCursors heap
    // when do we wait on the next message of each?

    // loop all the topic caches
    // heap of topic cursors
    // peek to get the latest one
    // pop the latest cursor and read the message
    // replace it
    // this way we will constantly be reading the latest messages across all our topic cursors
    //

    // this iterator returns messages only from the proxy reader
    // the proxy reader make iterators for the underlying data source

    // To achieve fast time-to-first-message, we cache topics into _ranges_ of continuous message data.
    // Each range is inclusive of the start and end time

    // Make a cursor over the blocks
    // The cursor is what advances when we have more messages to read

    const sourceIterator = this.source.messageIterator(args);

    sourceIterator.next();

    // sourceIterator.return();

    try {
    } finally {
    }
  }
}

export { CachingIterableSource };
