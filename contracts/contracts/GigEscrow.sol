// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IReputationBadge {
    function mintBadge(address recipient, uint8 badgeType, uint256 value) external;
}

/// @title GigEscrow — Core trust engine for GigChain decentralized freelance platform
/// @notice Manages milestone-based escrow payments between clients and freelancers
contract GigEscrow is ReentrancyGuard, ERC2771Context {
    using SafeERC20 for IERC20;

    // ─── State Machine ────────────────────────────────────────────────────────────
    enum State {
        Open,
        InProgress,
        Completed,
        Disputed,
        CancelledByClient,
        CancelledByFreelancer
    }

    // ─── Data Structures ──────────────────────────────────────────────────────────
    struct Milestone {
        string description;
        uint256 value;
        bool completed;
    }

    struct Gig {
        uint256 gigId;
        address payable client;
        address payable freelancer;
        uint256 totalBudget;
        string description; // IPFS CID
        State state;
        bool exists;
        uint256 completedMilestoneCount;
        address token; // address(0) = ETH, else ERC-20
        uint256 startTime;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────────
    uint256 public gigCount;
    address public arbitrator;
    address public reputationBadgeContract;
    bool public badgesEnabled;

    // Staking params (for bidding)
    address public stakeToken; // address(0) = ETH
    uint256 public stakeAmount; // 0 = no staking required

    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => Milestone[]) public gigMilestones;
    mapping(uint256 => address[]) private _bidderList;
    mapping(uint256 => mapping(address => bool)) public hasBid;
    mapping(uint256 => mapping(address => uint256)) public bidStakes;

    // Reputation tracking
    mapping(address => uint256) public completedGigs;
    mapping(address => uint256) public totalEarnings;
    mapping(address => uint256) public currentStreak;
    mapping(address => uint256) public disputeFreeCount;

    // ─── Events ───────────────────────────────────────────────────────────────────
    event GigPosted(uint256 indexed gigId, address indexed client, uint256 totalBudget, address token);
    event BidPlaced(uint256 indexed gigId, address indexed bidder);
    event FreelancerSelected(uint256 indexed gigId, address indexed freelancer);
    event MilestoneReleased(uint256 indexed gigId, uint256 milestoneIndex, uint256 amount);
    event GigCompleted(uint256 indexed gigId);
    event DisputeRaised(uint256 indexed gigId, address indexed raisedBy, string reason);
    event DisputeResolved(uint256 indexed gigId, bool releasedToFreelancer, bytes resolutionData);
    event GigCancelled(uint256 indexed gigId, State cancellationState);
    event ArbitratorChanged(address indexed oldArbitrator, address indexed newArbitrator);

    // ─── Modifiers ────────────────────────────────────────────────────────────────
    modifier onlyClient(uint256 gigId) {
        require(_msgSender() == gigs[gigId].client, "GigEscrow: Not the client");
        _;
    }

    modifier onlyFreelancer(uint256 gigId) {
        require(_msgSender() == gigs[gigId].freelancer, "GigEscrow: Not the freelancer");
        _;
    }

    modifier onlyArbitrator() {
        require(_msgSender() == arbitrator, "GigEscrow: Not the arbitrator");
        _;
    }

    modifier inState(uint256 gigId, State expectedState) {
        require(gigs[gigId].state == expectedState, "GigEscrow: Invalid state");
        _;
    }

    modifier gigExists(uint256 gigId) {
        require(gigs[gigId].exists, "GigEscrow: Gig does not exist");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────────
    constructor(
        address _arbitrator,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) {
        require(_arbitrator != address(0), "GigEscrow: Zero arbitrator");
        arbitrator = _arbitrator;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────────

    /// @notice Client posts a new gig and locks funds
    function postGig(
        address _token,
        string calldata _description,
        string[] calldata _milestoneDescriptions,
        uint256[] calldata _milestoneValues
    ) external payable nonReentrant {
        require(
            _milestoneDescriptions.length == _milestoneValues.length,
            "GigEscrow: Array length mismatch"
        );
        require(
            _milestoneDescriptions.length >= 1 && _milestoneDescriptions.length <= 10,
            "GigEscrow: Must have 1-10 milestones"
        );

        uint256 total = 0;
        for (uint256 i = 0; i < _milestoneValues.length; i++) {
            require(_milestoneValues[i] > 0, "GigEscrow: Milestone value must be > 0");
            total += _milestoneValues[i];
        }

        // Lock funds
        if (_token == address(0)) {
            require(msg.value == total, "GigEscrow: ETH sent must equal total budget");
        } else {
            require(msg.value == 0, "GigEscrow: Do not send ETH for token gig");
            IERC20(_token).safeTransferFrom(_msgSender(), address(this), total);
        }

        uint256 gigId = ++gigCount;

        gigs[gigId] = Gig({
            gigId: gigId,
            client: payable(_msgSender()),
            freelancer: payable(address(0)),
            totalBudget: total,
            description: _description,
            state: State.Open,
            exists: true,
            completedMilestoneCount: 0,
            token: _token,
            startTime: 0
        });

        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            gigMilestones[gigId].push(
                Milestone({
                    description: _milestoneDescriptions[i],
                    value: _milestoneValues[i],
                    completed: false
                })
            );
        }

        emit GigPosted(gigId, _msgSender(), total, _token);
    }

    /// @notice Freelancer places a bid (with optional stake)
    function bidGig(uint256 gigId) external payable nonReentrant gigExists(gigId) inState(gigId, State.Open) {
        require(!hasBid[gigId][_msgSender()], "GigEscrow: Already bid on this gig");
        require(_msgSender() != gigs[gigId].client, "GigEscrow: Client cannot bid on own gig");

        if (stakeAmount > 0) {
            if (stakeToken == address(0)) {
                require(msg.value == stakeAmount, "GigEscrow: Must stake correct ETH amount");
            } else {
                require(msg.value == 0, "GigEscrow: Do not send ETH for token stake");
                IERC20(stakeToken).safeTransferFrom(_msgSender(), address(this), stakeAmount);
            }
            bidStakes[gigId][_msgSender()] = stakeAmount;
        }

        hasBid[gigId][_msgSender()] = true;
        _bidderList[gigId].push(_msgSender());

        emit BidPlaced(gigId, _msgSender());
    }

    /// @notice Client selects a freelancer from bidders
    function selectFreelancer(
        uint256 gigId,
        address payable _freelancer
    ) external nonReentrant gigExists(gigId) onlyClient(gigId) inState(gigId, State.Open) {
        require(_freelancer != address(0), "GigEscrow: Zero address");
        if (stakeAmount > 0) {
            require(hasBid[gigId][_freelancer], "GigEscrow: Freelancer must have bid first");
        }

        gigs[gigId].freelancer = _freelancer;
        gigs[gigId].state = State.InProgress;
        gigs[gigId].startTime = block.timestamp;

        emit FreelancerSelected(gigId, _freelancer);
    }

    /// @notice Client releases payment for a specific milestone
    function releaseMilestonePayment(
        uint256 gigId,
        uint256 milestoneIndex
    ) external nonReentrant gigExists(gigId) onlyClient(gigId) inState(gigId, State.InProgress) {
        require(milestoneIndex < gigMilestones[gigId].length, "GigEscrow: Invalid milestone index");
        Milestone storage ms = gigMilestones[gigId][milestoneIndex];
        require(!ms.completed, "GigEscrow: Milestone already released");

        ms.completed = true;
        gigs[gigId].completedMilestoneCount++;

        uint256 amount = ms.value;
        address payable freelancer = gigs[gigId].freelancer;
        address token = gigs[gigId].token;

        _sendFunds(token, freelancer, amount);

        emit MilestoneReleased(gigId, milestoneIndex, amount);

        // Check if all milestones are now completed
        if (gigs[gigId].completedMilestoneCount == gigMilestones[gigId].length) {
            gigs[gigId].state = State.Completed;
            _updateReputation(gigId, freelancer);
            emit GigCompleted(gigId);

            // Return stake to freelancer upon successful completion
            if (bidStakes[gigId][freelancer] > 0) {
                uint256 stake = bidStakes[gigId][freelancer];
                bidStakes[gigId][freelancer] = 0;
                _sendFunds(stakeToken, freelancer, stake);
            }
        }
    }

    /// @notice Either party raises a dispute — halts milestone releases
    function raiseDispute(
        uint256 gigId,
        string calldata reason
    ) external nonReentrant gigExists(gigId) inState(gigId, State.InProgress) {
        require(
            _msgSender() == gigs[gigId].client || _msgSender() == gigs[gigId].freelancer,
            "GigEscrow: Only client or freelancer can raise dispute"
        );

        gigs[gigId].state = State.Disputed;
        currentStreak[gigs[gigId].freelancer] = 0; // Reset streak on dispute

        emit DisputeRaised(gigId, _msgSender(), reason);
    }

    /// @notice Arbitrator resolves dispute — pays freelancer or refunds client
    function submitDisputeResolution(
        uint256 gigId,
        bool _releaseToFreelancer,
        bytes calldata _resolutionData
    ) external nonReentrant gigExists(gigId) onlyArbitrator inState(gigId, State.Disputed) {
        Gig storage gig = gigs[gigId];

        // Sum up unreleased milestone values
        uint256 remaining = 0;
        for (uint256 i = 0; i < gigMilestones[gigId].length; i++) {
            if (!gigMilestones[gigId][i].completed) {
                remaining += gigMilestones[gigId][i].value;
            }
        }

        if (_releaseToFreelancer) {
            gig.state = State.Completed;
            _sendFunds(gig.token, gig.freelancer, remaining);
            _updateReputation(gigId, gig.freelancer);
        } else {
            gig.state = State.CancelledByClient;
            _sendFunds(gig.token, gig.client, remaining);
        }

        emit DisputeResolved(gigId, _releaseToFreelancer, _resolutionData);
    }

    /// @notice Client cancels an Open gig and recovers all funds
    function cancelGigByClient(
        uint256 gigId
    ) external nonReentrant gigExists(gigId) onlyClient(gigId) inState(gigId, State.Open) {
        gigs[gigId].state = State.CancelledByClient;
        _sendFunds(gigs[gigId].token, gigs[gigId].client, gigs[gigId].totalBudget);
        emit GigCancelled(gigId, State.CancelledByClient);
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────────

    function setArbitrator(address _newArbitrator) external onlyArbitrator {
        require(_newArbitrator != address(0), "GigEscrow: Zero address");
        emit ArbitratorChanged(arbitrator, _newArbitrator);
        arbitrator = _newArbitrator;
    }

    function setReputationBadgeContract(address _badge) external onlyArbitrator {
        reputationBadgeContract = _badge;
    }

    function toggleBadges(bool _enabled) external onlyArbitrator {
        badgesEnabled = _enabled;
    }

    function setStakeParams(address _stakeToken, uint256 _stakeAmount) external onlyArbitrator {
        stakeToken = _stakeToken;
        stakeAmount = _stakeAmount;
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getMilestones(uint256 gigId) external view returns (Milestone[] memory) {
        return gigMilestones[gigId];
    }

    function getBidders(uint256 gigId) external view returns (address[] memory) {
        return _bidderList[gigId];
    }

    function getMilestoneCount(uint256 gigId) external view returns (uint256) {
        return gigMilestones[gigId].length;
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────────

    function _sendFunds(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "GigEscrow: ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _updateReputation(uint256 gigId, address freelancer) internal {
        completedGigs[freelancer]++;
        totalEarnings[freelancer] += gigs[gigId].totalBudget;
        currentStreak[freelancer]++;
        disputeFreeCount[freelancer]++;

        if (badgesEnabled && reputationBadgeContract != address(0)) {
            try IReputationBadge(reputationBadgeContract).mintBadge(freelancer, 0, completedGigs[freelancer]) {} catch {}
            try IReputationBadge(reputationBadgeContract).mintBadge(freelancer, 1, totalEarnings[freelancer]) {} catch {}
            try IReputationBadge(reputationBadgeContract).mintBadge(freelancer, 2, currentStreak[freelancer]) {} catch {}
            try IReputationBadge(reputationBadgeContract).mintBadge(freelancer, 3, disputeFreeCount[freelancer]) {} catch {}
        }
    }

    // ─── ERC2771Context Overrides ─────────────────────────────────────────────────

    function _msgSender() internal view override(ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
