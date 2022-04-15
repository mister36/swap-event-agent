import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import { SWAP_EVENT_1, SWAP_EVENT2 } from "./constants";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const { hash } = txEvent.transaction;

  const swaps_1 = txEvent.filterLog(SWAP_EVENT_1);
  const swaps_2 = txEvent.filterLog(SWAP_EVENT2);

  if (swaps_1.length > 0 || swaps_2.length > 0) {
    findings.push(
      Finding.fromObject({
        name: "Swap",
        description: "A Uniswap swap occurred",
        alertId: "SWAP",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          transaction: hash,
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
