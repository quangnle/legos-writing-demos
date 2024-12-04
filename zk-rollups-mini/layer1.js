class Layer1 {
    constructor() {
        this.addresses = [];
        this.balances = [];        
        this.proofs = [];
        this.totalBalance = 0;
    }    

    deposit(address, amount) {
        // check if account exists        
        if (this.addresses.findIndex(a => a.address == address) == -1) {
            this.addresses.push(address);
        } 

        // update balance
        this.totalBalance += amount;
    }

    updateState(userStates, proof) {
        this.proofs.push(proof);
        userStates.forEach(us => {
            const account = this.accounts.find(a => a.address == us.address);            
            account.l1Balance = us.l1Balance;            
            account.l2Balance = us.l2Balance;
        });
    }

    verifyClaimProof(claimProof, proof) {
        // check if proof is valid
        const allNodes = [...claimProof];
        while (allNodes.length > 1) {
            // current node
            const curNode = allNodes.shift();
            // search for the sibling of the current node based on the current node's id
            const sibling = allNodes.find(n => n.id == curNode.id.slice(0, -1) + (curNode.id[curNode.id.length - 1] == '0' ? '1' : '0'));
            // if sibling is not found, return false
            if (sibling == undefined) {
                return false;
            }
            // calculate the parent node
            let parent = null;
            // if the current node is left node
            if (curNode.id[curNode.id.length - 1] == '0') {
                parent = new TreeNode(this.f.hash(curNode.hashValue + sibling.hashValue + ''), curNode.content + sibling.content, curNode, sibling);
            } else {
                parent = new TreeNode(this.f.hash(sibling.hashValue + curNode.hashValue + ''), sibling.content + curNode.content, sibling, curNode);
            }
            parent.id = curNode.id.slice(0, -1);
            // add parent node to the list of nodes
            allNodes.push(parent);                        
            //remove sibling node from the list of nodes
            allNodes = allNodes.filter(n => n.hashValue != sibling.hashValue);
        }

        return allNodes[0].hashValue == proof;
    }

    verifyClaim(address, claimProof, proof) {
        // check if account exists
        const account = this.accounts.find(a => a.address == address);
        if (account == null) {
            return false;
        } 

        // check if proof is existed
        if (this.proofs.findIndex(p => p == proof) == -1) {
            return false;
        }

        // verify proof
        const validProof = this.verifyClaimProof(claimProof, proof);
        if (!validProof) {
            return false;
        }
        
        return true;
    }

        
}