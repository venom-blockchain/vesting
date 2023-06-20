import { Address } from "locklift";
import fs from "fs";

function saveArrayAsJson(array: any[], filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(array, null, 2), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function readArrayFromJson(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        try {
          const array = JSON.parse(data);
          resolve(array);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

async function saveContracts(codeHash: string, filePath: string) {
  const vestingAddresses = await readArrayFromJson(filePath);
  const newVestingAddresses: Address[] = vestingAddresses.length
    ? vestingAddresses.map(a => new Address(a))
    : [];
  while (true) {
    const accs = await locklift.provider.getAccountsByCodeHash({
      codeHash: codeHash,
      continuation: newVestingAddresses.length ? newVestingAddresses[newVestingAddresses.length - 1].toString() : undefined,
    });
    newVestingAddresses.push(...accs.accounts);
    if (!accs.continuation) {
      break;
    }
  }
  await saveArrayAsJson(newVestingAddresses, filePath);
}

async function main() {
  // fixme: provide correct code hashes
  const vestingCodeHash = "41809cfc798db31fdb3c783cea5ed6d7572afacc123cb097a4c0451abf3c0587";
  const nativeVestingCodeHash = "22e248448928f437a5e5db853cb767479830a9e25498d3e7526d840ef5641541";

  await saveContracts(nativeVestingCodeHash, "./script/reindex/data/nativeVestingAccs.json");
  await saveContracts(vestingCodeHash, "./script/reindex/data/vestingAccs.json");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
