import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getPaypal } from '../lib/paypal';
import { getEnvVar } from '../lib/utils';

/**
 * Encapsulate Paypal button logic so we don't have to deal with refs in parent
 * components.
 */
export default class PayWithPaypalButton extends Component {
  static propTypes = {
    /** Total amount to pay in cents */
    totalAmount: PropTypes.number.isRequired,
    /** The currency used for this order */
    currency: PropTypes.string.isRequired,
    /** Called when user authorize the payment with a payment method generated from PayPal data */
    onAuthorize: PropTypes.func.isRequired,
    /** Called when user cancel paypal flow */
    onCancel: PropTypes.func,
    /** Called when an error is thrown during paypal flow */
    onError: PropTypes.func,
    /** Called when the button is clicked */
    onClick: PropTypes.func,
    /** Styles to apply to the button. See https://developer.paypal.com/docs/checkout/how-to/customize-button/#button-styles */
    style: PropTypes.shape({
      color: PropTypes.oneOf(['gold', 'blue', 'silver', 'white', 'black']),
      shape: PropTypes.oneOf(['pill', 'rect']),
      size: PropTypes.oneOf(['small', 'medium', 'large', 'responsive']),
      height: PropTypes.number,
      label: PropTypes.oneOf(['checkout', 'credit', 'pay', 'buynow', 'paypal', 'installment']),
      tagline: PropTypes.bool,
      layout: PropTypes.oneOf(['horizontal', 'vertical']),
      funding: PropTypes.shape({ allowed: PropTypes.array, disallowed: PropTypes.array }),
      fundingicons: PropTypes.bool,
    }),
  };

  static defaultStyle = {
    color: 'blue',
    tagline: false,
    label: 'pay',
  };

  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.paypal = null;
  }

  async componentDidMount() {
    this.paypal = await getPaypal();
    this.paypal.Button.render(this.getOptions(), this.container.current);
  }

  componentWillUnmount() {
    this.container.current.remove();
  }

  getOptions() {
    return {
      env: getEnvVar('PAYPAL_ENVIRONMENT'),
      commit: true,
      style: { ...PayWithPaypalButton.defaultStyle, ...this.props.style },
      payment: async (data, actions) => {
        if (this.props.onClick) {
          this.props.onClick();
        }
        const paymentURL = '/api/services/paypal/create-payment';
        const { id } = await actions.request.post(paymentURL, {
          amount: this.props.totalAmount / 100,
          currency: this.props.currency,
        });
        return id;
      },
      onAuthorize: data => {
        this.props.onAuthorize({
          data: data,
          token: data.paymentToken,
          service: 'paypal',
          type: 'payment',
        });
      },
      onCancel: () => {
        if (this.props.onCancel) {
          this.props.onCancel();
        }
      },
      onError: err => {
        if (this.props.onError) {
          this.props.onError(err);
        }
      },
    };
  }

  render() {
    return <div className="paypal-container" ref={this.container} />;
  }
}
