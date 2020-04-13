pragma  solidity >=0.4.21;
import "./ERC20.sol";

contract Election {

    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        address voterAddress;
        bool hasVoted;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    // ElectionToken public token;

    string private countDownDate = "Apr 4, 2021 15:17:25";

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    // Constructor
    constructor () public {
        addCandidate("Bibi");
        addCandidate("Gantz");
        addCandidate("Bennet");

        // addVoter(address(0x04d6cE158c414402AAC8135563FB3FCa3688822D));
        // addVoter(address(0x653F54088D8aD0FEfC931403Be72dF8B6f6DF804));
        // addVoter(address(0x1D3C4ff70e400C074fc395C5235C8A6aE95b5061));
        // addVoter(address(0xd444d224DB53921E705B60c962a5d826576Ff9e5));
        // addVoter(address(0x032E354765Af1359e6ec77907Ea8A9A6E820f220));
        // addVoter(address(0xE6BC5a72B8148e22AB8D3533BbFD1274695eDC79));
        // addVoter(address(0x38aAFF758572eB4E0dbB171C6e2bc16fE390ac20));
        // addVoter(address(0x33Ae4DFFdf52743CdF80942Eb43e53A6f967D131));
        // addVoter(address(0x657bA408bfe1E6179808da37A0b0402692D8ce37));
        // addVoter(address(0x565fb45C2D252fa770F3ad7B41d5aeef2Fff702F));
    }

    function addCandidate (string memory _name) public returns (bool) {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name,0);
        return true;
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        
        // require(!voters[msg.sender].hasVoted);
        require(!voters[msg.sender]);

        // require that they haven't voted before
        // require(voters[msg.sender].voterAddress != address(0));

        // require that they voted in allowed time

        require(((2021 * 365 * 1 days) + (120 * 1 days) + (15 * 1 hours) ) >= now );

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        // voters[msg.sender].hasVoted = true;
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // pay with ERC20 token
        // address to = msg.sender;
        // token.transferFrom(address(this), to, 100);

        // trigger voted event
        emit votedEvent(_candidateId);
    }

    function addVoter(address addr) private {
        // voters[addr].hasVoted = false;
        voters[addr] = false;
        // voters[addr] = Voter(addr,false);
    }
}