// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FunctionsRequest
 * @notice Chainlink Functions request data struct and CBOR encoding logic.
 * @dev https://github.com/smartcontractkit/functions-solidity/blob/main/src/v0.8/dev/functions/FunctionsRequest.sol
 */
library FunctionsRequest {
    struct Request {
        string source;
        string[] args;
        bytes secrets;
        uint64 subscriptionId;
        uint32 gasLimit;
        bytes32 donId;
    }

    function initializeRequestForInlineJavaScript(Request memory req, string memory source) internal pure {
        req.source = source;
    }

    function setArgs(Request memory req, string[] memory args) internal pure {
        req.args = args;
    }

    function setSecrets(Request memory req, bytes memory secrets) internal pure {
        req.secrets = secrets;
    }

    function setSubscriptionId(Request memory req, uint64 subscriptionId) internal pure {
        req.subscriptionId = subscriptionId;
    }

    function setGasLimit(Request memory req, uint32 gasLimit) internal pure {
        req.gasLimit = gasLimit;
    }

    function setDonId(Request memory req, bytes32 donId) internal pure {
        req.donId = donId;
    }

    // Dummy CBOR encoding for demonstration (replace with real encoding in production)
    function encodeCBOR(Request memory req) internal pure returns (bytes memory) {
        return abi.encode(req.source, req.args, req.secrets, req.subscriptionId, req.gasLimit, req.donId);
    }
} 