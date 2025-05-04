// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title LandRegistry
 * @dev Manages the ownership of land squares represented by what3words strings.
 * Allows users to claim, release, and swap squares.
 * Users can also delete their account, which releases all their owned squares.
 * Note: This is a simplified implementation. Array removals can be gas-intensive.
 * A production version might use different data structures or patterns for inventory management.
 */
contract LandRegistry {
    // --- State Variables ---

    // Mapping from the 3-word address string to the owner's address.
    // address(0) represents an unclaimed square.
    mapping(string => address) public squareOwner;

    // Mapping from a user's address to an array of their owned 3-word address strings.
    // Used for tracking user inventory and facilitating deletion.
    mapping(address => string[]) public userInventory;

    // --- Events ---

    // Emitted when a square is successfully claimed.
    event Claimed(address indexed owner, string squareName);

    // Emitted when a square is successfully released.
    event Released(address indexed previousOwner, string squareName);

    // Emitted when two squares are successfully swapped between two users.
    event Swapped(
        address indexed user1,
        address indexed user2,
        string squareName1,
        string squareName2
    );

    // Emitted when a user deletes their account and releases all lands.
    event UserDeleted(address indexed user);

    // --- Modifiers ---

    // Modifier to check if a square name is valid (not empty)
    modifier validSquareName(string memory squareName) {
        require(
            bytes(squareName).length > 0,
            "LandRegistry: Square name cannot be empty"
        );
        _;
    }

    // --- Functions ---

    /**
     * @notice Allows a user to claim an unclaimed square.
     * @dev The frontend is expected to verify the user's physical presence.
     * @param squareName The 3-word address string of the square to claim.
     */
    function claim(
        string memory squareName
    ) public validSquareName(squareName) {
        address currentOwner = squareOwner[squareName];
        // Require that the square is currently unclaimed (owned by address(0)).
        require(
            currentOwner == address(0),
            "LandRegistry: Square already claimed"
        );

        address claimant = msg.sender;

        // Assign ownership to the caller.
        squareOwner[squareName] = claimant;
        // Add the square to the claimant's inventory array.
        userInventory[claimant].push(squareName);

        // Emit the Claimed event.
        emit Claimed(claimant, squareName);
    }

    /**
     * @notice Allows a user to release a square they own, making it unclaimed.
     * @param squareName The 3-word address string of the square to release.
     */
    function release(
        string memory squareName
    ) public validSquareName(squareName) {
        address currentOwner = squareOwner[squareName];
        address caller = msg.sender;

        // Require that the caller is the current owner of the square.
        require(
            currentOwner == caller,
            "LandRegistry: Caller is not the owner"
        );
        // Require that the square is actually claimed (not already address(0)).
        require(
            currentOwner != address(0),
            "LandRegistry: Square is not claimed"
        );

        // Set the owner back to address(0), making it unclaimed.
        squareOwner[squareName] = address(0);
        // Remove the square from the caller's inventory.
        _removeFromInventory(caller, squareName);

        // Emit the Released event.
        emit Released(caller, squareName);
    }

    /**
     * @notice Allows two users to swap ownership of one square each.
     * @dev This is a basic implementation assumes trust or off-chain agreement.
     * A more secure version would use an approval mechanism.
     * @param mySquareName The square currently owned by the caller (msg.sender).
     * @param theirSquareName The square currently owned by the other user.
     * @param otherUser The address of the other user involved in the swap.
     */
    // Struct to track pending swap requests
    struct SwapRequest {
        address requester;
        address counterparty;
        string requesterSquare;
        string counterpartySquare;
        bool counterpartyApproved;
    }

    // Mapping to store pending swap requests by a unique key (keccak256 of both addresses and squares)
    mapping(bytes32 => SwapRequest) public pendingSwaps;

    // Event for swap request creation
    event SwapRequested(
        address indexed requester,
        address indexed counterparty,
        string requesterSquare,
        string counterpartySquare
    );

    // Event for swap request approval
    event SwapApproved(address indexed approver, bytes32 indexed swapId);

    /**
     * @notice Initiates or completes a swap between two users
     * @param mySquareName The square currently owned by the caller
     * @param theirSquareName The square owned by the other user
     * @param otherUser The address of the other user involved in the swap
     */
    function swap(
        string memory mySquareName,
        string memory theirSquareName,
        address otherUser
    ) public validSquareName(mySquareName) validSquareName(theirSquareName) {
        address caller = msg.sender;

        // Prevent swapping with oneself or with the zero address
        require(
            otherUser != address(0),
            "LandRegistry: Cannot swap with the zero address"
        );
        require(otherUser != caller, "LandRegistry: Cannot swap with yourself");

        // Verify ownership of the caller's square
        require(
            squareOwner[mySquareName] == caller,
            "LandRegistry: You do not own your specified square"
        );
        require(
            squareOwner[theirSquareName] == otherUser,
            "LandRegistry: The other user does not own their specified square"
        );

        // Create unique swap ID
        bytes32 swapId = keccak256(
            abi.encodePacked(caller, otherUser, mySquareName, theirSquareName)
        );
        bytes32 reverseSwapId = keccak256(
            abi.encodePacked(otherUser, caller, theirSquareName, mySquareName)
        );

        // Check if the counterparty already requested this swap
        if (pendingSwaps[reverseSwapId].requester == otherUser) {
            // Counterparty already requested this exact swap, execute it

            // Update square ownership
            squareOwner[mySquareName] = otherUser;
            squareOwner[theirSquareName] = caller;

            // Update inventories
            _removeFromInventory(caller, mySquareName);
            _removeFromInventory(otherUser, theirSquareName);
            userInventory[caller].push(theirSquareName);
            userInventory[otherUser].push(mySquareName);

            // Clean up the pending swap
            delete pendingSwaps[reverseSwapId];

            // Emit swap completed event
            emit Swapped(caller, otherUser, mySquareName, theirSquareName);
        } else {
            // Create new swap request
            pendingSwaps[swapId] = SwapRequest({
                requester: caller,
                counterparty: otherUser,
                requesterSquare: mySquareName,
                counterpartySquare: theirSquareName,
                counterpartyApproved: false
            });

            // Emit swap requested event
            emit SwapRequested(
                caller,
                otherUser,
                mySquareName,
                theirSquareName
            );
        }
    }

    /**
     * @notice Cancels a previously requested swap
     * @param swapId The ID of the swap request to cancel
     */
    function cancelSwapRequest(bytes32 swapId) public {
        SwapRequest storage request = pendingSwaps[swapId];
        require(
            request.requester == msg.sender,
            "LandRegistry: Not the swap requester"
        );
        delete pendingSwaps[swapId];
    }

    /**
     * @notice Allows a user to delete their account, releasing all owned squares.
     * @dev Iterates through the user's inventory and releases each square.
     * This can be gas-intensive for users with many squares.
     */
    function deleteUserAndReleaseLands() public {
        address user = msg.sender;
        string[] storage inventory = userInventory[user];
        uint256 inventorySize = inventory.length;

        // Require the user to actually have squares to release (or an inventory entry).
        // require(inventorySize > 0, "LandRegistry: No lands to release"); // Optional check

        // Iterate through the inventory *backwards* because _removeFromInventory shifts elements.
        // Releasing squares one by one.
        for (uint256 i = inventorySize; i > 0; i--) {
            // Get the square name from the end of the array (most efficient removal target)
            string memory squareNameToRelease = inventory[i - 1];

            // Ensure the square is still owned by the user (consistency check)
            if (squareOwner[squareNameToRelease] == user) {
                // Set owner to address(0)
                squareOwner[squareNameToRelease] = address(0);
                // Emit release event for each square
                emit Released(user, squareNameToRelease);
                // Note: We don't call _removeFromInventory here because we delete the whole array later.
            }
            // If ownership somehow changed, we skip releasing but still proceed with deletion.
        }

        // Delete the entire inventory array for the user.
        delete userInventory[user];

        // Emit the UserDeleted event.
        emit UserDeleted(user);
    }

    /**
     * @notice Retrieves the list of squares owned by a specific user.
     * @param user The address of the user whose inventory is requested.
     * @return An array of 3-word address strings owned by the user.
     */
    function getUserInventory(
        address user
    ) public view returns (string[] memory) {
        return userInventory[user];
    }

    // --- Internal Helper Functions ---

    /**
     * @notice Internal function to remove a square from a user's inventory array.
     * @dev This implementation finds the square and replaces it with the last element,
     * then pops the last element. This avoids shifting all subsequent elements but
     * changes the order of the inventory array. It's more gas-efficient than shifting.
     * @param user The address of the user.
     * @param squareName The 3-word address string to remove.
     */
    function _removeFromInventory(
        address user,
        string memory squareName
    ) internal {
        string[] storage inventory = userInventory[user];
        uint256 len = inventory.length;

        // Find the index of the squareName to remove.
        for (uint256 i = 0; i < len; i++) {
            // Use keccak256 for string comparison as '==' is not directly supported for storage strings.
            if (
                keccak256(bytes(inventory[i])) == keccak256(bytes(squareName))
            ) {
                // Replace the found element with the last element.
                inventory[i] = inventory[len - 1];
                // Remove the last element (which is now a duplicate or the target element if it was last).
                inventory.pop();
                // Exit the loop once the element is found and removed.
                return;
            }
        }
        // Optional: Revert if the square wasn't found in the inventory (should not happen if logic is correct).
        // require(false, "LandRegistry: Square not found in inventory for removal");
    }
}
