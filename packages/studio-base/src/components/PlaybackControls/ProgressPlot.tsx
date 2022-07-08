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
import { styled, useTheme } from "@mui/material";
import { complement } from "intervals-fn";
import { useMemo } from "react";

import { Range } from "@foxglove/studio-base/util/ranges";

const BAR_HEIGHT = 28;

type ProgressProps = {
  availableRanges?: Range[];
};

/*
const animatedBackground = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 18px 0;
  }
`;
*/

const AnimatedProgress = styled("div")(({ theme }) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  //animation: `${animatedBackground} 1s linear infinite`,
  backgroundRepeat: "repeat-x",
  backgroundSize: "100vw 100%",
  backgroundColor: theme.palette.grey[400],
  backgroundImage: `repeating-linear-gradient(${[
    "90deg",
    `${theme.palette.grey[300]}`,
    `${theme.palette.grey[300]} 3px`,
    `transparent 3px`,
    `transparent 9px`,
  ].join(",")})`,
}));

export function ProgressPlot(props: ProgressProps): JSX.Element {
  const { availableRanges } = props;
  const theme = useTheme();

  const ranges = useMemo(() => {
    if (!availableRanges) {
      return <></>;
    }

    const mergedRanges = complement({ start: 0, end: 1 }, availableRanges);

    return mergedRanges.map((range, idx) => {
      const width = range.end - range.start;
      if (width === 0) {
        return <></>;
      }

      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            backgroundColor: theme.palette.grey[600],
            left: `${range.start}%`,
            width: `${width}%`,
            height: "100%",
          }}
        />
      );
    });
  }, [availableRanges, theme.palette.grey]);

  return <div style={{ position: "relative", height: BAR_HEIGHT }}>{ranges}</div>;
}
