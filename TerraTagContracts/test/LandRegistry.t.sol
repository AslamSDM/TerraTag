// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Test, console} from "forge-std/Test.sol";
import {LandRegistry} from "../src/LandRegistry.sol";

contract LandRegistryTest is Test {
    LandRegistry public registry;
    address public user1;
    address public user2;
    string public square1 = "table.chair.lamp";
    string public square2 = "happy.sunny.mountain";
    string public square3 = "brave.noble.knight";

    function setUp() public {
        // Deploy the LandRegistry contract
        registry = new LandRegistry();

        // Create test users with some ETH
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testClaim() public {
        // User1 claims a square
        vm.prank(user1);
        registry.claim(square1);

        // Verify ownership is correctly set
        assertEq(registry.squareOwner(square1), user1);

        // Verify the user's inventory contains the square
        string[] memory inventory = registry.getUserInventory(user1);
        assertEq(inventory.length, 1);
        assertEq(inventory[0], square1);
    }

    function testFailClaimAlreadyClaimedSquare() public {
        // User1 claims the square
        vm.prank(user1);
        registry.claim(square1);

        // User2 tries to claim the same square, which should fail
        vm.prank(user2);
        registry.claim(square1);
    }

    function testRelease() public {
        // First claim a square
        vm.prank(user1);
        registry.claim(square1);

        // Then release it
        vm.prank(user1);
        registry.release(square1);

        // Verify it's no longer owned
        assertEq(registry.squareOwner(square1), address(0));

        // Verify the user's inventory is empty
        string[] memory inventory = registry.getUserInventory(user1);
        assertEq(inventory.length, 0);
    }

    function testFailReleaseNotOwner() public {
        // User1 claims the square
        vm.prank(user1);
        registry.claim(square1);

        // User2 tries to release it, which should fail
        vm.prank(user2);
        registry.release(square1);
    }

    function testSwap() public {
        // Setup: User1 claims square1, User2 claims square2
        vm.prank(user1);
        registry.claim(square1);

        vm.prank(user2);
        registry.claim(square2);

        // User1 initiates a swap
        vm.prank(user1);
        registry.swap(square1, square2, user2);

        // User2 also requests the swap, which should complete it
        vm.prank(user2);
        registry.swap(square2, square1, user1);

        // Verify the ownership has been swapped
        assertEq(registry.squareOwner(square1), user2);
        assertEq(registry.squareOwner(square2), user1);

        // Verify the inventory updates
        string[] memory inventory1 = registry.getUserInventory(user1);
        string[] memory inventory2 = registry.getUserInventory(user2);

        assertEq(inventory1.length, 1);
        assertEq(inventory2.length, 1);
        assertEq(inventory1[0], square2);
        assertEq(inventory2[0], square1);
    }

    function testCancelSwapRequest() public {
        // Setup: User1 claims square1, User2 claims square2
        vm.prank(user1);
        registry.claim(square1);

        vm.prank(user2);
        registry.claim(square2);

        // User1 initiates a swap
        vm.prank(user1);
        registry.swap(square1, square2, user2);

        // Calculate the swap ID (must match the contract's calculation)
        bytes32 swapId = keccak256(
            abi.encodePacked(user1, user2, square1, square2)
        );

        // User1 cancels the swap
        vm.prank(user1);
        registry.cancelSwapRequest(swapId);

        // Now when User2 tries to complete the swap, it will fail as it was cancelled
        vm.expectRevert();
        vm.prank(user2);
        registry.swap(square2, square1, user1);
    }

    function testDeleteUserAndReleaseLands() public {
        // User1 claims multiple squares
        vm.startPrank(user1);
        registry.claim(square1);
        registry.claim(square2);
        registry.claim(square3);
        vm.stopPrank();

        // Verify user1 has all three squares
        string[] memory inventoryBefore = registry.getUserInventory(user1);
        assertEq(inventoryBefore.length, 3);

        // User1 deletes their account
        vm.prank(user1);
        registry.deleteUserAndReleaseLands();

        // Verify all squares are released
        assertEq(registry.squareOwner(square1), address(0));
        assertEq(registry.squareOwner(square2), address(0));
        assertEq(registry.squareOwner(square3), address(0));

        // Verify user1's inventory is empty
        string[] memory inventoryAfter = registry.getUserInventory(user1);
        assertEq(inventoryAfter.length, 0);
    }

    function testGetUserInventory() public {
        // User claims multiple squares
        vm.startPrank(user1);
        registry.claim(square1);
        registry.claim(square2);
        vm.stopPrank();

        // Get the user's inventory
        string[] memory inventory = registry.getUserInventory(user1);

        // Verify inventory content
        assertEq(inventory.length, 2);

        // Verify the squares are in the inventory (order depends on the insertion order)
        bool foundSquare1 = false;
        bool foundSquare2 = false;

        for (uint i = 0; i < inventory.length; i++) {
            if (keccak256(bytes(inventory[i])) == keccak256(bytes(square1))) {
                foundSquare1 = true;
            }
            if (keccak256(bytes(inventory[i])) == keccak256(bytes(square2))) {
                foundSquare2 = true;
            }
        }

        assertTrue(foundSquare1);
        assertTrue(foundSquare2);
    }
}
