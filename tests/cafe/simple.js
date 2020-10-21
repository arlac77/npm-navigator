import { Selector } from "testcafe";

const base = "http://localhost:5000/services/npm-navigator";

fixture`overview`.page`${base}/index.html`;

test("overview", async t => {
  await t.wait(1000);

  const logoExists = Selector(".logo").exists;

  await t.expect(logoExists).ok();
});
