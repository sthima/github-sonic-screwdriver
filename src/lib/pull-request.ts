import fs from "fs";
import path from "path";
// import moment from 'moment';
import auth, { ghauthData } from "./auth";
import { GraphQLClient } from "graphql-request";
import chalk from "chalk";

var moment = require('moment-business-days');

const ENDPOINT = "https://api.github.com/graphql";
const filePath = path.resolve(__dirname, "..", "..", 'queries', "pull-request-report.gql");
const query = fs.readFileSync(filePath, 'utf8');

export class PullRequestReport {
  private auth?: ghauthData;
  private _auth: Promise<ghauthData>;
  private ignoredRepositories: Array<String>;

  constructor(ignoredRepositories: Array<String>) {
    this._auth = auth();
    this.ignoredRepositories = ignoredRepositories;
  }
  async getToken(): Promise<String> {
    this.auth = await this._auth;
    return this.auth.token;
  }

  async fetchData(): Promise<any> {
    const token = await this.getToken();
    const headers = {
      "Authorization": `Bearer ${token}`
    };

    const client = new GraphQLClient(ENDPOINT, { headers: headers });
    const variables = {
      "login": "sthima"
    }

    // try {
      let data = await client.request(query, variables);
      return data;
    // } catch(err) {
    //   const text = err.response.errors.reduce((a: String, b: Error) => {
    //     return `${a};${b.message}`
    //   }, "").substr(1);
    //   throw Error(text);
    // }
  }

  filterDate(data: any) {
    const SPRINT_INIT = moment().subtract(1, 'weeks').startOf('isoWeek');
    const repos: Map<String, Array<any>> = new Map();

    for(const repository of data.organization.repositories.nodes) {
      if (this.ignoredRepositories.includes(repository.name)) {
        continue;
      }
      const prs: Array<any> = [];
      for (const pull_request of repository.pullRequests.nodes) {
        if (pull_request.state == 'OPEN') {
          prs.push(pull_request);
        }
        else if (moment(pull_request.closedAt) > SPRINT_INIT) {
          prs.push(pull_request);
        }
      }
      if (prs.length > 0) {
        repos.set(repository.name, prs);
      }
    }
    return repos;
  }

  formatForMe(pr_time: any) {
    let pr_time_day = moment.duration(pr_time)
    let lala = Math.floor(pr_time_day.asHours()) + moment.utc(pr_time).format(':mm:ss')
    return lala;
  }

  calculateWorkingHours(start_date: any, end_date: any) {
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
        hours += moment(start_date).endOf("day").diff(start_date);
      }
      if ((end_day != 6) && (end_day != 0)) {
        // if it's weekday, sum the hours from start until end of day
        hours += end_date.diff(moment(end_date).startOf("day"));
      }
    }        
    hours += moment.duration(amount_of_weekdays - 1, 'days');
    return hours
  }

  async run() {
    // let status = true;
    // let output: String;

    // try {
      let data = await this.fetchData();
      data = this.filterDate(data);

      let deltaAll = 0;
      let prCount = 0;
      for (const entry of data.entries()) {
        let deltaRepo = 0;
        console.log(chalk.yellow.underline(`sthima/${entry[0]}`));
        for (const pr of entry[1]) {
          let start_date: any = moment(pr.createdAt);
          let end_date: any = pr.closedAt? moment(pr.closedAt) : moment();
          console.log(start_date, end_date)
          // let pr_time: any = end_date.diff(start_date)
          let pr_time = this.calculateWorkingHours(start_date, end_date);
          deltaRepo += pr_time;
          let lala = this.formatForMe(pr_time);
          console.log(`  #${pr.number}: ${chalk.bold(lala)}`);
        }
        let avgForRepo = deltaRepo / entry[1].length;
        let lala = this.formatForMe(avgForRepo);
        console.log(`Average: ${chalk.green.bold(lala)}`);
        console.log(``);
        deltaAll += deltaRepo;
        prCount += entry[1].length;
      }
      console.log(`=======================================`);
      console.log(``);
      let average = deltaAll / prCount;
      let lala = this.formatForMe(average);
      console.log(`Average All: ${chalk.magenta.bold.underline(lala)}`);
      console.log(``);

      return data;
    // } catch(err) {
    //   const text = err.response.errors.reduce((a: String, b: Error) => {
    //     return `${a};${b.message}`
    //   }, "").substr(1);
    //   throw Error(text);
    // }
  }
}
