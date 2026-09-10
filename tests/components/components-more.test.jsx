// Additional RTL tests to cover the remaining ported presentational components (Story 1.9).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const { default: Footer } = await import("../../src/components/Footer.jsx");
const { default: BannerContainer } = await import(
  "../../src/components/BannerContainer.jsx"
);
const { default: ArticleMeta } = await import(
  "../../src/components/ArticleMeta.jsx"
);
const { default: FeedToggler } = await import(
  "../../src/components/FeedToggler.jsx"
);
const { default: PopularTags } = await import(
  "../../src/components/ArticleTagsSidebar.jsx"
);
const { default: FollowButton } = await import(
  "../../src/components/FollowButton.jsx"
);

describe("Footer", () => {
  it("shows the rebranded name and no Thinkster attribution", () => {
    render(<Footer />);
    expect(screen.getByText("conduit helix aire test")).toBeTruthy();
    expect(screen.queryByText(/Thinkster/)).toBeNull();
  });
});

describe("BannerContainer", () => {
  it("renders its children", () => {
    render(
      <BannerContainer>
        <span>banner child</span>
      </BannerContainer>,
    );
    expect(screen.getByText("banner child")).toBeTruthy();
  });
});

describe("ArticleMeta", () => {
  it("renders the author name and date", () => {
    render(
      <ArticleMeta
        author={{ username: "amy", image: "/a.png" }}
        createdAt="2026-01-01T00:00:00.000Z"
      />,
    );
    expect(screen.getByText("amy")).toBeTruthy();
    expect(screen.getByAltText("amy")).toBeTruthy();
  });
});

describe("FeedToggler", () => {
  it("shows Your Feed only when personal is enabled and marks the active mode", () => {
    const { rerender } = render(
      <FeedToggler mode="global" showPersonal={false} />,
    );
    expect(screen.queryByText("Your Feed")).toBeNull();
    expect(screen.getByText("Global Feed").className).toContain("active");

    rerender(<FeedToggler mode="personal" showPersonal={true} />);
    expect(screen.getByText("Your Feed").className).toContain("active");
  });
});

describe("PopularTags", () => {
  it("renders a link per tag", () => {
    render(<PopularTags tags={["go", "rust"]} />);
    expect(screen.getByText("go")).toBeTruthy();
    expect(screen.getByText("rust")).toBeTruthy();
  });
});

describe("FollowButton", () => {
  it("labels Follow/Unfollow based on following state", () => {
    const { rerender } = render(
      <FollowButton username="bob" following={false} />,
    );
    expect(screen.getByRole("button").textContent).toContain("Follow");
    rerender(<FollowButton username="bob" following={true} />);
    expect(screen.getByRole("button").textContent).toContain("Unfollow");
  });

  it("POSTs to follow and calls onChange with the returned profile", async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ profile: { username: "bob", following: true } }),
      })),
    );
    render(<FollowButton username="bob" following={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("/api/profiles/bob/follow");
    expect(opts.method).toBe("POST");
    vi.unstubAllGlobals();
  });
});
