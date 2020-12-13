/* -------------------------------------------------------------------------------------------
*                                   env settings
------------------------------------------------------------------------------------------- */
var public_address = '0x28CfbA097FF9bb9D904471c493b032Df45B9f953';
var private_key = 'f1d57d756f7a47c3e70b740acf95b38611a26b81c7a0cff7de872ab306ae35d0';
var provider = 'https://sokol.poa.network';
var contract_address = '0x294E5457CD9EAFc53b90D85dab3b7864D3cdcDad';
var github_token = 'fa35b9b1cb332db97cd81f6a31f3fc28e6b8788f';

var pollable_pqs = [];
var username = "SerQuicky";
var currentRepo = "";

/* -------------------------------------------------------------------------------------------
*                                   init web3js
------------------------------------------------------------------------------------------- */

web3 = new Web3(provider);
contract = new this.web3.eth.Contract(contract_abi, contract_address);
account = web3.eth.accounts.privateKeyToAccount(private_key);


function onLogin() { }



/* -------------------------------------------------------------------------------------------
*                                   Github calls
------------------------------------------------------------------------------------------- */


function getRequest(url) {
    return fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: new Headers({
            'User-agent': 'Mozilla/4.0 Custom User Agent',
            "Authorization": "Bearer " + github_token,
        }),
    })
        .then(response => response.json()) //Converting the response to a JSON object
}


function initRepositoriesAndContracts() {
    return new Promise(async (resolve, reject) => {
        reposList.innerHTML = "";
        let _polls = [];
        let _votes = [];

        console.log(document.getElementById("public-key").textContent);

        // load data from data from contract and github
        const _repositories = await getRequest('https://api.github.com/users/' + username + '/starred');
        const _polls_length = await contract.methods.getPollsLength().call();
        const _votes_length = await contract.methods.getVotesLength().call();

        // get votes to compare it.
        for (let i = 0; i < _votes_length; i++) {
            await contract.methods.votes(i).call().then(vote => {
                if (vote['delegate'] == document.getElementById("public-key").textContent) {
                    _votes.push(vote);
                }
            })
        }

        // formate contract from contract pull
        for (let i = 0; i < _polls_length; i++) {
            await contract.methods.polls(i).call().then(poll => {
                _polls.push(poll);
            });
        }

        console.log(_polls);

        // combine repository and contract data
        for (let i = 0; i < _repositories.length; i++) {
            _repositories[i]['openPolls'] = [];
            _repositories[i]['closedPolls'] = [];
            _repositories[i]['votedPolls'] = [];

            for (let j = 0; j < _polls.length; j++) {

                /*console.log(_repositories[i]['id'] + " vs " + _polls[j]["rpId"]);
                console.log(getCurrentDate() + " vs " + _polls[j]["time"]);

                console.log(_repositories[i]['id'] == _polls[j]["rpId"]);
                console.log(parseInt(_polls[j]["time"]) > getCurrentDate());
                console.log(!_votes.some(vote => vote["poll"] == _polls[j]["id"]));*/


                if (_repositories[i]['id'] == _polls[j]["rpId"] 
                    && parseInt(_polls[j]["time"]) > getCurrentDate()
                    && !_votes.some(vote => vote["poll"] == _polls[j]["id"])) {
                    
                    _repositories[i]['pollId'] = _polls[j]["id"];
                    _repositories[i]['openPolls'].push(_polls[j]);

                } else if (_repositories[i]['id'] == _polls[j]["rpId"]  && parseInt(_polls[j]["time"] < getCurrentDate())) {
                    _repositories[i]['closedPolls'].push(_polls[j]);

                } else if (_votes.some(vote => vote["poll"] == _polls[j]["id"])) {
                    _repositories[i]['votedPolls'].push(_polls[j]);

                }
            }
        }

        resolve(_repositories);
    });
}

