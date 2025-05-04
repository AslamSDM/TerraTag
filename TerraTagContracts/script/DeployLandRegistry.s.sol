// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Script, console} from "forge-std/Script.sol";
import {LandRegistry} from "../src/LandRegistry.sol";

contract DeployLandRegistryWithConfig is Script {
    function run() public returns (LandRegistry) {
        // Get deployment configuration from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Log deployment information
        console.log("Deploying LandRegistry contract");
        console.log("Network: ", block.chainid);

        // Start the broadcast with the deployer's private key
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the LandRegistry contract
        LandRegistry registry = new LandRegistry();

        // Log the deployed contract address
        console.log("LandRegistry deployed at:", address(registry));

        vm.stopBroadcast();

        return registry;
    }
}
