// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract FactoryImplementation is Initializable, OwnableUpgradeable {
    address public beacon;
    mapping(uint256 => address) public projects;
    uint256 public projectCounter;

    event ProjectCreated(uint256 indexed projectId, address indexed projectContract, address indexed owner);

    function initialize(address _beacon) public initializer {
        __Ownable_init();
        beacon = _beacon;
    }

    function createProject(
        string memory _landDetails,
        uint256 _startDate
    ) external returns (address) {
        uint256 projectId = ++projectCounter;

        bytes memory initData = abi.encodeWithSignature(
            "initialize(uint256,address,string,uint256)",
            projectId,
            msg.sender,
            _landDetails,
            _startDate
        );

        BeaconProxy projectProxy = new BeaconProxy(beacon, initData);
        address projectAddress = address(projectProxy);

        projects[projectId] = projectAddress;

        emit ProjectCreated(projectId, projectAddress, msg.sender);
        return projectAddress;
    }

    function getProject(uint256 projectId) external view returns (address) {
        return projects[projectId];
    }
}
