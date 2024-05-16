const checkForDuplicates = async ({
  Model,
  requestBody,
  fieldsToCheck,
  excludeId = null,
}) => {
  try {
    const duplicateQuery = {
      $or: fieldsToCheck
        .filter((field) => field in requestBody) // Only include fields that are in requestBody
        .map((field) => ({ [field]: requestBody[field] })),
    };

    if (excludeId) {
      delete excludeId;
      duplicateQuery._id = { $ne: excludeId };
    }

    if (duplicateQuery.$or.length === 0) {
      return { hasDuplicates: false, duplicateFields: [] };
    }

    const duplicateUsers = await Model.find(duplicateQuery);
    if (duplicateUsers.length === 0) {
      return { hasDuplicates: false, duplicateFields: [] };
    }

    const duplicateFields = fieldsToCheck.filter((field) => {
      return duplicateUsers.some((user) => user[field] === requestBody[field]);
    });

    return { hasDuplicates: true, duplicateFields };
  } catch (error) {
    throw new Error(`Error in checkForDuplicates: ${error.message}`);
  }
};

module.exports = checkForDuplicates;
