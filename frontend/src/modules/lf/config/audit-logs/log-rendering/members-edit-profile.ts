import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

function camelCaseToName(camelCase) {
  return camelCase.replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

function flattenObject(obj) {
  const flattenedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      for (const nestedKey in obj[key]) {
        if (obj[key].hasOwnProperty(nestedKey)) {
          flattenedObj[`${key}${nestedKey.charAt(0).toUpperCase()}${nestedKey.slice(1)}`] = obj[key][nestedKey];
        }
      }
    }
  }
  return flattenedObj;
}

const membersEditProfile: LogRenderingConfig = {
  label: 'Contributor profile edited',
  changes: (log) => {
    const additions = [];
    const removals = [];
    const changes = [];

    const oldState = { ...log.oldState, ...flattenObject(log.oldState.attributes) };
    const newState = { ...log.newState, ...flattenObject(log.newState.attributes) };
    const diff = {
      ...log.diff,
      ...{ ...flattenObject(log.oldState.attributes), ...flattenObject(log.newState.attributes) },
    };
    delete oldState.attributes;
    delete newState.attributes;

    Object.keys(diff)
      .forEach((key) => {
        const keyName = camelCaseToName(key);
        if (!!oldState[key] && !newState[key]) {
          const display = typeof oldState[key] === 'object' ? JSON.stringify(oldState[key]) : `${oldState[key]}`;
          removals.push(`<span>${keyName}: </span> ${display}`);
        } else if (!oldState[key] && !!newState[key]) {
          const display = typeof newState[key] === 'object' ? JSON.stringify(newState[key]) : `${newState[key]}`;
          additions.push(`<span>${keyName}: </span>${display}`);
        } else if (oldState[key] !== newState[key]) {
          const displayOld = typeof oldState[key] === 'object' ? JSON.stringify(oldState[key]) : `${oldState[key]}`;
          const displayNew = typeof newState[key] === 'object' ? JSON.stringify(newState[key]) : `${newState[key]}`;
          changes.push(`<span>${keyName}: </span><s>${displayOld}</s> ${displayNew}`);
        }
      });

    return {
      additions,
      removals,
      changes,
    };
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Contributor',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditProfile;
