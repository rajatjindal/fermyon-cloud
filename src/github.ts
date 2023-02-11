import { Octokit } from "@octokit/rest";

export class GithubClient {
    owner: string
    repo: string
    _ghclient: Octokit

    constructor(owner: string, repo: string, token: string) {
        this.owner = owner
        this.repo = repo

        this._ghclient = new Octokit({ auth: token });
    }

    async findOldestPRNumber(): Promise<number> {
        const q = `org:${this.owner} repo:${this.repo} is:open is:pr`;
        const result = await this._ghclient.rest.search.issuesAndPullRequests({ q, sort: 'updated', order: "asc" })
        if (result.data.items.length === 0) {
            throw `no opened pr found to undeploy`
        }

        return result.data.items[0].number
    }

    async updateComment(prNumber: number, msg: string): Promise<void> {
        await this._ghclient.rest.issues.createComment({ owner: this.owner, repo: this.repo, issue_number: prNumber, body: msg })
        await this._ghclient.rest.issues.addLabels({ owner: this.owner, repo: this.repo, issue_number: prNumber, labels: ["fermyon-preview-deployed"] })
    }
}