function initContractPollsAndPollables(repository) {
    return new Promise(async (resolve, reject) => {
        console.log(repository["openPolls"]);
        console.log(repository["closedPolls"]);
        console.log(repository["votedPolls"]);

        pollsList.innerHTML = "";
        pullList.innerHTML = "";


        let _pollables = [];
        let _pulls = await getRequest("https://api.github.com/repos/" + repository['owner']['login'] + "/" + repository.name + "/pulls");


        for (let i = 0; i < _pulls.length; i++) {
            if(!repository["openPolls"].some(poll => poll['pqId'] == _pulls[i]['id']) 
                && !repository["closedPolls"].some(poll => poll['pqId'] == _pulls[i]['id'])
                && !repository["votedPolls"].some(poll => poll['pqId'] == _pulls[i]['id'])) {

                _pollables.push(_pulls[i]);
            }

        }

        resolve({ contracts: repository["openPolls"], pollables: _pollables });
    });
}




// Extension Logic implementation
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

/* -------------------------------------------------------------------------------------------
                        check existing values on load
 ------------------------------------------------------------------------------------------- */
window.addEventListener("load", function () {
    initLayout();
});

function initLayout() {
    let keyMatrix = [
        { key: "pbk", id: "public-key", type: "span" },
        { key: "prk", id: "private-key", type: "span" },
        { key: "username", id: "cred-username", type: "input" },
        { key: "token", id: "cred-token", type: "input" }
    ];

    // sync the key and account data from the chrome storage
    valideSyncStorageKey(keyMatrix).then(async _ => {
        username = document.getElementById("cred-username").value;
        let balance = await web3.eth.getBalance(document.getElementById("public-key").textContent); 
        document.getElementById("account-balance").textContent = (parseInt(balance) / (10 ** 18)) + " ETH";

        onLogin();
        gotoCard(0);
    }).catch(err => {
        console.log(err);
        gotoCard(6);
    });
}

