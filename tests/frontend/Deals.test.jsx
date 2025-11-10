import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Deals from "../../frontend/src/components/pages/Deals.jsx";

// Mock useDeals hook
jest.mock("../../frontend/hooks/useDeals.jsx", () => ({
  __esModule: true,
  default: () => ({
    deals: [
      { id: 1, name: "Deal A", stage: "Negotiation" },
      { id: 2, name: "Deal B", stage: "Proposal" },
    ],
  }),
}));

test("renders Deals page correctly", () => {
  render(<Deals />);
  expect(screen.getByText(/deal a/i)).toBeInTheDocument();
  expect(screen.getByText(/deal b/i)).toBeInTheDocument();
});
