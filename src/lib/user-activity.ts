'use strict';

import os from "os";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import auth, { ghauthData } from "./auth";
import moment from "moment";
import { GraphQLClient } from "graphql-request";

const ENDPOINT = "https://api.github.com/graphql";
const filePath = path.resolve(__dirname, "..", "..", 'queries', "user-activity.gql");
const query = fs.readFileSync(filePath, 'utf8');

class Issue {
  id: Number;
  title: String;
  repository: String;
  url: String;
  comments: Array<String>;

  constructor(id: Number, title: String, repository: String, url: String) {
    this.id = id;
    this.title = title;
    this.repository = repository;
    this.url = url;
    this.comments = [];
  }

  pushComment(comment: String): void {
    this.comments.push(comment);
  }
}

export class UserActivity {
  private username: String;
  private lastWeek: Boolean;
  private auth?: ghauthData;
  private _auth: Promise<ghauthData>;

  constructor(username: String, lastWeek: Boolean = false) {
    this._auth = auth();
    this.username = username;
    this.lastWeek = lastWeek;
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
      "login": this.username
    }

    // TODO (mmarchini): Use stricter type
    let data: any = {};
    try {
      data = await client.request(query, variables);
    } catch(err) {
      const text = err.response.errors.reduce((a: String, b: Error) => {
        return `${a};${b.message}`
      }, "").substr(1);
      throw Error(text);

    }
    return data;
  }

  convertDataToIssues(data: any): Map<Number, Issue> {
    const lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');
    const lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');

    const issues: Map<Number, Issue> = new Map();
    for(const edge of data.user.issueComments.edges) {
      const comment = edge.node;
      const publishedAt = moment(comment.publishedAt);

      if (this.lastWeek && !publishedAt.isBetween(lastWeekStart, lastWeekEnd)) {
        continue;
      }

      let issue = issues.get(comment.issue.number);
      if (!issue) {
        issue = new Issue(
          comment.issue.number,
          comment.issue.title,
          `${comment.issue.repository.name}/${comment.issue.repository.owner.login}`,
          comment.issue.url
        );
        issues.set(comment.issue.number, issue);
      }
      issue.pushComment(comment);
    }

    return issues;
  }

  generateOutput(issues: Map<Number, Issue>): String {
    let text = "";

    for(const entry of issues.entries()) {
      const issue = entry[1];
      text += chalk.yellow.bold(`${issue.title} (#${issue.id})`) + os.EOL;
      text += " ".repeat(2) + chalk.cyan.underline(`${issue.url}`) + os.EOL;
      text += " ".repeat(2) + chalk.bold("Comments: ") + issue.comments.length;
      text += os.EOL.repeat(2);
    }

    return text;
  }

  async run() {
    let status = true;
    let output: String;

    try {
      const data = await this.fetchData();
      const issues = this.convertDataToIssues(data);
      output = this.generateOutput(issues);
    } catch(err) {
      status = false;
      output = err.message;
    }

    return {
      status: status,
      text: output,
    };
  }
}
