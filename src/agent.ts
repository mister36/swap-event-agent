import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

const CONTRACTS = [
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  "0xe592427a0aece92de3edee1f18e0157c05861564",
];

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const { to, hash } = txEvent.transaction;

  if (CONTRACTS.includes(to || "")) {
    findings.push(
      Finding.fromObject({
        name: "Swap",
        description: "A Uniswap swap occurred",
        alertId: "SWAP",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          transaction: hash,
          swapRouter: to as any,
        },
      })
    );
  }

  return findings;
};

export default {
  handleTransaction,
  // handleBlock
};
