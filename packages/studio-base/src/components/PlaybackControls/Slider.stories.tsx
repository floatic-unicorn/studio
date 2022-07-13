// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { styled as muiStyled } from "@mui/material";
import { Box } from "@mui/system";
import { Story } from "@storybook/react";
import { useState } from "react";

import Slider from "./Slider";

const StyledRange = muiStyled("div")`
  background-color: ${({ theme }) => theme.palette.info.dark};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  height: 20%;
  left: 0;
  position: absolute;
`;

const StyledMarker = muiStyled("div")`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid;
  border-color: ${({ theme }) => theme.palette.text.primary};
  height: 150%;
  position: absolute;
  top: -25%;
  width: 6px;
`;

export default {
  title: "components/PlaybackControls/Slider",
};

export const Examples: Story = () => {
  const [value, setValue] = useState(50);
  const [draggableValue, setDraggableValue] = useState(25);
  return (
    <Box padding={4}>
      <p>standard (clickable)</p>
      <Box bgcolor="error.light" height={30} width={300}>
        <Slider min={10} max={200} onChange={(v) => setValue(v)} value={value} />
      </Box>
      <p>disabled (not clickable)</p>
      <Box bgcolor="error.light" height={30} width={300}>
        <Slider disabled min={10} max={200} onChange={(v) => setValue(v)} value={value} />
      </Box>
      <p>no value</p>
      <Box bgcolor="error.light" height={30} width={300}>
        <Slider
          min={10}
          max={200}
          onChange={() => {
            // no-op
          }}
          value={undefined}
        />
      </Box>
      <p>draggable</p>
      <Box bgcolor="info.main" height={20} width={500}>
        <Slider min={10} max={200} onChange={(v) => setDraggableValue(v)} value={draggableValue} />
      </Box>
    </Box>
  );
};

export const CustomRenderer: Story = () => {
  const [draggableValue, setDraggableValue] = useState(25);

  return (
    <Box padding={4}>
      <p>Customize slider UI using renderSlider</p>
      <Box bgcolor="info.main" height={20} width={500}>
        <Slider
          min={10}
          max={200}
          onChange={(v) => setDraggableValue(v)}
          value={draggableValue}
          renderSlider={(width) => (
            <>
              <StyledRange style={{ width: `${(width ?? 0) * 100}%` }} />
              <StyledMarker style={{ left: `${(width ?? 0) * 100}%` }} />
            </>
          )}
        />
      </Box>
    </Box>
  );
};
