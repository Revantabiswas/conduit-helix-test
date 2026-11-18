import { describe, it, expect } from "vitest";
import { searchArticles } from "../../../../src/lib/features/article-search-endpoint.js";

const articles = [
  { id: 1, title: "Intro", description: "about cats", body: "" },
  { id: 2, title: "Cats everywhere", description: "", body: "" },
  { id: 3, title: "Dogs", description: "", body: "dogs" },
];

describe("search", () => {
  it("ranks title above description", () => {
    expect(searchArticles(articles, "cats").map((a) => a.id)).toEqual([2, 1]);
  });
  it("rejects an empty query", () => expect(() => searchArticles(articles, "  ")).toThrow());
});
