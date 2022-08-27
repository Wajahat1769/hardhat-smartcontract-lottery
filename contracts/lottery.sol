// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
/**
what we wanna do here
1-we want that player can enter lottery by paying lottery price
2-we want our winner to be random(verifiably random) not tempered
3- we want our lottery results every x minutes or months and it should need no maintainance
4- to get randomness and events to trigger we need chainlink oracles and chainlink keepers
 to execute smart lottery again
 */

//custom errors
error Lottery__NotEnoughamount();
error Lottery__ExtraAmount();
error Lottery__withdrawlFailure();
error Lottery__lotteryStateNotOpen();
error Lottery__UpKeepFailed(uint256, uint256, uint256);

//contract
contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    //data types

    enum lotteryStates {
        OPEN,
        CALCULATING
    }

    // state Variables
    address payable[] private players;
    uint256 private immutable i_entranceFee;
    VRFCoordinatorV2Interface coordinator;
    bytes32 immutable i_gasLane;
    uint64 immutable i_subscriptionId;
    uint16 constant REQUEST_CONFIRMATIONS = 3;
    uint32 immutable i_callbackGasLimit;
    uint32 constant NUM_WORDS = 1;

    address s_recentWinner;
    lotteryStates _lotteryStates;
    uint256 private immutable interval;
    uint256 private lastTimeStamp;
    //events (events named should be reverse function name)
    event raffleEnter(address indexed player);
    event raffleWinnerRequestId(uint256 indexed requestId);
    event raffleWinner(address indexed winner);

    // we also initialized VRFConsumerBaseV2 constructor
    constructor(
        address coordinatorV2,
        uint256 entranceFee,
        bytes32 _gaslane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(coordinatorV2) {
        i_entranceFee = entranceFee;
        coordinator = VRFCoordinatorV2Interface(coordinatorV2);
        i_gasLane = _gaslane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        _lotteryStates = lotteryStates.OPEN;
        interval = _interval;
        lastTimeStamp = block.timestamp;
    }

    //functions
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            // msg.value is the money sent through smartcontract
            revert Lottery__NotEnoughamount();
        }
        if (msg.value > i_entranceFee) {
            revert Lottery__ExtraAmount();
        }
        if (_lotteryStates != lotteryStates.OPEN) {
            revert Lottery__lotteryStateNotOpen();
        }
        players.push(payable(msg.sender)); //casting transaction sender address as a payable address
        emit raffleEnter(msg.sender);
    }

    function performUpkeep(bytes calldata performData) external override {
        //get a random number
        // do smthg with it

        (bool check, ) = checkUpkeep(performData);
        if (!check)
            revert Lottery__UpKeepFailed(
                address(this).balance,
                players.length,
                uint256(_lotteryStates)
            );
        _lotteryStates = lotteryStates.CALCULATING;
        uint256 requestId = coordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit raffleWinnerRequestId(requestId);
    }

    //finding the winner and sending the money
    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 winnerNumber = randomWords[0] % players.length;
        address payable winnerAddress = players[winnerNumber];
        s_recentWinner = winnerAddress;
        _lotteryStates = lotteryStates.OPEN;
        players = new address payable[](0);
        lastTimeStamp = block.timestamp;
        (bool success, ) = winnerAddress.call{value: address(this).balance}("");

        if (!success) {
            revert Lottery__withdrawlFailure();
        }
        emit raffleWinner(winnerAddress);
    }

    // function isOpen() public view returns (bool) {
    //     return (lotteryStates.OPEN == _lotteryStates);
    // }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return players[index];
    }

    function getRecentWinnerAddress() public view returns (address) {
        return s_recentWinner;
    }

    function checkUpkeep(
        bytes calldata /**checkdata */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /**performedData */
        )
    {
        bool isOpen = (_lotteryStates == lotteryStates.OPEN);
        bool hasPlayers = (players.length > 0);
        bool timePassed = ((block.timestamp - lastTimeStamp) > interval);
        bool balance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && hasPlayers && timePassed && balance);
        return (upkeepNeeded, "");
    }

    function getRaffleState() public view returns (lotteryStates) {
        return _lotteryStates;
    }

    function getInterval() public view returns (uint256) {
        return interval;
    }

    function changeLotteryState() public {
        if (_lotteryStates == lotteryStates.OPEN) {
            _lotteryStates = lotteryStates.CALCULATING;
        } else {
            _lotteryStates = lotteryStates.OPEN;
        }
    }
}
