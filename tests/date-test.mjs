import test from "ava";
import { parseDate } from "../src/date.mjs";

function dt(t, a, b) {
  t.deepEqual(parseDate(a), new Date(b));
}

dt.title = (providedTitle = "parseDate", a, b) =>
  `${providedTitle} ${a}`.trim();

  test(dt, "8.9.2019, 19:38:34", "9.8.2019, 19:38:34");
  test(dt, "2017-06-01T08:30:00", "6.1.2017, 8:30:00");
  test(dt,"2020-12-25T11:36", "12.25.2020, 11:36:00");

