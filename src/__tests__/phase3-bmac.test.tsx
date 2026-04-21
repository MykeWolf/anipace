import { render, screen } from "@testing-library/react";
import SiteFooter from "@/components/sections/SiteFooter";
import FounderStory from "@/components/sections/FounderStory";

const BMAC_URL = "https://buymeacoffee.com/themichaelleonard";

describe("SiteFooter — Buy Me a Coffee", () => {
  beforeEach(() => render(<SiteFooter />));

  test("renders BMAC link with correct URL", () => {
    const link = screen.getByRole("link", { name: /support anipace/i });
    expect(link).toHaveAttribute("href", BMAC_URL);
  });

  test("BMAC link opens in new tab", () => {
    const link = screen.getByRole("link", { name: /support anipace/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  test("BMAC link has noopener noreferrer rel", () => {
    const link = screen.getByRole("link", { name: /support anipace/i });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Instagram link still present", () => {
    expect(
      screen.getByRole("link", { name: /follow on instagram/i })
    ).toBeInTheDocument();
  });
});

describe("FounderStory — Buy Me a Coffee", () => {
  beforeEach(() => render(<FounderStory />));

  test("renders secondary BMAC link with correct URL", () => {
    const link = screen.getByRole("link", {
      name: /support anipace on buy me a coffee/i,
    });
    expect(link).toHaveAttribute("href", BMAC_URL);
  });

  test("BMAC link opens in new tab", () => {
    const link = screen.getByRole("link", {
      name: /support anipace on buy me a coffee/i,
    });
    expect(link).toHaveAttribute("target", "_blank");
  });

  test("BMAC link has noopener noreferrer rel", () => {
    const link = screen.getByRole("link", {
      name: /support anipace on buy me a coffee/i,
    });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Instagram CTA still present and unaffected", () => {
    expect(
      screen.getByRole("link", { name: /follow along on instagram/i })
    ).toBeInTheDocument();
  });
});
