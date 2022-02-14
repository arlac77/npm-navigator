import { Selector } from "testcafe";
import { base, login, clickLink } from "./helpers/util.js";

fixture`Insert Values`.page`${base}/`;

const category = "CAT1";

const entries = [
  { time: "22.12.2006, 22:22:22", value: "1.1" },
  { time: "23.12.2006, 22:22:22", value: "1.2" },
  { time: "24.12.2006, 22:22:22", value: "1.3" },
  { time: "25.12.2006, 22:22:22", value: "1.4" },
  { time: "26.12.2006, 22:22:22", value: "1.9" }
];

test("insert values to a category", async t => {
  await t.navigateTo(`${base}/category/add`);

  await login(t);

  await t
    .typeText("#name", category, { replace: true })
    .typeText("#description", "mains power 1", { replace: true })
    .typeText("#unit", "kWh", { replace: true })
    .click("button");

  await clickLink(t, "/insert");
  await t.takeScreenshot({
    path: "category_insert_values_insert.png"
  });

  for (const entry of entries) {
    await t
      .typeText(`#${category}_time`, entry.time, { replace: true })
      .typeText(`#${category}_value`, entry.value, { replace: true });

    await t.click(Selector("button").withText(`Insert ${category}`));
  }

  await clickLink(t, `/category`);
  await clickLink(t, `/category/${category}`);
  await clickLink(t, `/category/${category}/values/list#last`);
  await t.takeScreenshot({
    path: "category_insert_values_overview_after.png"
  });

  await t.expect(Selector("td").withText("1.9").exists).ok();
});
