import fs from "fs";
import readline from "readline";

// Function to merge two files line by line with additional formatting
async function mergeFiles(file1, file2, outputFile, numLines) {
  const fileStream1 = fs.createReadStream(file1);
  const fileStream2 = fs.createReadStream(file2);

  const rl1 = readline.createInterface({
    input: fileStream1,
    crlfDelay: Infinity,
  });

  const rl2 = readline.createInterface({
    input: fileStream2,
    crlfDelay: Infinity,
  });

  const outputStream = fs.createWriteStream(outputFile);

  const iterator1 = rl1[Symbol.asyncIterator]();
  const iterator2 = rl2[Symbol.asyncIterator]();

  const zeros = "   0   0   0   0   0   0   0   0 255 255 255 255 255 ";

  for (let i = 0; i < numLines; i++) {
    const line1 = (await iterator1.next()).value || "";
    const line2 = (await iterator2.next()).value || "";
    outputStream.write(`${line1}${zeros}${line2}\n`);
  }

  outputStream.end();

  rl1.close();
  rl2.close();

  console.log(
    `Merged ${numLines} lines from ${file1} and ${file2} into ${outputFile}`
  );
}

// Merge the files
mergeFiles("pattern-01.patt", "pattern-02.patt", "output.patt", 196);
