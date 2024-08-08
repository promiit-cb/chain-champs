// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Factory {
    address private owner;
    mapping(string => address) public gameContracts;
    address[] public deployedGames;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function createGameContract(
        string calldata _gameName,
        string calldata _team1,
        string calldata _team2
    ) public onlyOwner {
        require(gameContracts[_gameName] == address(0), "Game already exists");
        Game game = new Game(_team1, _team2, owner);
        gameContracts[_gameName] = address(game);
        deployedGames.push(address(game));
    }

    function getDeployedGames() public view returns (address[] memory) {
        return deployedGames;
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
    uint public team1Pool;
    uint public team2Pool;
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

    function getBalances() public view returns (address[] memory) {
        return betters;
    }

    function endGame(string calldata winningTeam) public onlyOwner {
        require(lock, "Betting is still open");
        // We don't want to pay out multiple times by calling this function
        require(!gameEnded, "Game already ended once");

        uint winnersAmount;
        uint losersAmount;
        if (
            keccak256(abi.encodePacked(winningTeam)) ==
            keccak256(abi.encodePacked(team1))
        ) {
            winnersAmount = team1Pool;
            losersAmount = team2Pool;
        } else {
            winnersAmount = team2Pool;
            losersAmount = team1Pool;
        }

        // Pay out winners
        for (uint256 i = 0; i < betters.length; i++) {
            address better = betters[i];
            Wager storage wager = balances[better];
            if (
                keccak256(abi.encodePacked(wager.team)) ==
                keccak256(abi.encodePacked(winningTeam))
            ) {
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
        if (balances[msg.sender].amount > 0) {
            require(
                keccak256(abi.encodePacked(balances[msg.sender].team)) ==
                    keccak256(abi.encodePacked(teamName)),
                "Cannot bet on a different team"
            );
        } else {
            // Add to betters array only if new better
            betters.push(msg.sender);
        }

        balances[msg.sender].amount += msg.value;
        balances[msg.sender].team = teamName;

        if (
            keccak256(abi.encodePacked(teamName)) ==
            keccak256(abi.encodePacked(team1))
        ) {
            team1Pool += msg.value;
        } else if (
            keccak256(abi.encodePacked(teamName)) ==
            keccak256(abi.encodePacked(team2))
        ) {
            team2Pool += msg.value;
        }

        // Emit event for handling
        emit Deposit(msg.sender, msg.value);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
}
