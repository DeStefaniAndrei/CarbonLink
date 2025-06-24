// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract FactoryImplementation is Initializable, ERC20Upgradeable, OwnableUpgradeable, FunctionsClient {
    // Project state
    uint256 public projectId;
    string public landDetails;
    uint256 public startDate;
    address public projectOwner;

    // Buffer pool (10% as specified)
    uint256 public constant BUFFER_PERCENTAGE = 10;
    uint256 public bufferCredits;
    uint256 public totalCreditsIssued;

    // Chainlink Functions configuration
    bytes32 public donId;
    uint64 public subscriptionId;
    string public source;
    mapping(bytes32 => bool) public pendingRequests;

    event CarbonDataRequested(bytes32 indexed requestId);
    event CreditsIssued(uint256 tradableAmount, uint256 bufferAmount);
    event BufferUsed(uint256 amount);

    // Custom initializer since we can't use constructors in upgradeable contracts [4]
    function initialize(
        uint256 _projectId,
        address _projectOwner,
        string memory _landDetails,
        uint256 _startDate
    ) public initializer {
        __ERC20_init(
            string(abi.encodePacked("CarbonLink", _projectId)),
            string(abi.encodePacked("CL", _projectId))
        );
        __Ownable_init();
        FunctionsClient.__FunctionsClient_init(0xb83E47C2bC239B3bf370bc41e1459A34b41238D0); // Sepolia router

        projectId = _projectId;
        projectOwner = _projectOwner;
        landDetails = _landDetails;
        startDate = _startDate;
    }

    function setChainlinkConfig(
        bytes32 _donId,
        uint64 _subscriptionId,
        string memory _source
    ) external onlyOwner {
        donId = _donId;
        subscriptionId = _subscriptionId;
        source = _source;
    }

    function requestCarbonData() external {
        require(msg.sender == projectOwner, "Not project owner");
        require(bytes(source).length > 0, "Source not configured");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        string[] memory args = new string[](1);
        args[0] = landDetails;
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            300000,
            donId
        );

        pendingRequests[requestId] = true;
        emit CarbonDataRequested(requestId);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        require(pendingRequests[requestId], "Invalid request");
        delete pendingRequests[requestId];

        if (err.length > 0) return;

        uint256 carbonValue = abi.decode(response, (uint256));

        // Issue credits with buffer if threshold met
        if (carbonValue >= 1000) { // Configurable threshold
            uint256 bufferAmount = (carbonValue * BUFFER_PERCENTAGE) / 100;
            uint256 tradableAmount = carbonValue - bufferAmount;

            _mint(projectOwner, tradableAmount);
            _mint(address(this), bufferAmount);

            bufferCredits += bufferAmount;
            totalCreditsIssued += carbonValue;

            emit CreditsIssued(tradableAmount, bufferAmount);
        }
    }

    function handleReversal(uint256 amount) external onlyOwner {
        require(bufferCredits >= amount, "Insufficient buffer");
        _burn(address(this), amount);
        bufferCredits -= amount;
        emit BufferUsed(amount);
    }

}
