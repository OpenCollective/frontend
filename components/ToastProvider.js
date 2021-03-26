import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';

export const ToastContext = React.createContext({
  /**
   * Params keys:
   * - {TOAST_TYPE} type (default: INFO)
   * - {string} title
   * - {string} message (optional)
   */
  addToast: () => {},
});

export const TOAST_TYPE = {
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  INFO: 'INFO',
};

const createToast = params => {
  return {
    ...params,
    id: uuid(),
    type: params.type || TOAST_TYPE.INFO,
    createdAt: Date.now(),
  };
};

/**
 * A global state to store toast notifications that are persisted across the app
 */
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const context = {
    toasts,
    addToast: useCallback(params => setToasts([...toasts, createToast(params)]), [toasts]),
    addToasts: useCallback(toastsParams => setToasts([...toasts, ...toastsParams.map(createToast)]), [toasts]),
    removeToasts: useCallback(
      filterFunc => {
        const newToasts = toasts.filter(toast => !filterFunc(toast));
        if (newToasts.length !== toasts.length) {
          setToasts(newToasts);
        }
      },
      [toasts],
    ),
  };

  return <ToastContext.Provider value={context}>{children}</ToastContext.Provider>;
};

ToastProvider.propTypes = {
  children: PropTypes.node,
};

/**
 * An helper to use the toasts provider with hooks
 */
export const useToasts = () => {
  return useContext(ToastContext);
};

export const withToasts = WrappedComponent => {
  const WithToasts = props => (
    <ToastContext.Consumer>{context => <WrappedComponent {...context} {...props} />}</ToastContext.Consumer>
  );

  WithToasts.getInitialProps = WrappedComponent.getInitialProps;
  return WithToasts;
};

export default ToastProvider;
