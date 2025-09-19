# 🤑 Blockchain-based Collaborative Investment Club

Welcome to a decentralized platform for collaborative investment clubs, built on the Stacks blockchain using Clarity smart contracts. This project enables groups to pool funds, vote on investment decisions, and manage payouts transparently, solving real-world problems of trust, transparency, and accessibility in collective investing.

## ✨ Features
- 💸 **Fund Pooling**: Members deposit STX tokens into a shared pool.
- 🗳 **Democratic Voting**: Members vote on investment proposals with weighted votes based on contributions.
- 📊 **Transparent Tracking**: All transactions and decisions are recorded immutably on the blockchain.
- 💰 **Automated Payouts**: Profits or returns are distributed proportionally to members' shares.
- 🔒 **Secure Membership**: Only approved members can join and participate.
- 🚫 **Fraud Prevention**: Smart contracts ensure funds are only used for approved investments.

## 🛠 How It Works
**For Club Organizers**
- Deploy the `ClubFactory` contract to create a new investment club.
- Set parameters like membership limits, voting thresholds, and investment duration.
- Invite members using the `MembershipManager` contract.

**For Members**
- Join a club via `MembershipManager` by depositing the required STX stake.
- Propose investments using the `ProposalManager` contract, including details like amount and target.
- Vote on proposals in `ProposalManager` with vote weight based on your contribution.
- Withdraw your share of profits via `PayoutDistributor` after successful investments.

**For Investors/Verifiers**
- Check club details (funds, proposals, votes) using `ClubRegistry`.
- Verify investment outcomes and payouts through `InvestmentTracker`.

## 📜 Smart Contracts
This project uses 7 Clarity smart contracts to manage the investment club lifecycle:

1. **ClubFactory**: Creates new investment clubs with customizable parameters (e.g., voting threshold, max members).
2. **ClubRegistry**: Stores metadata for all clubs (e.g., club ID, name, total funds).
3. **MembershipManager**: Handles member onboarding, stake deposits, and membership verification.
4. **ProposalManager**: Manages investment proposals and voting logic.
5. **FundPool**: Secures and tracks pooled funds from members.
6. **InvestmentTracker**: Records investment details and outcomes (e.g., profit/loss).
7. **PayoutDistributor**: Calculates and distributes profits or returns to members.

## 🚀 Getting Started
1. **Prerequisites**:
   - Install the Stacks CLI and a Clarity development environment.
   - Have a Stacks wallet with STX tokens for testing.
2. **Deploy Contracts**:
   - Deploy all contracts using the Stacks CLI in the order: `ClubFactory`, `ClubRegistry`, `MembershipManager`, `FundPool`, `ProposalManager`, `InvestmentTracker`, `PayoutDistributor`.
3. **Create a Club**:
   - Call `ClubFactory.create-club` with parameters like club name, voting threshold (e.g., 51%), and max members.
4. **Join and Invest**:
   - Members join via `MembershipManager.join-club` with an STX deposit.
   - Submit proposals in `ProposalManager.propose-investment`.
   - Vote using `ProposalManager.vote-on-proposal`.
5. **Track and Distribute**:
   - Monitor investments via `InvestmentTracker.get-investment-details`.
   - Distribute profits using `PayoutDistributor.distribute-payouts`.

## 🛠 Example Workflow
1. Alice creates a club called "Crypto Ventures" using `ClubFactory`.
2. Bob and Carol join by depositing 100 STX each via `MembershipManager`.
3. Bob proposes investing 150 STX in a DeFi project via `ProposalManager`.
4. Members vote; the proposal passes with 75% approval.
5. Funds are transferred from `FundPool` to the investment target.
6. After the investment matures, profits are recorded in `InvestmentTracker`.
7. `PayoutDistributor` splits profits proportionally (e.g., 50 STX each to Bob and Carol).

## 🔐 Security Features
- Only members can vote or propose investments.
- Funds are locked in `FundPool` until a proposal is approved.
- Voting weight is proportional to contributions, preventing manipulation.
- All actions are logged immutably for transparency.

## 🌟 Why This Matters
Collaborative investment clubs solve real-world problems by:
- **Democratizing Investing**: Small investors can pool funds to access opportunities previously limited to high-net-worth individuals.
- **Building Trust**: Blockchain ensures transparency and prevents mismanagement.
- **Reducing Costs**: Smart contracts eliminate intermediaries like fund managers.
- **Global Access**: Anyone with STX and internet access can participate.

## 📚 Next Steps
- Test the contracts on the Stacks testnet.
- Extend functionality (e.g., add time-based voting deadlines or multi-asset support).
- Build a front-end dApp for user-friendly interaction.

Happy investing! 🚀
