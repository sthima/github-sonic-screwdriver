const moment = require('moment-business-days');

export function calculateWorkingHours(start_date: any, end_date: any) {
  let hours = 0;
  let amount_of_weekdays = moment(start_date).businessDiff(moment(end_date));
  let start_day = start_date.day();
  let end_day = end_date.day();

  if (amount_of_weekdays == 0) {
    // all work was done in the weekends, maybe just calculate normally?
    hours = end_date.diff(start_date);
  }
  else if (amount_of_weekdays == 1)  {
    // created and close in the same day (on a weekday)
    hours = end_date.diff(start_date);
  }
  else {
    if ((start_day != 6) && (start_day != 0)) {
      // if it's weekday, sum the hours until the end of the day
      hours += moment(start_date).endOf("day").diff(start_date) + 1;
    }
    if ((end_day != 6) && (end_day != 0)) {
      // if it's weekday, sum the hours from start until end of day
      hours += end_date.diff(moment(end_date).startOf("day"));
    }
  }
  hours += moment.duration(amount_of_weekdays - 1, 'days');
  return hours;
}
