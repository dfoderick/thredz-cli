// import type { JobAdditional, Answer } from "./types";
// import type { Job } from "bull";
// import { run } from "node-jq";
import chalk from "chalk";
// import ms from "ms";
// import { getQueue } from "./queue";
//import type Vorpal from "@moleculer/vorpal";

// export const LAST_SAVED_CONNECTION_NAME = "_last-active";

// export const getJob = async (jobId: string) => {
//   const queue = await getQueue();
//   const job = await queue.getJob(jobId);
//   if (!job) {
//     return throwYellow(`Job "${jobId}" not found`);
//   }
//   return job;
// };

// export const showJobs = async (arr: Array<Job>, query: string) => {
//   const jobs = arr as Array<Job & JobAdditional>;
//   const root = jobs
//     .filter(j => j)
//     .map(job => ({
//       id: job.id,
//       data: (job as JobAdditional).data,
//       timestamp: Number.isNaN(job.timestamp)
//         ? job.timestamp
//         : new Date(job.timestamp),
//       processedOn: job.processedOn && new Date(job.processedOn),
//       finishedOn: job.finishedOn && new Date(job.finishedOn),
//       name: job.name,
//       failedReason: job.failedReason,
//       stackTrace: job.stacktrace,
//       returnValue: (job as JobAdditional).returnvalue,
//       attemptsMade: job.attemptsMade,
//       delay: job.delay,
//       progress: job._progress
//     }));
//   const filteredData = query ? ((await run(query, {root}, {input: 'json', output: 'json'})) as unknown) : {root};
//   logArray((<{root?: unknown}>filteredData)?.root ?? filteredData);
// };

// export const getTimeAgoFilter = (timeAgo?: string) => {
//   return new Promise<string>(resolve => {
//     try {
//       const msAgo = timeAgo && timeAgo.length ? ms(timeAgo) : void 0;
//       const filter = msAgo ? `{root: [.root[] | select((.timestamp | strptime("%Y-%m-%dT%H:%M:%S.%3Z") | mktime | . * 1000) >= ${Date.now() - msAgo})]}` : '';
//       resolve(filter);
//     } catch (e) {
//       throwYellow(`Error: Argument to --timeAgo is invalid: ${e}`);
//     }
//   });
// };

// export const logArray = (arr: unknown) => {
//   console.dir(arr, {
//     colors: true,
//     depth: null,
//     maxArrayLength: Infinity,
//   });
//   Array.isArray(arr) && console.log(`count: ${chalk.yellow(arr.length)}`)
// };

// export const jqLink = "https://stedolan.github.io/jq/manual/#Basicfilters";
// export const msLink = "https://github.com/zeit/ms#examples";

// export const answer = async (vorpal: Vorpal, question: string, forceYes?: boolean) => {
//   if(forceYes){
//     logYellow(`Assuming yes for ${question}`);
//     return;
//   }
//   const answer = (await vorpal.activeCommand.prompt({
//     name: "a",
//     message: `${question}? (y/n): `
//   })) as Answer;
//   if (answer.a !== "y") {
//     throwYellow("You cancel action");
//   }
// };

export const logGreen = (msg: string, more?: any) => {
  console.log(chalk.green(msg,more));
};

export const logYellow = (msg: string) => {
  console.log(chalk.yellow(msg));
};

export const logRed = (msg: string) => {
  console.log(chalk.red(msg));
};

// export const logBlue = (msg: string) => {
//   console.log(chalk.blueBright(msg));
// };

export const throwYellow = (msg: string): never => {
  let err = new Error();
  ((err as unknown) as { yellow: boolean }).yellow = true;
  err.stack = chalk.yellow(msg);
  throw err;
};

// export async function splitJobsByFound(jobIds: string[]) {
//   const queue = await getQueue();
//   const jobs = await Promise.all(jobIds.map(id => queue.getJob(id)));
//   let notFoundIds = [] as string[];
//   let foundJobs = [] as Job[];
//   let i = 0;
//   for (const jobId of jobIds) {
//     const job = jobs[i];
//     if (job) {
//       foundJobs.push(job);
//     } else {
//       notFoundIds.push(jobId);
//     }
//     i++;
//   }
//   return { notFoundIds, foundJobs };
// }

export function wrapTryCatch(fn: Function) {
  return async function(this: unknown, args: unknown) {
    try {
      return await fn.call(this, args);
    } catch (e) {
      if ((e as {yellow: boolean}).yellow) {
        throw e;
      }
      return throwYellow((e as Error).message);
    }
  };
}

// export function getBootCommand() {
//   return process.argv.slice(2).join(' ');
// }

export function startup() {
  const version = parseInt(process.versions.node.split('.')[0],10)
  if (version <14) {
    logRed(`Your node version ${version} needs to be upgraded to version 16 or above!`)
  }
}

//TODO: make efficient
export function chunkBuffer(buf:Buffer, size:number): Buffer[] {
  const numChunks = Math.ceil(buf.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = buf.slice(o, o + size)
  }

  return chunks
}

//splits a string into chunks
//TODO: efficient???
export function chunkSubstr(str:string, size:number): string[] {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}

// returns script data as array of hex buffers that Script wants
export function asHexBuffers(arr:any[]): Buffer[] {
  return arr.map((a: any) => {
      if (a instanceof Buffer) return a //Buffer.from(a.toString('hex'))
      if (typeof a === 'number') {
          if (a < 16 ) return Buffer.from(a.toString(16).padStart(2,'0'))
          throw Error(`FIX ASHEX ${a}`)
      }
      if (a === null) throw new Error(`METANET script element cannot be NULL`)
      return Buffer.from(a.toString('hex'))
  })
}

// returns script data as array of hex buffers that Script wants
export function asHexStrings(arr:Buffer[]): string[] {
  return arr.map((a: Buffer) => {
      return a.toString('hex')
  })
}
