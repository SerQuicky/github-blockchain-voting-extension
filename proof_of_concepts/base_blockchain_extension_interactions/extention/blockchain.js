function addPoll(data) {
    return new Promise(async (resolve, reject) => {
        showLoader();
        const new_contract_address = await createContract();
        const added_contract = await addContract(new_contract_address, data);
        resolve(added_contract);
    });
}

function createContract() {
    return new Promise(async (resolve, reject) => {
        let deploy_contract = new web3.eth.Contract(JSON.parse(JSON.stringify(poll_contract_abi)));

        let contractTx = deploy_contract.deploy({
            data: bytecode
        });

        const createTransaction = await web3.eth.accounts.signTransaction(
            {
                from: getPublicKey(),
                gas: web3.utils.toHex(12475600),
                gasPrice: web3.utils.toHex(web3.utils.toWei('30', 'gwei')),
                data: await contractTx.encodeABI()
            },
            getPrivateKey()
        );

        const createReceipt = await web3.eth.sendSignedTransaction(
            createTransaction.rawTransaction
        );

        console.log(createReceipt)
        resolve(createReceipt.contractAddress);
    });
}

function addContract(address, data) {

    return new Promise((resolve, reject) => {
        manager_contract.methods.addPoll(data["rpId"], data["pqId"], address, data["time"]).estimateGas({ from: getPublicKey() }).then(gas => {

            const tx = {
                from: getPublicKey(),
                to: manager_contract_address,
                contractAddress: manager_contract_address,
                gas: gas,
                data: manager_contract.methods.addPoll(data["rpId"], data["pqId"], address, data["time"]).encodeABI()
            };

            const signPromise = web3.eth.accounts.signTransaction(tx, getPrivateKey());

            signPromise.then((signedTx) => {
                const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
                sentTx.on("receipt", receipt => {
                    console.log("JA Contract erstellt");
                    resolve(receipt);
                });
                sentTx.on("error", err => {
                    console.log("FEHLER beim Contract erstellen");
                    reject(err);
                });
            }).catch(error => reject(error));
        }).catch(error => reject(error));
    });
}

















function addVote(address, stake, descision) {
    showLoader();

    return new Promise((resolve, reject) => {

        let single_poll_contract = new web3.eth.Contract(poll_contract_abi, address);

        single_poll_contract.methods.vote(descision, stake, getPublicKey()).estimateGas({ from: getPublicKey() }).then(gas => {

            const tx = {
                from: getPublicKey(),
                to: address,
                contractAddress: address,
                gas: gas,
                value: stake,
                data: single_poll_contract.methods.vote(descision, stake, getPublicKey()).encodeABI()
            };

            const signPromise = web3.eth.accounts.signTransaction(tx, getPrivateKey());

            signPromise.then((signedTx) => {
                const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
                sentTx.on("receipt", receipt => {
                    console.log("JA GEVOTED");
                    resolve(receipt);
                });
                sentTx.on("error", err => {
                    console.log("FEHLER OH NEIN");
                    reject(err);
                });
            }).catch(error => reject(error));
        }).catch(error => reject(error));
    });
}


function closePoll(index) {
    return new Promise((resolve, reject) => {
        manager_contract.methods.closePoll(index).estimateGas({ from: getPublicKey() }).then(gas => {

            const tx = {
                from: getPublicKey(),
                to: manager_contract_address,
                contractAddress: manager_contract_address,
                gas: gas,
                data: manager_contract.methods.closePoll(index).encodeABI()
            };

            const signPromise = web3.eth.accounts.signTransaction(tx, getPrivateKey());

            signPromise.then((signedTx) => {
                const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
                sentTx.on("receipt", receipt => {
                    console.log("JA Contract abgeschlossen");
                    resolve(receipt);
                });
                sentTx.on("error", err => {
                    console.log("FEHLER beim Contract abschliessen");
                    reject(err);
                });
            }).catch(error => reject(error));
        }).catch(error => reject(error));
    });
}

function resolvePoll(address, index, value, delegate) {
    return new Promise(async (resolve, reject) => {

        let single_poll_contract = new web3.eth.Contract(poll_contract_abi, address);
        let votes_length = await single_poll_contract.methods.getVotesLength().call();

        single_poll_contract.methods.transferStakes(index, value).estimateGas({ from: getPublicKey() }).then(gas => {

            const tx = {
                from: getPublicKey(),
                to: address,
                contractAddress: address,
                gas: gas,
                data: single_poll_contract.methods.transferStakes(index, value).encodeABI()
            };

            const signPromise = web3.eth.accounts.signTransaction(tx, getPrivateKey());

            signPromise.then((signedTx) => {
                const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
                sentTx.on("receipt", receipt => {

                    console.log("JA MAN TRANSFERED " + delegate);
                    resolve(receipt);
                });
                sentTx.on("error", err => {
                    console.log("VERDAMMT " + delegate);
                    reject(err);
                });
            }).catch(error => reject(error));
        }).catch(error => reject(error));
    });
}


function getWalletBalance(web3, public_key) {
    return new Promise(async (resolve, reject) => {
        try {
            let balance = await web3.eth.getBalance(public_key);
            resolve((parseInt(balance) / (10 ** 18)) + " ETH");
        } catch (error) {
            reject(error);
        }
    });
}

function initWalletWithGas(web3, from, to, private_key) {
    return new Promise((resolve, reject) => {
        const tx = {
            from: from,
            to: to,
            gas: 1287794,
            value: '3000000000000000000'
        };

        const signPromise = web3.eth.accounts.signTransaction(tx, private_key);

        signPromise.then((signedTx) => {
            const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            sentTx.on("receipt", receipt => {
                resolve(receipt);
            });
            sentTx.on("error", err => {
                reject(err);
            });
        }).catch(error => reject(error));
    });
}