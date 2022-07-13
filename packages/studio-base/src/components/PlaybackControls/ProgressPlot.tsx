// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.
import { keyframes, styled as muiStyled } from "@mui/material";
import { simplify } from "intervals-fn";
import { useMemo } from "react";

import Stack from "@foxglove/studio-base/components/Stack";
import { Range } from "@foxglove/studio-base/util/ranges";

type ProgressProps = {
  loading: boolean;
  availableRanges?: Range[];
};

const STRIPE_WIDTH = 8;

const animatedBackground = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: ${STRIPE_WIDTH * 2}px 0; }
`;

const LoadingIndicator = muiStyled("div")(({ theme }) => ({
  label: "ProgressPlot-loadingIndicator",
  position: "absolute",
  width: "100%",
  height: "100%",
  animation: `${animatedBackground} 300ms linear infinite`,
  backgroundRepeat: "repeat-x",
  backgroundSize: `${STRIPE_WIDTH * 2}px 100%`,
  backgroundImage: `repeating-linear-gradient(${[
    "90deg",
    `${theme.palette.background.paper}`,
    `${theme.palette.background.paper} ${STRIPE_WIDTH / 2}px`,
    `transparent ${STRIPE_WIDTH / 2}px`,
    `transparent ${STRIPE_WIDTH}px`,
  ].join(",")})`,
}));

const Range = muiStyled("div")(({ theme }) => ({
  label: "ProgressPlot-range",
  position: "absolute",
  backgroundColor: theme.palette.text.secondary,
  height: "100%",
}));

export function ProgressPlot(props: ProgressProps): JSX.Element {
  const { availableRanges, loading } = props;

  const ranges = useMemo(() => {
    if (!availableRanges) {
      return <></>;
    }

    const mergedRanges = simplify(availableRanges);

    return mergedRanges.map((range, idx) => {
      const width = range.end - range.start;
      if (width === 0) {
        return <></>;
      }

      return (
        <Range key={idx} style={{ width: `${width * 100}%`, left: `${range.start * 100}%` }} />
      );
    });
  }, [availableRanges]);

  return (
    <Stack position="relative" fullHeight>
      {loading && <LoadingIndicator />}
      {ranges}
    </Stack>
  );
}
