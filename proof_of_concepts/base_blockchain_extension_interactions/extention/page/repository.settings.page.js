async function initRepositorySettings(repository) {
    showLoader();
    
    openNewView(document.getElementById("repoInfoCard"));
    const response = await getRequest('https://api.github.com/repos/' + repository['owner']['login'] + '/' + repository['name'] + '/collaborators');

    user.setAdmin(
        response.some(entry => entry['login'] == username) ?
        response.find(entry => entry['login'] == username)['permissions']['admin']
        : false
    );

    console.log(user);
    var showIssuesBtn = document.getElementById("showIssuesBtn");
    showIssuesBtn.removeEventListener("click", () => {console.log("Listerner removed")});
    showIssuesBtn.addEventListener("click", function() {
        initIssueList(repository);
    });

    let showPullsBtn = document.getElementById("showPullsBtn");
    showPullsBtn.removeEventListener("click", () =>{});
    showPullsBtn.addEventListener("click", function () {
        initPollList(repository);
    });

    hideLoader();
}