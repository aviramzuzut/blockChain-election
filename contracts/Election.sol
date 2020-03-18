pragma  solidity >=0.4.21;

contract Election {

    struct Candidate {
    uint id;
    string name;
    uint voteCount;
}

    // Constructor
    constructor () public {
        addCandidate("Bibi");
        addCandidate("Gantz");
        addCandidate("Bennet");
    }
    // Store candidate
    uint public candidatesCount;

    function addCandidate (string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name,0);
    }

    // Fetch candidate
    mapping(uint => Candidate) public candidates;
}