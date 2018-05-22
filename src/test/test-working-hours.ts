import { calculateWorkingHours } from "../lib/utils";

var test = require('tape');
const moment = require('moment-business-days');

test('calculate working hours test', function (t: any) {
    t.plan(1);
    let start_date = moment("2018-05-17 18:00:00.000");
    let end_date = moment("2018-05-21 17:00:00.000");
    t.equal(calculateWorkingHours(start_date, end_date), moment.duration(47, 'hours').valueOf());
});
