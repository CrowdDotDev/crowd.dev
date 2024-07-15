import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

function camelCaseToName(camelCase) {
  return camelCase.replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

function flattenObject(obj) {
  if (!obj) {
    return {};
  }
  const flattenedObj = {};
  Object.keys(obj).forEach((key) => {
    Object.keys(obj[key]).forEach((nestedKey) => {
      const capitalizedNestedKey = nestedKey.charAt(0).toUpperCase() + nestedKey.slice(1);
      flattenedObj[`${key}${capitalizedNestedKey}`] = obj[key][nestedKey];
    });
  });
  return flattenedObj;
}

const membersEditProfile: LogRenderingConfig = {
  label: 'Profile updated',
  changes: (log) => {
    const additions: any[] = [];
    const removals: any[] = [];
    const changes: any[] = [];

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
        if (!!oldState[key] && !newState[key] && newState[key] !== undefined) {
          const display = typeof oldState[key] === 'object' ? JSON.stringify(oldState[key]) : `${oldState[key]}`;
          removals.push(`<span>${keyName}: </span> ${display}`);
        } else if (!oldState[key] && !!newState[key]) {
          const display = typeof newState[key] === 'object' ? JSON.stringify(newState[key]) : `${newState[key]}`;
          additions.push(`<span>${keyName}: </span>${display}`);
        } else if (oldState[key] !== newState[key] && newState[key] !== undefined) {
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
    label: 'Profile',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditProfile;
