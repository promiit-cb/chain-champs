// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Factory {
    mapping(string => address) public gameContracts;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    function createGameContract(
        string calldata _gameName,
        string calldata _team1,
        string calldata _team2
    ) public onlyOwner {
        require(gameContracts[_gameName] == address(0), "Game already exists");
        Game game = new Game(_team1, _team2, owner);
        gameContracts[_gameName] = address(game);
    }

    function getGameContract(
        string memory _gameName
    ) public view returns (address) {
        return gameContracts[_gameName];
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
}

contract Game {
    address public owner;
    string public team1;
    string public team2;
    bool private lock;
    bool public gameEnded;

    struct Wager {
        uint amount;
        string team;
        bool winner;
    }
    mapping(address => Wager) public balances;
    address[] public betters;

    event Deposit(address sender, uint amount);

    constructor(string memory _team1, string memory _team2, address _owner) {
        team1 = _team1;
        team2 = _team2;
        owner = _owner;
        gameEnded = false;
    }

    function lockBetting() public onlyOwner {
        if (!lock) {
            lock = true;
        }
    }

    function endGame(string calldata winningTeam) public onlyOwner {
        require(lock, "Betting is still open");
        // We don't want to pay out multiple times by calling this function
        require(!gameEnded, "Game already ended once");

        uint winnersAmount = 0;
        uint losersAmount = 0;

        // Calculate total winners pool and losers pool
        for (uint256 i = 0; i < betters.length; i++) {
            Wager storage wager = balances[betters[i]]; // *** CHECK IF THIS IS PASS BY REFERNCE ***

            if (
                keccak256(abi.encodePacked(wager.team)) ==
                keccak256(abi.encodePacked(winningTeam))
            ) {
                wager.winner = true;
                winnersAmount += wager.amount;
            } else {
                losersAmount += wager.amount;
            }
        }

        // Pay out winners
        for (uint256 i = 0; i < betters.length; i++) {
            address better = betters[i];
            Wager storage wager = balances[better];
            if (wager.winner) {
                uint payout = wager.amount +
                    ((wager.amount * losersAmount) / winnersAmount);
                payable(better).transfer(payout);
            }
        }

        gameEnded = true;
    }

    function deposit(string calldata teamName) public payable {
        require(!lock, "Deposits are no longer accepted");
        require(
            keccak256(abi.encodePacked(teamName)) ==
                keccak256(abi.encodePacked(team1)) ||
                keccak256(abi.encodePacked(teamName)) ==
                keccak256(abi.encodePacked(team2)),
            "Invalid team name"
        );

        // Add to betters array only if new better
        if (balances[msg.sender].amount == 0) {
            betters.push(msg.sender);
        }

        balances[msg.sender].amount += msg.value;
        balances[msg.sender].team = teamName;

        // Emit event for handling
        emit Deposit(msg.sender, msg.value);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
}
