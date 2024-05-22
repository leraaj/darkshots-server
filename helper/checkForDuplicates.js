const checkForDuplicates = async ({
  Model,
  requestBody,
  fieldsToCheck,
  excludeId = null,
}) => {
  const query = fieldsToCheck.reduce((acc, field) => {
    if (requestBody[field]) {
      acc[field] = requestBody[field];
    }
    return acc;
  }, {});

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingDocs = await Model.find(query);

  const hasDuplicates = existingDocs.length > 0;
  const duplicateFields = hasDuplicates
    ? fieldsToCheck.filter((field) =>
        existingDocs.some((doc) => doc[field] === requestBody[field])
      )
    : [];

  return { hasDuplicates, duplicateFields };
};
