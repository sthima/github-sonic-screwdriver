'use strict';

const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const auth = require("./auth.js");
const moment = require("moment");
const { GraphQLClient } = require("graphql-request");

const ENDPOINT = "https://api.github.com/graphql";
const filePath = path.resolve(__dirname, 'queries', `user-activity.gql`);
const query = fs.readFileSync(filePath, 'utf8');

class Issue {
  constructor(id, title, repository, url, isPullRequest=false) {
    this.id = id;
    this.title = title;
    this.repository = repository;
    this.url = url;
    this.comments = [];
  }

  pushComment(comment) {
    this.comments.push(comment);
  }
}

class UserActivity {
  constructor(username, lastWeek = false) {
    this._auth = auth();
    this.username = username;
    this.lastWeek = lastWeek;
  }

  async getToken() {
    this.auth = await this._auth;
    return this.auth.token;
  }

  async run() {
    const token = await this.getToken();
    const headers = {
      "Authorization": `Bearer ${token}`
    };
    const client = new GraphQLClient(ENDPOINT, { headers: headers });
    const variables = {
      "login": this.username
    }

    const lastWeekStart = moment().subtract(1, 'weeks').startOf('isoWeek');
    const lastWeekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');

    const issues  = new Map();
    let data = {};
    try {
      data = await client.request(query, variables);
    } catch(err) {
      const text = err.response.errors.reduce((a, b) => {
        return `${a};${b.message}`
      }, "").substr(1);
      return {
        status: false,
        text: text,
      };
    }

    for(const edge of data.user.issueComments.edges) {
      const comment = edge.node;
      const publishedAt = moment(comment.publishedAt);

      if (this.lastWeek && !publishedAt.isBetween(lastWeekStart, lastWeekEnd)) {
        continue;
      }

      const isPullRequest = comment.pullRequest != null;
      let issue = issues.get(comment.issue.number);
      if (!issue) {
        issue = new Issue(
          comment.issue.number,
          comment.issue.title,
          `${comment.issue.repository.name}/${comment.issue.repository.owner.login}`,
          comment.issue.url,
          isPullRequest
        );
        issues.set(comment.issue.number, issue);
      }
      issue.pushComment(comment);
    }

    let text = "";
    for(const entry of issues.entries()) {
      const issue = entry[1];
      text:
      text += chalk.yellow.bold(`${issue.title} (#${issue.id})`) + os.EOL;
      text += " ".repeat(2) + chalk.cyan.underline(issue.url) + os.EOL;
      text += " ".repeat(2) + chalk.bold("Comments: ") + issue.comments.length;
      text += os.EOL.repeat(2);
    }
    return {
      status: true,
      text: text,
    };
  }
}

module.exports = {
  UserActivity: UserActivity,
}
