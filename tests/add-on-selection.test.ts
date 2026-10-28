import { test } from "bun:test";
import { buildCartAddOns } from "../src/utils/add-on-selection";
import type { POSProduct } from "../src/types/pos";

test("large add-on selections retain group and option order while ignoring stale IDs", () => {
  const groups = Array.from({ length: 25 }, (_, group) => ({
    id: `group-${group}`,
    name: `Group ${group}`,
    min: 0,
    max: 4,
    required: false,
    multiple: group !== 12,
    options: Array.from({ length: 8 }, (_, option) => ({
      id: `option-${group}-${option}`,
      name: `Option ${group}-${option}`,
      price: option * 1000,
    })),
  }));
  const product = { add_ons: groups } as POSProduct;
  const result = buildCartAddOns(product, {
    radioSelections: { "group-12": "option-12-3" },
    checkboxSelections: {
      "group-0": ["option-0-5", "option-0-1", "missing"],
      "group-24": ["option-24-7"],
    },
    notes: "",
  });
  const actual = result.map((group) => ({
    id: group.id,
    options: group.options.map((option) => option.id),
  }));
  const expected = [
    { id: "group-0", options: ["option-0-1", "option-0-5"] },
    { id: "group-12", options: ["option-12-3"] },
    { id: "group-24", options: ["option-24-7"] },
  ];
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`Unexpected selection: ${JSON.stringify(actual)}`);
});
