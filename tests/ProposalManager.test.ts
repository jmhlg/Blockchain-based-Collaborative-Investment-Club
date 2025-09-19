import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV, principalCV, boolCV } from "@stacks/transactions";
const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PROPOSAL_AMOUNT = 101;
const ERR_INVALID_PROPOSAL_TARGET = 102;
const ERR_INVALID_PROPOSAL_DURATION = 103;
const ERR_PROPOSAL_ALREADY_EXISTS = 104;
const ERR_PROPOSAL_NOT_FOUND = 105;
const ERR_VOTING_CLOSED = 106;
const ERR_ALREADY_VOTED = 107;
const ERR_INSUFFICIENT_STAKE = 108;
const ERR_PROPOSAL_NOT_OPEN = 109;
const ERR_VOTING_THRESHOLD_NOT_MET = 110;
const ERR_INVALID_CLUB_ID = 111;
const ERR_INVALID_VOTE = 112;
const ERR_FUND_TRANSFER_FAILED = 113;
const ERR_INVALID_PROPOSAL_DESCRIPTION = 114;
const ERR_INVALID_RISK_LEVEL = 115;
const ERR_INVALID_EXPECTED_RETURN = 116;
const ERR_PROPOSAL_EXPIRED = 117;
const ERR_INVALID_TIMESTAMP = 118;
const ERR_CLUB_NOT_ACTIVE = 119;
const ERR_MAX_PROPOSALS_EXCEEDED = 120;
interface Proposal {
  proposer: string;
  amount: number;
  target: string;
  duration: number;
  votesFor: number;
  votesAgainst: number;
  status: string;
  startTime: number;
  description: string;
  riskLevel: number;
  expectedReturn: number;
}
interface Result<T> {
  ok: boolean;
  value: T;
}
class ProposalManagerMock {
  state: {
    nextProposalId: number;
    maxProposalsPerClub: number;
    votingPeriod: number;
    authorityContract: string | null;
    proposals: Map<string, Proposal>;
    votes: Map<string, boolean>;
    proposalCountByClub: Map<number, number>;
  } = {
    nextProposalId: 0,
    maxProposalsPerClub: 100,
    votingPeriod: 144,
    authorityContract: null,
    proposals: new Map(),
    votes: new Map(),
    proposalCountByClub: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  members: Map<string, boolean> = new Map();
  stakes: Map<string, number> = new Map();
  funds: Map<number, number> = new Map();
  clubsActive: Map<number, boolean> = new Map();
  transfers: Array<{ clubId: number; amount: number; target: string }> = [];
  constructor() {
    this.reset();
  }
  reset() {
    this.state = {
      nextProposalId: 0,
      maxProposalsPerClub: 100,
      votingPeriod: 144,
      authorityContract: null,
      proposals: new Map(),
      votes: new Map(),
      proposalCountByClub: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.members = new Map();
    this.stakes = new Map();
    this.funds = new Map();
    this.clubsActive = new Map();
    this.transfers = [];
  }
  private getProposalKey(clubId: number, proposalId: number): string {
    return `${clubId}-${proposalId}`;
  }
  private getVoteKey(clubId: number, proposalId: number, voter: string): string {
    return `${clubId}-${proposalId}-${voter}`;
  }
  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (this.state.authorityContract !== null) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }
  setMaxProposalsPerClub(newMax: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.maxProposalsPerClub = newMax;
    return { ok: true, value: true };
  }
  setVotingPeriod(newPeriod: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newPeriod <= 0) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.votingPeriod = newPeriod;
    return { ok: true, value: true };
  }
  proposeInvestment(
    clubId: number,
    amount: number,
    target: string,
    duration: number,
    description: string,
    riskLevel: number,
    expectedReturn: number
  ): Result<number> {
    if (clubId <= 0) return { ok: false, value: ERR_INVALID_CLUB_ID };
    if (!this.clubsActive.get(clubId)) return { ok: false, value: ERR_CLUB_NOT_ACTIVE };
    const currentCount = this.state.proposalCountByClub.get(clubId) || 0;
    if (currentCount >= this.state.maxProposalsPerClub) return { ok: false, value: ERR_MAX_PROPOSALS_EXCEEDED };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_PROPOSAL_AMOUNT };
    if (target === this.caller) return { ok: false, value: ERR_INVALID_PROPOSAL_TARGET };
    if (duration <= 0) return { ok: false, value: ERR_INVALID_PROPOSAL_DURATION };
    if (!description || description.length > 256) return { ok: false, value: ERR_INVALID_PROPOSAL_DESCRIPTION };
    if (riskLevel > 10) return { ok: false, value: ERR_INVALID_RISK_LEVEL };
    if (expectedReturn <= 0) return { ok: false, value: ERR_INVALID_EXPECTED_RETURN };
    if (!this.members.get(`${clubId}-${this.caller}`)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const funds = this.funds.get(clubId) || 0;
    if (funds < amount) return { ok: false, value: ERR_INSUFFICIENT_STAKE };
    const proposalId = this.state.nextProposalId;
    const key = this.getProposalKey(clubId, proposalId);
    this.state.proposals.set(key, {
      proposer: this.caller,
      amount,
      target,
      duration,
      votesFor: 0,
      votesAgainst: 0,
      status: "open",
      startTime: this.blockHeight,
      description,
      riskLevel,
      expectedReturn,
    });
    this.state.proposalCountByClub.set(clubId, currentCount + 1);
    this.state.nextProposalId++;
    return { ok: true, value: proposalId };
  }
  voteOnProposal(clubId: number, proposalId: number, vote: boolean): Result<boolean> {
    const proposalKey = this.getProposalKey(clubId, proposalId);
    const proposal = this.state.proposals.get(proposalKey);
    if (!proposal) return { ok: false, value: false };
    if (!this.clubsActive.get(clubId)) return { ok: false, value: ERR_CLUB_NOT_ACTIVE };
    if (!this.members.get(`${clubId}-${this.caller}`)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (proposal.status !== "open") return { ok: false, value: ERR_PROPOSAL_NOT_OPEN };
    if (this.blockHeight - proposal.startTime >= this.state.votingPeriod) return { ok: false, value: ERR_VOTING_CLOSED };
    const voteKey = this.getVoteKey(clubId, proposalId, this.caller);
    if (this.state.votes.has(voteKey)) return { ok: false, value: ERR_ALREADY_VOTED };
    const stake = this.stakes.get(`${clubId}-${this.caller}`) || 0;
    if (stake <= 0) return { ok: false, value: ERR_INSUFFICIENT_STAKE };
    this.state.votes.set(voteKey, vote);
    if (vote) {
      proposal.votesFor += stake;
    } else {
      proposal.votesAgainst += stake;
    }
    this.state.proposals.set(proposalKey, proposal);
    return { ok: true, value: true };
  }
  executeProposal(clubId: number, proposalId: number): Result<boolean> {
    const proposalKey = this.getProposalKey(clubId, proposalId);
    const proposal = this.state.proposals.get(proposalKey);
    if (!proposal) return { ok: false, value: false };
    if (!this.clubsActive.get(clubId)) return { ok: false, value: ERR_CLUB_NOT_ACTIVE };
    if (proposal.status !== "open") return { ok: false, value: ERR_PROPOSAL_NOT_OPEN };
    if (this.blockHeight - proposal.startTime < this.state.votingPeriod) return { ok: false, value: ERR_VOTING_CLOSED };
    if (proposal.votesFor < 50) return { ok: false, value: ERR_VOTING_THRESHOLD_NOT_MET };
    this.transfers.push({ clubId, amount: proposal.amount, target: proposal.target });
    proposal.status = "executed";
    this.state.proposals.set(proposalKey, proposal);
    return { ok: true, value: true };
  }
  closeProposal(clubId: number, proposalId: number): Result<boolean> {
    const proposalKey = this.getProposalKey(clubId, proposalId);
    const proposal = this.state.proposals.get(proposalKey);
    if (!proposal) return { ok: false, value: false };
    if (proposal.proposer !== this.caller) return { ok: false, value: false };
    if (proposal.status !== "open") return { ok: false, value: ERR_PROPOSAL_NOT_OPEN };
    proposal.status = "closed";
    this.state.proposals.set(proposalKey, proposal);
    return { ok: true, value: true };
  }
}
describe("ProposalManager", () => {
  let contract: ProposalManagerMock;
  beforeEach(() => {
    contract = new ProposalManagerMock();
    contract.reset();
    contract.clubsActive.set(1, true);
    contract.members.set("1-ST1TEST", true);
    contract.stakes.set("1-ST1TEST", 100);
    contract.funds.set(1, 1000);
  });
  it("creates a proposal successfully", () => {
    const result = contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const proposal = contract.state.proposals.get("1-0");
    expect(proposal?.amount).toBe(500);
    expect(proposal?.target).toBe("ST2TARGET");
    expect(proposal?.description).toBe("Invest in DeFi");
  });
  it("rejects invalid club id", () => {
    const result = contract.proposeInvestment(0, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CLUB_ID);
  });
  it("rejects proposal if max exceeded", () => {
    contract.state.maxProposalsPerClub = 0;
    const result = contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_PROPOSALS_EXCEEDED);
  });
  it("votes on proposal successfully", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    const result = contract.voteOnProposal(1, 0, true);
    expect(result.ok).toBe(true);
    const proposal = contract.state.proposals.get("1-0");
    expect(proposal?.votesFor).toBe(100);
  });
  it("rejects vote if already voted", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    contract.voteOnProposal(1, 0, true);
    const result = contract.voteOnProposal(1, 0, false);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_VOTED);
  });
  it("executes proposal successfully", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    contract.voteOnProposal(1, 0, true);
    contract.blockHeight = 144;
    const result = contract.executeProposal(1, 0);
    expect(result.ok).toBe(true);
    const proposal = contract.state.proposals.get("1-0");
    expect(proposal?.status).toBe("executed");
    expect(contract.transfers).toEqual([{ clubId: 1, amount: 500, target: "ST2TARGET" }]);
  });
  it("rejects execution if threshold not met", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    contract.blockHeight = 144;
    const result = contract.executeProposal(1, 0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VOTING_THRESHOLD_NOT_MET);
  });
  it("closes proposal successfully", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    const result = contract.closeProposal(1, 0);
    expect(result.ok).toBe(true);
    const proposal = contract.state.proposals.get("1-0");
    expect(proposal?.status).toBe("closed");
  });
  it("rejects close by non-proposer", () => {
    contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    contract.caller = "ST3FAKE";
    const result = contract.closeProposal(1, 0);
    expect(result.ok).toBe(false);
  });
  it("sets authority contract", () => {
    const result = contract.setAuthorityContract("ST2AUTH");
    expect(result.ok).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2AUTH");
  });
  it("sets max proposals", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setMaxProposalsPerClub(50);
    expect(result.ok).toBe(true);
    expect(contract.state.maxProposalsPerClub).toBe(50);
  });
  it("sets voting period", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setVotingPeriod(200);
    expect(result.ok).toBe(true);
    expect(contract.state.votingPeriod).toBe(200);
  });
  it("rejects invalid amount", () => {
    const result = contract.proposeInvestment(1, 0, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROPOSAL_AMOUNT);
  });
  it("rejects invalid target", () => {
    const result = contract.proposeInvestment(1, 500, "ST1TEST", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROPOSAL_TARGET);
  });
  it("rejects if not member", () => {
    contract.members.set("1-ST1TEST", false);
    const result = contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });
  it("rejects if insufficient funds", () => {
    contract.funds.set(1, 400);
    const result = contract.proposeInvestment(1, 500, "ST2TARGET", 30, "Invest in DeFi", 5, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INSUFFICIENT_STAKE);
  });
});