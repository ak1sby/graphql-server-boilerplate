export default err =>
  err.inner.reduce(
    (errors, innerError) => [
      ...errors,
      { path: innerError.path, message: innerError.message }
    ],
    []
  );
