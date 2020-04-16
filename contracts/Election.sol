pragma  solidity >=0.4.21;
import "./ElectionToken.sol";

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

    int[] public questionaryCounters;

    // Store accounts that have voted
    mapping(address => bool) public voters;
    address[] public addressLUT;

    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    ElectionToken public token;

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

        addVoter(address(bytes20(sha256("0x04d6cE158c414402AAC8135563FB3FCa3688822D"))));
        addVoter(address(bytes20(sha256("0x653F54088D8aD0FEfC931403Be72dF8B6f6DF804"))));
        addVoter(address(bytes20(sha256("0x1D3C4ff70e400C074fc395C5235C8A6aE95b5061"))));
        addVoter(address(bytes20(sha256("0xd444d224DB53921E705B60c962a5d826576Ff9e5"))));
        addVoter(address(bytes20(sha256("0x032E354765Af1359e6ec77907Ea8A9A6E820f220"))));
        addVoter(address(bytes20(sha256("0xE6BC5a72B8148e22AB8D3533BbFD1274695eDC79"))));
        addVoter(address(bytes20(sha256("0x38aAFF758572eB4E0dbB171C6e2bc16fE390ac20"))));
        addVoter(address(bytes20(sha256("0x33Ae4DFFdf52743CdF80942Eb43e53A6f967D131"))));
        addVoter(address(bytes20(sha256("0x657bA408bfe1E6179808da37A0b0402692D8ce37"))));
        addVoter(address(bytes20(sha256("0x565fb45C2D252fa770F3ad7B41d5aeef2Fff702F"))));

        // for (uint index = 0; index < questionaryCounters.length; index++) {
        //     storeCount(index);
        // }
        questionaryCounters = [0,0,0,0,0,0,0,0,0,0,0];

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

        // trigger voted event
        emit votedEvent(_candidateId);
    }

    function getAddressBook() public returns (address[] memory) {
        return addressLUT;
    }

    function size() public returns (uint) {
        return addressLUT.length;
    }

    function addVoter(address addr) private {
        // voters[addr].hasVoted = false;
        // voters[addr] = false;
        // voters[addr] = Voter(addr,false);
        addressLUT.push(addr);
    }

    function storeCount(uint counter) public {
        questionaryCounters[counter]++;
    }
}