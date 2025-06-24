// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

interface ICarbonProjectFactory {
    function createProject(string memory landDetails, uint256 startDate) external returns (address);
}

contract MainManager is Initializable, OwnableUpgradeable {
    ICarbonProjectFactory public factory;
    UpgradeableBeacon public beacon;

    // Chainlink configuration that applies to all projects
    bytes32 public donId;
    uint64 public subscriptionId;
    string public defaultSource;

    event ProjectManagerInitialized(address factory, address beacon);
    event GlobalConfigUpdated(bytes32 donId, uint64 subscriptionId);

    function initialize(
        address _factory,
        address _beacon
    ) public initializer {
        __Ownable_init();
        factory = ICarbonProjectFactory(_factory);
        beacon = UpgradeableBeacon(_beacon);

        emit ProjectManagerInitialized(_factory, _beacon);
    }

    function setGlobalChainlinkConfig(
        bytes32 _donId,
        uint64 _subscriptionId,
        string memory _source
    ) external onlyOwner {
        donId = _donId;
        subscriptionId = _subscriptionId;
        defaultSource = _source;

        emit GlobalConfigUpdated(_donId, _subscriptionId);
    }

    function createProject(
        string memory landDetails
    ) external returns (address) {
        return factory.createProject(landDetails, block.timestamp);
    }

    function upgradeProjectImplementation(address newImplementation) external onlyOwner {
        beacon.upgradeTo(newImplementation);
    }
}
