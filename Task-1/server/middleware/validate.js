const ApiError = require('../utils/ApiError');

// validate({ body, query, params }) — runs the given zod schemas against the
// request. Parsed (trimmed / coerced / defaulted) values replace req.body and
// are exposed as req.validQuery / req.validParams. Unknown keys are dropped,
// which also blocks operator injection such as { "email": { "$ne": null } }.
const validate = (schemas) => (req, res, next) => {
  const targets = { body: 'body', query: 'validQuery', params: 'validParams' };
  const errors = [];

  for (const [source, target] of Object.entries(targets)) {
    if (!schemas[source]) continue;
    const result = schemas[source].safeParse(req[source] ?? {});
    if (result.success) {
      req[target] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join('.') || source, message: issue.message });
      }
    }
  }

  if (errors.length) {
    const first = errors[0];
    const label = first.field && !['body', 'query', 'params'].includes(first.field) ? `${first.field}: ` : '';
    return next(new ApiError(400, `${label}${first.message}`, errors));
  }
  next();
};

module.exports = validate;
