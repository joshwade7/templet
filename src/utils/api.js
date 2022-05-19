import api, { route } from "@forge/api";



export const fetchAllProjects = async () => {
  let totalProjects = 51;
  let startAtIndex = 0;
  let data = { values: [] };
  let allBlocksOfData = [];

  // TODO: Find a good increment value, 50 is "base".
  while (startAtIndex + 50 < totalProjects) {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/project/search?startAt=${startAtIndex}`
      );

      //console.log(res);

    const tempData = await res.json();

    // TODO: Uncomment this whenever you want to retrieve all 1000+ projects.
    totalProjects = tempData.total;
    verifyDataReturnStatus(tempData);

    allBlocksOfData.push(tempData.values);
    startAtIndex += 50;

    // if (startAtIndex % 200 === 0) {
    //   setTimeout(function() {}, 30000);
    // }
  }

  allBlocksOfData.forEach((block) => {
    block.forEach((projectMapping) => {
      data.values.push(projectMapping);
    });
  });

  return data;
};

export const fetchWorkflowSchemesByProject = async (projectId) => {
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/workflowscheme/project?projectId=${projectId}`
    );

  const data = await res.json();
  verifyDataReturnStatus(data);
  return data;
};

export const fetchIssueTypeById = async (issueTypeId) => {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/2/issuetype/${issueTypeId}`);

  const data = await res.json();
  verifyDataReturnStatus(data);
  return data;
};

export const fetchAllIssueTypeItems = async () => {
  let totalIssueTypes = 51;
  let startAtIndex = 0;
  let data = { values: [] };
  let allBlocksOfData = [];

  while (startAtIndex + 50 < totalIssueTypes) {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/2/issuetypescheme/mapping?startAt=${startAtIndex}`
      );

    //console.log(res);

    const tempData = await res.json();
    totalIssueTypes = tempData.total;
    verifyDataReturnStatus(tempData);

    allBlocksOfData.push(tempData.values);
    startAtIndex += 50;

    // if (startAtIndex % 200 === 0) {
    //   setTimeout(function() {}, 30000);
    // }
  }

  allBlocksOfData.forEach((block) => {
    block.forEach((issueTypeMapping) => {
      data.values.push(issueTypeMapping);
    });
  });

  return data;
};

export const fetchIssueTypeSchemeByProjectId = async (projectId) => {
  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/2/issuetypescheme/project?projectId=${projectId}`
    );

  const data = await res.json();
  verifyDataReturnStatus(data);
  return data;
};

const verifyDataReturnStatus = (data) => {
  if (data.status && data.status !== "200") {
    console.log(JSON.stringify(data));
    throw new Error(
      `An error has occured: \n\tError: ${data.error}\n\tMessage: ${data.message}`
    );
  }
};

export const getProjectsByCategory = async(categoryID) => {
  const res = await api
  .asUser()
  .requestJira(
    route`/rest/api/3/project/search?categoryId=${categoryID}`
  );

  const data = await res.json();
  verifyDataReturnStatus(data);
  return data;
}

export const getTempProjectCategory = async (projectId) => {
  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/project/search?id=${projectId}`
    );

  const data = await res.json();
  verifyDataReturnStatus(data);
  return data;
};
