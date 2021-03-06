import * as R from 'ramda';
import 'url-search-params-polyfill';
import { rejectWithCode, foldMaybe, noop } from 'xod-func-tools';

import {
  getApiBillingUrl,
  getWhoamiUrl,
  getLoginUrl,
  getLogoutUrl,
} from '../utils/urls';
import { addError } from '../messages/actions';
import * as ActionTypes from './actionTypes';
import * as Messages from './messages';
import * as ERR_CODES from './errorCodes';
import { getAccessToken } from './selectors';

const setGrant = grant => ({
  type: ActionTypes.SET_AUTH_GRANT,
  payload: grant,
});

const refreshGrant = () => dispatch =>
  fetch(getWhoamiUrl(), { credentials: 'include' })
    .then(res => (res.ok ? res.json() : null))
    .then(grant => {
      dispatch(setGrant(grant));

      return grant;
    })
    .catch(() =>
      rejectWithCode(
        ERR_CODES.CANT_FETCH_GRANT,
        new Error(Messages.SERVICE_UNAVAILABLE)
      )
    );

/**
 * Function that sends some request using Authorization token
 * and tries to refresh the token on error 403.
 * If it still fails it returns rejected Promise with an error.
 *
 * It accepts one argument of Function type with the signature:
 * (Headers -> Promise FetchResult FetchError)
 *
 * Where `Headers` is an object, which will be modified with
 * `Authorization` header.
 */
export const requestAuthorized = (requestAction, headers) => (
  dispatch,
  getState
) => {
  const headersWithAuthorization = R.compose(
    foldMaybe(headers, accessToken => ({
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    })),
    getAccessToken
  )(getState());

  const run = () => requestAction(headersWithAuthorization);
  return run()
    .catch(() => Promise.reject(Messages.SERVICE_UNAVAILABLE))
    .then(res => {
      if (res.status === 401) {
        return dispatch(refreshGrant()).then(() => run());
      }
      return res;
    })
    .then(res => {
      if (res.status === 401)
        return Promise.reject(Messages.LOG_IN_TO_CONTINUE);
      if (res.status >= 500)
        return Promise.reject(Messages.SERVICE_UNAVAILABLE);
      if (!res.ok) {
        const err = new Error(res.statusText);
        err.status = res.status;
        return Promise.reject(err);
      }
      return res.json();
    });
};

const fetchBilling = headers => fetch(getApiBillingUrl(), { headers });

export const updateBalances = (startup = false) => dispatch => {
  const basicHeaders = startup ? { 'x-launch': 'true' } : {};
  return dispatch(requestAuthorized(fetchBilling, basicHeaders))
    .then(billing =>
      dispatch({
        type: ActionTypes.UPDATE_BALANCES,
        payload: billing.balances || {},
      })
    )
    .catch(noop); // Do not show any errors and just leave limits as is
};

/**
 * User has a cookie with only a session id.
 * To know his username and other data we need to fetch
 * a keycloak grant from server
 */
export const fetchGrant = (startup = false) => dispatch =>
  dispatch(refreshGrant()).then(R.tap(() => dispatch(updateBalances(startup))));

export const login = (username, password) => dispatch => {
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('password', password);

  dispatch({ type: ActionTypes.LOGIN_STARTED });

  fetch(getLoginUrl(), { method: 'POST', credentials: 'include', body: form })
    .then(res => {
      if (!res.ok) {
        const err = new Error(res.statusText);
        err.status = res.status;
        throw err;
      }

      return dispatch(fetchGrant());
    })
    .catch(err => {
      const errMessage =
        err.status === 403
          ? Messages.INCORRECT_CREDENTIALS
          : Messages.SERVICE_UNAVAILABLE;
      dispatch(addError(errMessage));

      dispatch({ type: ActionTypes.LOGIN_FAILED });
    });
};

export const logout = () => dispatch => {
  fetch(getLogoutUrl(), { credentials: 'include' })
    .then(() => {
      dispatch(setGrant(null));
      dispatch(updateBalances(false));
    })
    .catch(() => dispatch(addError(Messages.SERVICE_UNAVAILABLE)));
};

export default {};
