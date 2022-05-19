import { sortProjects, sortDiscrepLog } from "./sort.js";
import * as apiUtils from "./api.js";

export const getProjects = async () => {
  const projectDataExpanded = (
    await apiUtils.fetchAllProjects()
  ).values;

  console.log(JSON.stringify(projectDataExpanded.values));

  let projectsToSelect = [];
  projectDataExpanded.forEach((project) => {
    projectsToSelect.push({
      projectName: project.name,
      projectId: project.id,
    });
  });

  return projectsToSelect;
};

export const getData = async (defaultCategoryID) => {
  // Get all projects in JIRA.
  console.log('start');
  
  let projectDataExpanded = await apiUtils.getProjectsByCategory(defaultCategoryID);
  //let projectDataExpanded = await apiUtils.fetchAllProjects();
  projectDataExpanded = projectDataExpanded.values;
  const allIssueTypeSchemesWithItems = (await apiUtils.fetchAllIssueTypeItems())
    .values;

  // Get all project IDs with associated names into a list.
  let relevantProjectData = [];
  projectDataExpanded.forEach((project) => {
    relevantProjectData.push({
      projectName: project.name,
      projectId: project.id,
      projectWorkflowScheme: null,
      workflowAndIssueType: [],
      defaultFlag: false,
      discrepancies: 0,
      discrepancyLog: [],
    });
  });

  console.log('done');

  await Promise.all(
    // TODO: Consider adding a delay after each project loop.
    relevantProjectData.map(async (project) => {
      // Get all the workflow schemes in a given project.
      let workflowSchemesInProjectExpanded =
        await apiUtils.fetchWorkflowSchemesByProject(project.projectId);

      // Get all of the issue type schemes in a project.
      let issueTypeSchemeIds = [];
      let issueTypeSchemeForProject = (
        await apiUtils.fetchIssueTypeSchemeByProjectId(project.projectId)
      ).values;

      // Parse out the details from "all issue type schemes" and only get what is relevant for this project.
      if (issueTypeSchemeForProject) {
        issueTypeSchemeForProject.forEach((issueTypeScheme) => {
          issueTypeSchemeIds.push(issueTypeScheme.issueTypeScheme.id);
        });
      }

      let issueTypesInProject = [];
      if (allIssueTypeSchemesWithItems) {
        allIssueTypeSchemesWithItems.forEach((issueTypeItem) => {
          if (issueTypeSchemeIds.includes(issueTypeItem.issueTypeSchemeId)) {
            issueTypesInProject.push(issueTypeItem.issueTypeId);
          }
        });
      }

      // Update the current project's workflow scheme name, and set the default workflow.
      let defaultWorkflow = "";
      let issueTypeMappings = {};
      await Promise.all(
        workflowSchemesInProjectExpanded.values.map(async (workflow) => {
          project.projectWorkflowScheme = workflow.workflowScheme.name;
          defaultWorkflow = workflow.workflowScheme.defaultWorkflow;
          issueTypeMappings = workflow.workflowScheme.issueTypeMappings;
        })
      );

      // Go through all of our issue types and figure out what workflow they are in.
      let issueTypesWithAssociatedWorkflow = [];
      await Promise.all(
        issueTypesInProject.map(async (issueType) => {
          let issueTypeDetailsExpanded = await apiUtils.fetchIssueTypeById(
            issueType
          );

          if (issueTypeMappings[issueType]) {
            issueTypesWithAssociatedWorkflow.push({
              workflowName: issueTypeMappings[issueType],
              issueTypeName: issueTypeDetailsExpanded.name,
            });
          } else {
            issueTypesWithAssociatedWorkflow.push({
              workflowName: defaultWorkflow,
              issueTypeName: issueTypeDetailsExpanded.name,
            });
          }
        })
      );

      // Compile each of the issue type workflow combinations with the project.
      issueTypesWithAssociatedWorkflow.forEach(
        (issueTypeWithAssociatedWorkflow) => {
          project.workflowAndIssueType.push(issueTypeWithAssociatedWorkflow);
        }
      );
    })
  );

  console.log('actually done');
  return relevantProjectData;
};

export const organizeProjectData = (projectData, defaultProjectId) => {
  projectData = projectData[0];

  let defaultProject = projectData.filter((project) => {
    return project.projectId === defaultProjectId;
  })[0];

  defaultProject.defaultFlag = true;

  projectData.forEach((project) => {
    project.workflowAndIssueType.forEach((workflowAndIssue) => {
      let matchingDefaultWorkflowAndIssue =
        defaultProject.workflowAndIssueType.filter(
          (singleWorkflowIssuePair) => {
            return (
              singleWorkflowIssuePair.issueTypeName ===
              workflowAndIssue.issueTypeName
            );
          }
        )[0];

      if (
        !matchingDefaultWorkflowAndIssue ||
        !(
          matchingDefaultWorkflowAndIssue.workflowName ===
          workflowAndIssue.workflowName
        )
      ) {
        project.discrepancies++;
        project.discrepancyLog.push({
          workflowName: workflowAndIssue.workflowName,
          issueTypeName: workflowAndIssue.issueTypeName,
        });
      }
    });

    project.discrepancyLog.sort((a, b) => sortDiscrepLog(a, b));
  });

  let removalArray = [];
  for (let project of projectData) {
    let matchingProject = projectData.filter((matchingProject) => {
      return (
        objectsEqual(project.discrepancyLog, matchingProject.discrepancyLog) &&
        project.projectWorkflowScheme === matchingProject.projectWorkflowScheme
      );
    })[0];

    if (
      matchingProject &&
      matchingProject.projectName &&
      !project.projectName.includes(matchingProject.projectName) &&
      project.projectWorkflowScheme.trim() ===
        matchingProject.projectWorkflowScheme.trim()
    ) {
      removalArray.push(matchingProject);
      project.projectName = `${project.projectName}, ${matchingProject.projectName}`;
      project.projectWorkflowScheme = `${project.projectWorkflowScheme}`;
    }
  }

  removalArray.forEach((removeObj) => {
    let index = projectData.indexOf(removeObj);
    projectData.splice(index, 1);
  });

  projectData.sort((a, b) => sortProjects(a, b));
};

const objectsEqual = (o1, o2) =>
  typeof o1 === "object" && Object.keys(o1).length > 0
    ? Object.keys(o1).length === Object.keys(o2).length &&
      Object.keys(o1).every((p) => objectsEqual(o1[p], o2[p]))
    : o1 === o2;
