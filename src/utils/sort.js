export const sortProjects = (a, b) => {
  if (a.defaultFlag) {
    return -1;
  } else if (b.defaultFlag) {
    return 1;
  } else if (a.discrepancies === 0 && !a.defaultFlag) {
    return 1;
  } else if (b.discrepancies === 0 && !b.defaultFlag) {
    return -1;
  }

  if (a.discrepancies < b.discrepancies) {
    return -1;
  } else {
    return 1;
  }
};

export const sortDiscrepLog = (a, b) => {
  if (a.issueTypeName < b.issueTypeName) {
    return -1;
  } else if (a.issueTypeName > b.issueTypeName) {
    return 1;
  } else {
    return 0;
  }
};
