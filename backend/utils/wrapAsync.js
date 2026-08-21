/**
 * @desc Higher-order function to wrap async Express controllers and pass errors to next()
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default wrapAsync;
