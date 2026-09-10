// RTL component tests for key ported presentational components (Story 1.9, REQ-F-40).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// next/link is not available in the jsdom test env — mock it to a plain anchor.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const { default: Avatar } = await import("../../src/components/Avatar.jsx");
const { default: ArticleTags } = await import(
  "../../src/components/ArticleTags.jsx"
);
const { default: ArticlesPreview } = await import(
  "../../src/components/ArticlesPreview.jsx"
);
const { default: FavButton } = await import(
  "../../src/components/FavButton.jsx"
);
const { default: CommentList } = await import(
  "../../src/components/CommentList.jsx"
);

describe("Avatar", () => {
  it("renders an img with the given src and alt", () => {
    render(<Avatar src="/x.png" alt="amy" />);
    const img = screen.getByAltText("amy");
    expect(img.getAttribute("src")).toBe("/x.png");
  });
  it("falls back to a placeholder when no src", () => {
    render(<Avatar alt="none" />);
    expect(screen.getByAltText("none").getAttribute("src")).toMatch(/smiley/);
  });
});

describe("ArticleTags", () => {
  it("renders one pill per tag", () => {
    render(<ArticleTags tagList={["react", "next"]} />);
    expect(screen.getByText("react")).toBeTruthy();
    expect(screen.getByText("next")).toBeTruthy();
  });
});

describe("ArticlesPreview", () => {
  it("renders each article's title and description", () => {
    render(
      <ArticlesPreview
        articles={[
          {
            slug: "s1",
            title: "Hello",
            description: "world",
            createdAt: new Date().toISOString(),
            tagList: ["t"],
            author: { username: "amy" },
          },
        ]}
      />,
    );
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("world")).toBeTruthy();
  });
  it("shows an empty state with no articles", () => {
    render(<ArticlesPreview articles={[]} />);
    expect(screen.getByText(/No articles available/)).toBeTruthy();
  });
});

describe("FavButton", () => {
  it("renders the favorites count and toggles class on favorited", () => {
    const { rerender } = render(
      <FavButton favorited={false} favoritesCount={3} slug="s" />,
    );
    expect(screen.getByRole("button").textContent).toContain("3");
    expect(screen.getByRole("button").className).toContain(
      "btn-outline-primary",
    );
    rerender(<FavButton favorited={true} favoritesCount={4} slug="s" />);
    expect(screen.getByRole("button").className).toContain("btn-primary");
  });

  it("POSTs to favorite and calls onChange with the returned article", async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ article: { slug: "s", favorited: true } }),
      })),
    );
    render(
      <FavButton favorited={false} favoritesCount={0} slug="s" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("/api/articles/s/favorite");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    vi.unstubAllGlobals();
  });
});

describe("CommentList", () => {
  it("renders comments with authors", () => {
    render(
      <CommentList
        comments={[
          {
            id: 1,
            body: "nice",
            createdAt: new Date().toISOString(),
            author: { username: "dan" },
          },
        ]}
      />,
    );
    expect(screen.getByText("nice")).toBeTruthy();
    expect(screen.getByText("dan")).toBeTruthy();
  });
  it("shows an empty state", () => {
    render(<CommentList comments={[]} />);
    expect(screen.getByText(/No comments yet/)).toBeTruthy();
  });
});
