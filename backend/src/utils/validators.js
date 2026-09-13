export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next({
        statusCode: 400,
        message: "Dados invalidos.",
        details: result.error.flatten()
      });
    }
    if (source === "body") {
      req.body = result.data;
    } else {
      Object.assign(req[source], result.data);
    }

    return next();
  };
}
