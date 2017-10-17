
/* eslint comma-dangle: 0, object-shorthand: 0, prefer-arrow-callback: 0*/ /* ES5 code */

const Joi = require('joi');
const errors = require('feathers-errors');
const { checkContext, replaceItems, getItems } = require('feathers-hooks-common');
const joiErrorsForForms = require('joi-errors-for-forms');

function validator(joiSchema, joiOptions, translator, ifTest) {
  return function validatorInner(hook, next) {
    checkContext(hook, 'before', ['create', 'update', 'patch'], 'validate-joi');
    const values = getItems(hook);

    Joi.validate(values, joiSchema, joiOptions,
      function (joiErr, convertedValues) {
        const formErrors = translator(joiErr);
        if (formErrors) {
          // Hacky, but how else without a custom assert?
          const msg = ifTest ? JSON.stringify(formErrors) : 'Invalid data';
          throw new errors.BadRequest(msg, { errors: formErrors });
        }

        if (joiOptions.convert === true) {
          replaceItems(hook, convertedValues);
        }
        next(null, hook);
      }
    );
  };
}

module.exports = {
  form: function (joiSchema, joiOptions, translations, ifTest) {
    const translator = joiErrorsForForms.form(translations);
    return validator(joiSchema, joiOptions, translator, ifTest);
  },
  mongoose: function (joiSchema, joiOptions, translations, ifTest) {
    const translator = joiErrorsForForms.mongoose(translations);
    return validator(joiSchema, joiOptions, translator, ifTest);
  }
};
