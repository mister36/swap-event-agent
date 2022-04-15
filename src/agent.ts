import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

const SWAP_EVENT_1 =
  "event Swap( address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to )";

const SWAP_EVENT2 =
  "event Swap( address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick )";

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
