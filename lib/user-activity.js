
const auth = require("./auth.js");
const moment = require("moment");
const { GraphQLClient } = require("graphql-request");

const ENDPOINT = "https://api.github.com/graphql";
const query = `query getIssueComments($login: String!) {
  user(login:$login) {
		issueComments(last: 100) {
      edges {
        node {
          issue {
            number
            title
            repository {
              name
              owner {
                login
              }
            }
            url
          }
          pullRequest {
            url
          }
          publishedAt
          url
        }
      }
    }
  }
}`;

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
      console.log(err.response.errors);// GraphQL response errors
      console.log(err.response.data); // Response data if available
      return false;
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

    for(const entry of issues.entries()) {
      const issue = entry[1];
      console.log("----------------------------------------------------------");
      console.log(`${issue.title} (#${issue.id})`);
      console.log(`${issue.url}`);
      console.log(`Comments: ${issue.comments.length}`);
    }
    return true;
  }
}

module.exports = {
  UserActivity: UserActivity,
}
