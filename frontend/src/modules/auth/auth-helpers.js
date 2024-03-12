import { i18n } from '@/i18n';

export function passwordConfirmRules(rules, fields, model) {
  const passwordConfirmationValidator = (
    _rule,
    value,
    callback,
  ) => {
    if (value !== model[fields.password.name]) {
      callback(
        new Error(i18n('auth.passwordChange.mustMatch')),
      );
    } else {
      callback();
    }
  };

  return {
    ...rules,
    [fields.passwordConfirmation.name]: [
      ...rules[fields.passwordConfirmation.name],
      {
        validator: passwordConfirmationValidator,
        trigger: 'blur',
      },
    ],
  };
}
