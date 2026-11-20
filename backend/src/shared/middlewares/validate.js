'use strict';

/**
 * Valida params/query/body com zod. O resultado fica em `req.valid`
 * (req.query é somente leitura no Express 5).
 */
const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (schemas[part])
      req.valid[part] = schemas[part].parse(part === 'body' ? (req.body ?? {}) : req[part]);
  }
  next();
};

module.exports = validate;
