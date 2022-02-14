export function parseDate(str) {

  // yyyy-MM-ddThh:mm:ss
  // 2017-06-01T08:30:00
  let m = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):?(\d{2})?/);
  if (m) {
    const date = new Date();
    date.setFullYear(parseInt(m[1], 10));
    date.setMonth(parseInt(m[2], 10) - 1);
    date.setDate(parseInt(m[3], 10));

    date.setHours(parseInt(m[4], 10));
    date.setMinutes(parseInt(m[5], 10));
    date.setSeconds(parseInt(m[6]==undefined ? "00" : m[6], 10)); //seconds could be empty
    date.setMilliseconds(0);
    return date;
  }

  //8.9.2019, 19:38:34
  m = str.match(/(\d+)\.(\d+)\.(\d+)[\s,]+(\d+):(\d+):?(\d+)?/);
  if (m) {
    const date = new Date();

    date.setDate(parseInt(m[1], 10));
    date.setMonth(parseInt(m[2], 10) - 1);
    date.setFullYear(parseInt(m[3], 10));

    date.setHours(parseInt(m[4], 10));
    date.setMinutes(parseInt(m[5], 10));
    date.setSeconds(parseInt(m[6]==undefined ? "00" : m[6], 10)); //seconds could be empty
    date.setMilliseconds(0);
    return date;
  }
}
