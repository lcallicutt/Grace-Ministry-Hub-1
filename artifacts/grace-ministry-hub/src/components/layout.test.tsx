import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Layout } from "./layout";

vi.mock("@workspace/api-client-react", () => ({
  useGetChurchProfile: () => ({ data: { churchName: "Grace Church" } }),
}));

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const matches = width < 768;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

function renderLayout() {
  return render(
    <Layout>
      <div>Main ministry workspace</div>
    </Layout>,
  );
}

afterEach(cleanup);

describe("responsive navigation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("keeps the main page visible by default on mobile", async () => {
    setViewport(390);
    renderLayout();

    expect(screen.getByText("Main ministry workspace")).toBeTruthy();
    expect(screen.getByLabelText("Primary navigation").className).toContain("w-0");
    expect(screen.queryByLabelText("Close navigation")).toBeNull();

    await waitFor(() => {
      expect(screen.getByLabelText("Open navigation").getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("shows the sidebar and backdrop, then closes from the backdrop", async () => {
    setViewport(390);
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText("Open navigation"));

    expect(screen.getByLabelText("Primary navigation").className).toContain("w-64");
    expect(screen.getByLabelText("Close navigation")).toBeTruthy();

    await user.click(screen.getByLabelText("Close navigation"));

    expect(screen.getByLabelText("Primary navigation").className).toContain("w-0");
    expect(screen.queryByLabelText("Close navigation")).toBeNull();
  });

  it("closes mobile navigation after choosing a destination", async () => {
    setViewport(390);
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText("Open navigation"));
    await user.click(screen.getByText("Service Builder"));

    expect(window.location.pathname).toBe("/service-builder");
    expect(screen.getByLabelText("Primary navigation").className).toContain("w-0");
    expect(screen.queryByLabelText("Close navigation")).toBeNull();
  });

  it("preserves desktop sidebar collapse and expansion", async () => {
    setViewport(1280);
    const user = userEvent.setup();
    renderLayout();

    const navigation = screen.getByLabelText("Primary navigation");
    expect(navigation.className).toContain("w-64");

    await user.click(screen.getByLabelText("Collapse navigation"));
    expect(navigation.className).toContain("md:w-16");

    await user.click(screen.getByLabelText("Expand navigation"));
    expect(navigation.className).toContain("w-64");
  });
});