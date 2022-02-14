import { Selector } from "testcafe";
import { base, login, clickLink } from "./helpers/util.js";

fixture`Admin`.page`${base}/`;

const category = "CAT3";

test("category insert and backup", async t => {
  await t.navigateTo(`${base}/category/add`);

  await login(t, { user: "admin1", password: "secret" });
  await t.takeScreenshot({
    path: "admin_after_login.png"
  });

  await t
    .typeText("#name", category, { replace: true })
    .typeText("#description", "mains power", { replace: true })
    .typeText("#unit", "kWh", { replace: true })
    .click("button");

  await t.navigateTo(`${base}/admin`);
  await t.takeScreenshot({
    path: "admin_after_adding_category.png"
  });

  /*
  await t.click(Selector("button").withText("Backup"));
  await t.takeScreenshot();
  */
});
