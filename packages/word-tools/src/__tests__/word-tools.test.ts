import { describe, it, expect } from "vitest";
import { countWords, estimateTokens, calculateWordBudget, allocateSectionBudgets } from "../index";

describe("countWords", () => {
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("counts simple words", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("one two three four five")).toBe(5);
  });

  it("strips HTML tags before counting", () => {
    expect(countWords("<p>hello world</p>")).toBe(2);
    expect(countWords("<strong>bold text</strong> and more")).toBe(4);
  });

  it("strips markdown formatting before counting", () => {
    expect(countWords("**bold** text")).toBe(2);
    expect(countWords("# Heading One")).toBe(2);
    expect(countWords("_italic_ words here")).toBe(3);
  });

  it("handles multiple spaces", () => {
    expect(countWords("hello   world")).toBe(2);
  });
});

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("estimates tokens as ceil(words / 0.75)", () => {
    // 3 words => ceil(3 / 0.75) = ceil(4) = 4
    expect(estimateTokens("one two three")).toBe(4);
  });
});

describe("calculateWordBudget", () => {
  it("correctly marks section as on_target within tolerance", () => {
    const result = calculateWordBudget({
      targetWords: 1000,
      tolerancePercent: 5,
      sections: [
        { id: "intro", name: "Introduction", targetWords: 200, currentText: "word ".repeat(200) },
      ],
    });
    expect(result.sectionStats[0]?.status).toBe("on_target");
  });

  it("marks section as under when below tolerance", () => {
    const result = calculateWordBudget({
      targetWords: 1000,
      tolerancePercent: 5,
      sections: [
        { id: "intro", name: "Introduction", targetWords: 200, currentText: "word ".repeat(100) },
      ],
    });
    expect(result.sectionStats[0]?.status).toBe("under");
  });

  it("marks section as over when above tolerance", () => {
    const result = calculateWordBudget({
      targetWords: 1000,
      tolerancePercent: 5,
      sections: [
        { id: "intro", name: "Introduction", targetWords: 200, currentText: "word ".repeat(250) },
      ],
    });
    expect(result.sectionStats[0]?.status).toBe("over");
  });

  it("calculates totals correctly", () => {
    const result = calculateWordBudget({
      targetWords: 500,
      sections: [
        { id: "s1", name: "Section 1", targetWords: 250, currentText: "word ".repeat(100) },
        { id: "s2", name: "Section 2", targetWords: 250, currentText: "word ".repeat(150) },
      ],
    });
    expect(result.totalCurrentWords).toBe(250);
    expect(result.totalTargetWords).toBe(500);
    expect(result.remainingWords).toBe(250);
  });

  it("generates appropriate recommendation when under target", () => {
    const result = calculateWordBudget({
      targetWords: 1000,
      sections: [
        { id: "intro", name: "Introduction", targetWords: 1000, currentText: "word ".repeat(100) },
      ],
    });
    expect(result.recommendation).toContain("Add approximately");
  });

  it("generates appropriate recommendation when over target", () => {
    const result = calculateWordBudget({
      targetWords: 100,
      sections: [
        { id: "intro", name: "Introduction", targetWords: 100, currentText: "word ".repeat(200) },
      ],
    });
    expect(result.recommendation).toContain("over target");
  });
});

describe("allocateSectionBudgets", () => {
  it("allocates intro as 10% and conclusion as 15%", () => {
    const result = allocateSectionBudgets(1000, 3);
    expect(result.intro).toBe(100);
    expect(result.conclusion).toBe(150);
    expect(result.body).toHaveLength(3);
  });

  it("body sections sum roughly equals remaining words", () => {
    const result = allocateSectionBudgets(1000, 2);
    const bodyTotal = result.body.reduce((a, b) => a + b, 0);
    // 1000 - 100 (intro) - 150 (conclusion) = 750; 750 / 2 = 375 each
    expect(bodyTotal).toBeCloseTo(750, -1);
  });
});