function valideSyncStorageKey(list) {
    return new Promise(async (resolve, reject) => {
        for (let i = 0; i < list.length; i++) {
            await new Promise((resolve, reject) => {
                chrome.storage.sync.get(list[i].key, function (data) {
                    if (data[list[i].key]) {
                        list[i].type == "span" ?
                            document.getElementById(list[i].id).innerHTML = data[list[i].key]
                            : document.getElementById(list[i].id).value = data[list[i].key];
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }
        resolve();
    });
}


/* -------------------------------------------------------------------------------------------
                                          Menu Navigation
------------------------------------------------------------------------------------------- */

// Navigation-Views
var cardArray = [
    document.getElementById("menuCard"),
    document.getElementById("pollsCard"),
    document.getElementById("repoCard"),
    document.getElementById("pullCard"),
    document.getElementById("walletCard"),
    document.getElementById("credCard"),
    document.getElementById("loginCard")
];

// Back functionality for the navigation
var backBtns = document.getElementsByClassName("backBtn");
for (let i = 0; i < backBtns.length; i++) {
    backBtns[i].addEventListener("click", function () { gotoCard(0) });
}


document.getElementById("gotoRepoBtn").addEventListener("click", async function () {
    gotoCard(2);
    let repositories = await initRepositoriesAndContracts();
    repositories.forEach(repository => {
        UIapppendRepo(repository);
    });
});

document.getElementById("gotoWalletBtn").addEventListener("click", function () { gotoCard(4) });
document.getElementById("gotoCredBtn").addEventListener("click", function () { gotoCard(5) });
document.getElementById("cred-btn").addEventListener("click", function () { gotoCard(5) });
document.getElementById("wallet-btn").addEventListener("click", function () { gotoCard(4) });

var reposList = document.getElementById("repoList");
var pollsList = document.getElementById("pollsList");
var pullList = document.getElementById("pullList");


// generic navigation function
function gotoCard(index) {
    cardArray.forEach(element => {
        element.style.display = "none";
    });
    cardArray[index].style.display = "block";
}







/* -------------------------------------------------------------------------------------------
                            User-Interface Scripting
------------------------------------------------------------------------------------------- */




function UIaddPoll(time, name, url, repository) {

    // Layout generation of the grid-poll-element
    var pollElement = document.createElement("div");
    pollElement.classList.add("poll-element");

    let pollDate = document.createElement("div");
    let pollDateSpan = document.createElement("span");
    pollDateSpan.textContent = formateTime(time);
    pollDate.appendChild(pollDateSpan);
    pollDate.classList.add("poll-date");

    let pollName = document.createElement("div");
    let pollNameSpan = document.createElement("span");
    pollNameSpan.textContent = formateName(name);
    pollName.appendChild(pollNameSpan);
    pollName.classList.add("poll-name");

    let pollButtons = document.createElement("div");
    pollButtons.classList.add("poll-buttons");


    // add the action button to the poll element layout container
    var confirmBtn = document.createElement("div");
    confirmBtn.classList.add("accept-button");
    var checkmark_icon = document.createElement("img");
    checkmark_icon.src = "./assets/checkmark.png";
    confirmBtn.appendChild(checkmark_icon);
    confirmBtn.addEventListener("click", function () {
        console.log({pollId: repository['pollId'], decision: true, value: 500000, address: document.getElementById("public-key").textContent});
        addVote(repository['pollId'], true, 500000, document.getElementById("public-key").textContent);
    });


    var denyBtn = document.createElement("div");
    denyBtn.classList.add("decline-button");
    var cross_icon = document.createElement("img");
    cross_icon.src = "./assets/cross.png";
    denyBtn.appendChild(cross_icon);
    denyBtn.addEventListener("click", function () {
        addVote(repository['pollId'], false, 500000, document.getElementById("public-key").textContent);
    });

    var linkBtn = document.createElement("div");
    linkBtn.classList.add("link-button");
    var link_icon = document.createElement("img");
    link_icon.src = "./assets/link.png";
    linkBtn.appendChild(link_icon);
    linkBtn.addEventListener("click", function () {
        window.open("https://github.com/" + url.split("/")[4] + "/" + url.split("/")[5] + "/" + url.split("/")[6] + "/" + url.split("/")[7], "_blank");
    });


    // append buttons
    pollButtons.appendChild(confirmBtn);
    pollButtons.appendChild(denyBtn);
    pollButtons.appendChild(linkBtn);

    // append element parts
    pollElement.appendChild(pollDate);
    pollElement.appendChild(pollName);
    pollElement.appendChild(pollButtons);

    // append complete poll element
    pollsList.appendChild(pollElement);
}

function UIapppendRepo(repository) {
    let repoElement = document.createElement("div");
    let repoName = document.createElement("span");
    let repoPolls = document.createElement("div");

    repoName.textContent = formateName(repository.name);
    repoPolls.textContent = repository.openPolls.length;

    repoElement.classList.add("repository-element");
    repoElement.addEventListener("click", async function () {
        document.getElementById("pollsHeader").innerHTML = "Polls of " + formateName(repository.name);
        gotoCard(1);
        let response = await initContractPollsAndPollables(repository);

        UIsetPollableNumber(response.pollables, repository);
        for (let i = 0; i < response.contracts.length; i++) {
            UIaddPoll(response.contracts[i]["time"], response.contracts[i]["pqTitle"], response.contracts[i]["pqLink"], repository);
        }
    });

    repoElement.appendChild(repoName);
    repoElement.appendChild(repoPolls);
    repoList.appendChild(repoElement);
}

function UIsetPollableNumber(pollables, repository) {
    let btn = document.getElementById("showPollsBtn");
    btn.addEventListener("click", function () {
        gotoCard(3);
        UIappendPollable(pollables, repository);
    });

    let btn2 = document.getElementById("showMergeBt");
    btn2.addEventListener("click", function () {
        gotoCard(3);
        UIappendPollable(pollables, repository);
    });

    let pollNumber = document.createElement("div");
    pollNumber.textContent = pollables.length;
    btn.replaceChild(pollNumber, btn.childNodes[3]);
}

function UIappendPollable(pollables, repository) {
    pullList.textContent = '';
    document.getElementById("pollableHeader").textContent = "Pollable pull-requests of " + formateName(repository.name);

    pollables.forEach(pollable_pq => {
        // Layout generation of the grid-poll-element
        var pollableElement = document.createElement("div");
        pollableElement.classList.add("pollable-element");

        let pollableName = document.createElement("div");
        let pollableNameSpan = document.createElement("span");
        pollableNameSpan.textContent = pollable_pq.title;
        pollableName.appendChild(pollableNameSpan);

        let pollableButton = document.createElement("div");
        pollableButton.classList.add("pollable-button");


        // add the action button to the poll element layout container
        var pollBtn = document.createElement("div");
        pollBtn.classList.add("link-button");
        let pollBtnSpan = document.createElement("span");
        pollBtnSpan.textContent = "Create poll";
        pollBtn.appendChild(pollBtnSpan);
        pollBtn.addEventListener("click", function () {
            addPoll(repository.id, pollable_pq['id'], pollable_pq['url'], pollable_pq['title'], 500000, document.getElementById("public-key").textContent);
        });


        pollableButton.appendChild(pollBtn);
        pollableElement.appendChild(pollableName);
        pollableElement.appendChild(pollableButton);

        pullList.appendChild(pollableElement);
    });
}

function formateTime(str) {
    return str.substr(4, 2) + "." + str.substr(6, 2) + "." + str.substr(8, 4) + " " + str.substr(0, 2) + ":" + str.substr(2, 2);
}

function formateName(str) {
    return str.length > 15 ? str.substr(0, 15) + "..." : str;
}

function getCurrentDate() {
    let today = new Date();
    return parseInt(today.getFullYear() + "" + (today.getMonth() + 1) + "" + today.getDate() + "" + today.getHours() + "" + today.getMinutes());
}

function getPublicKey() {
    return document.getElementById("public-key").textContent;
}

function getPrivateKey() {
    return document.getElementById("private-key").textContent;
}

/* -------------------------------------------------------------------------------------------
*                                   make calls
------------------------------------------------------------------------------------------- */


function genKeys() {
    let acc = web3.eth.accounts.create(web3.utils.randomHex(32));

    // save adress and private key in the persistant storage
    document.getElementById("public-key").textContent = acc['address'];
    document.getElementById("private-key").textContent = acc['privateKey'];
    chrome.storage.sync.set({ pbk: acc['address'] });
    chrome.storage.sync.set({ prk: acc['privateKey'] });
    initWalletWithGas(web3, public_address, acc['address'], private_key);
}

document.getElementById("btn-gen-keys").addEventListener("click", () => {
    genKeys();
})

document.getElementById("save-btn").addEventListener("click", () => {
    chrome.storage.sync.set({ username: document.getElementById("cred-username").value });
    chrome.storage.sync.set({ token: document.getElementById("cred-token").value });
    initLayout();
})



/* -------------------------------------------------------------------------------------------
*                                   make a transaction
------------------------------------------------------------------------------------------- */

function addPoll(rpId, pqId, pqLink, pqTitle, value, address) {
    contract.methods.addNewPoll(rpId, pqId, pqLink, pqTitle, value, address).estimateGas({ from: document.getElementById("public-key").textContent }).then(gas => {

        const tx = {
            from: document.getElementById("public-key").textContent,
            to: contract_address,
            contractAddress: contract_address,
            gas: gas + value,
            value: value,
            data: contract.methods.addNewPoll(rpId, pqId, pqLink, pqTitle, value, address).encodeABI()
        };

        const signPromise = web3.eth.accounts.signTransaction(tx, document.getElementById("private-key").textContent);

        signPromise.then((signedTx) => {
            const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            sentTx.on("receipt", receipt => {
                console.log(receipt);
                getPollNumbers()
            });
            sentTx.on("error", err => {
                console.log(err);
            });
        }).catch(error => console.log(error));
    }).catch(error => console.log(error));
}

function addVote(pollId, decision, value, address) {
    contract.methods.vote(pollId, decision, value, address).estimateGas({ from: document.getElementById("public-key").textContent }).then(gas => {

        const tx = {
            from: document.getElementById("public-key").textContent,
            to: contract_address,
            contractAddress: contract_address,
            gas: gas + value,
            value: value,
            data: contract.methods.vote(pollId, decision, value, address).encodeABI()
        };

        const signPromise = web3.eth.accounts.signTransaction(tx, document.getElementById("private-key").textContent);

        signPromise.then((signedTx) => {
            const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            sentTx.on("receipt", receipt => {
                console.log(receipt);
                getPollNumbers()
            });
            sentTx.on("error", err => {
                console.log(err);
            });
        }).catch(error => console.log(error));
    }).catch(error => console.log(error));
}

