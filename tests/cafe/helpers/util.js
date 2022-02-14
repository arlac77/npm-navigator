import { Selector } from "testcafe";

export const base = "http://localhost:3000/services/konsum/";

export async function login(t, data = { user: "user1", password: "secret" }) {
  if (await Selector("#password").exists) {
    await t
      .typeText("#username", data.user, { replace: true })
      .typeText("#password", data.password, { replace: true })
      .click("button");
  }
}

export async function clickLink(t, href) {
  const a = Selector("a").withAttribute("href", href);
  await t.click(a);
}

export const findElementByTrimmedText = Selector((baseCSSSelector, text) => {
  const el = document.querySelector(baseCSSSelector);
  const trimmedText = el && el.innerText && el.innerText.trim();
  return trimmedText === text ? el : null;
});
