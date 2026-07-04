import { render } from "@testing-library/react-native";

import { BalanceSkeleton } from "./BalanceSkeleton";

describe("BalanceSkeleton", () => {
  it("renderiza el layout de skeleton", async () => {
    const { toJSON } = await render(<BalanceSkeleton />);
    expect(toJSON()).toMatchSnapshot();
  });
});
