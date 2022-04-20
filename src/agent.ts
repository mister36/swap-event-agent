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
import { abi as V3_FACTORY_ABI } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import { abi as IUniswapV2PairABI } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as V2_FACTORY_ABI } from "@uniswap/v2-core/build/IUniswapV2Factory.json";

import { SWAP_EVENT_1, SWAP_EVENT2, V3_FACTORY, V2_FACTORY } from "./constants";

// Check if swap went through a uniswap pool (verify)

const findingMaker = (
  pool: string,
  transactionAddress: string,
  token0: string,
  token1: string
) =>
  Finding.fromObject({
    name: "Swap",
    description: "A Uniswap swap occurred",
    alertId: "SWAP",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      transaction: transactionAddress,
      pool,
      token0,
      token1,
    },
  });

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const { hash } = txEvent.transaction;

  const swaps_1 = txEvent.filterLog(SWAP_EVENT_1);
  const swaps_2 = txEvent.filterLog(SWAP_EVENT2);

  // console.log(swaps_1);
  // console.log(swaps_2);

  if (swaps_1.length > 0 || swaps_2.length > 0) {
    let token0, token1, fee;

    const swapLogs = swaps_1.length === 0 ? swaps_2 : swaps_1;
    const addresses = swapLogs.map((log) => log.address);
    const swapVersion = swapLogs[0].args.sqrtPriceX96 ? 3 : 2; // version 2 "swap() has no sqrtPriceX96 arg"

    const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
    for (const address of addresses) {
      /* Checks whether potential pool address in transaction equals the return 
         of the factory "getPool/getPair" function with the token
         params coming from poolContrant.token()

         Ensures that swaps don't originate from Uniswap fork
        */

      if (swapVersion === 3) {
        const v3PoolContract = new ethers.Contract(
          address,
          IUniswapV3PoolABI,
          provider
        );

        [token0, token1, fee] = await Promise.all([
          v3PoolContract.token0(),
          v3PoolContract.token1(),
          v3PoolContract.fee(),
        ]);

        const v3FactoryContract = new ethers.Contract(
          V3_FACTORY,
          V3_FACTORY_ABI,
          provider
        );

        const pool = await v3FactoryContract.getPool(token0, token1, fee);

        if (pool.toLowerCase() === address) {
          findings.push(findingMaker(pool, hash, token0, token1));
        }
      } else {
        const v2PairContract = new ethers.Contract(
          address,
          IUniswapV2PairABI,
          provider
        );

        try {
          [token0, token1] = await Promise.all([
            v2PairContract.token0(),
            v2PairContract.token1(),
          ]);

          const v2FactoryContract = new ethers.Contract(
            V2_FACTORY,
            V2_FACTORY_ABI,
            provider
          );

          const pool = await v2FactoryContract.getPair(token0, token1);

          if (pool.toLowerCase() === address) {
            findings.push(findingMaker(pool, hash, token0, token1));
          }
        } catch (error) {
          // In case address isn't a pool contract
          continue;
        }
      }
    }
  }

  return findings;
};

export default {
  handleTransaction,
};
