import { describe, it, expect, vi } from "vitest";
import { sendEmail } from "./resend.js";

const payload = { from: "f@x.nl", to: "t@x.nl", reply_to: "r@x.nl", subject: "S", html: "<p>h</p>" };

describe("sendEmail", () => {
  it("posts to Resend with bearer auth and JSON body", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail("re_test", payload, fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ reply_to: "r@x.nl" });
  });
  it("rejects on a non-2xx response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("nope", { status: 422 }));
    await expect(sendEmail("re_test", payload, fetchFn)).rejects.toThrow();
  });
});
