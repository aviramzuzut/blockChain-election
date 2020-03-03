pragma  solidity >=0.4.21;

contract Election {
    // Constructor
    constructor () public {
        candidate = "Bibi";
    }

    // Store candidate
    // Read candidate
    string public candidate;
}