import { Selector } from "testcafe";
import { base, login, clickLink } from "./helpers/util.js";

fixture`Delete Values`.page`${base}/`;

const category = "CAT7";

const entries = [
  { time: "22.12.2006, 22:22:22", value: "1.1" },
  { time: "23.12.2006, 22:22:22", value: "1.2" },
  { time: "24.12.2006, 22:22:22", value: "1.3" },
  { time: "25.12.2006, 22:22:22", value: "1.4" },
  { time: "26.12.2006, 22:22:22", value: "1.9" }
];

/*
delete action need to be fullfilles, chrome has error:
/testcafe-core.js:1 The specified value "23.12.2006, 22:22:22" does not conform to the required format.  The format is "yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS".

find one element to delete and check if this doesn exists more
*/

test("delete values from a category", async t => {
  await t.navigateTo(`${base}/category/add`);

  await login(t);

  await t
    .typeText("#name", category, { replace: true })
    .typeText("#description", "mains power 1", { replace: true })
    .typeText("#unit", "kWh", { replace: true })
    .click("button");
  await clickLink(t, "/insert");

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
    path: "category_delete_value_before_delete.png"
  });

  await t.expect(Selector("td").withText("1.9").exists).ok();

  //find one element to delete and check if this doesn exists more
  //const link =  Selector('#last');
  //console.log(await link.textContent)
  await t.setNativeDialogHandler(() => true).click(Selector("#last > td:nth-child(3) > button"));
  
  await t.takeScreenshot({
    path: "category_delete_value_after_delete.png"
  });

  await t.expect(Selector("td").withText("1.9").exists).notOk();
});
