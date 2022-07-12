// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Story } from "@storybook/react";

import { ProgressPlot } from "./ProgressPlot";

export default {
  title: "components/PlaybackControls/ProgressPlot",
  component: ProgressPlot,
};

export const DisjointRanges: Story = () => {
  return (
    <div style={{ width: "200px", height: "40px" }}>
      <ProgressPlot
        loading={false}
        availableRanges={[
          { start: 0, end: 0.2 },
          { start: 0.8, end: 1 },
        ]}
      />
    </div>
  );
};

export const Loading: Story = () => {
  return (
    <div style={{ width: "200px", height: "40px" }}>
      <ProgressPlot
        loading={true}
        availableRanges={[
          { start: 0, end: 0.2 },
          { start: 0.8, end: 1 },
        ]}
      />
    </div>
  );
};
