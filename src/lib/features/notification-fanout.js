/** Split recipients into batches so a popular author's post cannot flood the queue. */
export function batchFanout(recipients, perBatch = 500) {
  if (!Number.isInteger(perBatch) || perBatch < 1) throw new Error("perBatch must be a positive integer");
  const batches = [];
  for (let i = 0; i < recipients.length; i += perBatch) batches.push(recipients.slice(i, i + perBatch));
  return batches;
}
