import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import { ethers } from "ethers";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as FACTORY_ABI } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";

import { SWAP_EVENT_1, SWAP_EVENT2, V3_FACTORY } from "./constants";

// Check if swap went through a uniswap pool (verify)

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const { hash } = txEvent.transaction;

  const swaps_1 = txEvent.filterLog(SWAP_EVENT_1);
  const swaps_2 = txEvent.filterLog(SWAP_EVENT2);

  if (swaps_1.length > 0 || swaps_2.length > 0) {
    for (const address of Object.keys(txEvent.addresses)) {
      const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
      const poolContract = new ethers.Contract(
        address,
        IUniswapV3PoolABI,
        provider
      );

      try {
        const [token0, token1, fee] = await Promise.all([
          poolContract.token0(),
          poolContract.token1(),
          poolContract.fee(),
        ]);

        const v3FactoryContract = new ethers.Contract(
          V3_FACTORY,
          FACTORY_ABI,
          provider
        );

        const pool = await v3FactoryContract.getPool(token0, token1, fee);

        /* Checks whether address in transaction equals the return 
         of the factory "getPool" function.

         Ensures that swaps don't originate from Uniswap fork
        */

        if (pool.toLowerCase() === address) {
          findings.push(
            Finding.fromObject({
              name: "Swap",
              description: "A Uniswap swap occurred",
              alertId: "SWAP",
              type: FindingType.Info,
              severity: FindingSeverity.Info,
              metadata: {
                transaction: hash,
                pool: address,
                token0,
                token1,
              },
            })
          );
        }
      } catch (error) {
        continue;
      }
    }
  }

  return findings;
};

export default {
  handleTransaction,
  // handleBlock
};
