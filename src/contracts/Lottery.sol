// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract Lottery {
    address public manager;
    address[] public players;
    address payable public winner;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        players.push(msg.sender);
    }

    function random() private view returns (uint) {
        return
            uint(
                keccak256(
                    abi.encode(block.prevrandao, block.timestamp, players)
                )
            );
    }

    function pickWinnerAndPay() public restricted {
        uint contractBalance = address(this).balance;
        uint index = random() % players.length;
        winner = payable(players[index]);
        winner.transfer(contractBalance);
    }

    function reset() public restricted {
        players = new address[](0);
        winner = payable(address(0));
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }
}
