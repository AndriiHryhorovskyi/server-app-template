'use strict';

/* eslint-disable no-useless-escape */
/* eslint-disable func-names */

module.exports = () => {
  const urlRegExp =
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

  const phoneNumberRegExp = /^[0-9]{12}$/;

  const emailRegExp =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return {
    urlRegExp,
    phoneNumberRegExp,
    emailRegExp,
  };
};
