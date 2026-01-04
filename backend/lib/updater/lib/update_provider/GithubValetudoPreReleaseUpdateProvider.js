const GithubValetudoUpdateProvider = require("./GithubValetudoUpdateProvider");

class GithubValetudoPreReleaseUpdateProvider extends GithubValetudoUpdateProvider {
    constructor() {
        super(true);
    }
}


GithubValetudoPreReleaseUpdateProvider.TYPE = "github_prerelease";


module.exports = GithubValetudoPreReleaseUpdateProvider;
