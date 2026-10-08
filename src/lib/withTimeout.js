// Resolves `promise`, but rejects with `Error(message)` if it takes longer
// than `ms` milliseconds. supabase-js requests have no built-in timeout, so
// this is what prevents UI spinners / loading screens from hanging forever.
export const withTimeout = (promise, ms, message) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};