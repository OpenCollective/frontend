import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import colors from '../../../constants/colors';
import { get } from 'lodash';

import Expense from './Expense';

class Expenses extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    host: PropTypes.object,
    expenses: PropTypes.array,
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
    editable: PropTypes.bool,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    includeHostedCollectives: PropTypes.bool,
    filters: PropTypes.bool, // show or hide filters (all/pending/paid)
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.refetch = this.refetch.bind(this);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = { loading: false, isPayActionLocked: {} };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  refetch(status) {
    this.setState({ status, loading: true });
    if (status === 'READY') status = 'APPROVED';
    this.props.refetch({ status }).then(() => {
      this.setState({ loading: false });
    });
  }

  setPayActionLock(val) {
    this.setState({ isPayActionLocked: val });
  }

  render() {
    const { collective, host, expenses, LoggedInUser, editable, view, includeHostedCollectives, filters } = this.props;

    if (!expenses) {
      return <div />;
    }

    return (
      <div className="Expenses">
        <style jsx>
          {`
            .Expenses {
              min-width: 30rem;
              max-width: 80rem;
            }
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .filter {
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
            }
            :global(.filterBtnGroup) {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            :global(.filterBtn) {
              width: 25%;
            }
            .empty {
              text-align: center;
              margin: 4rem;
              color: ${colors.darkgray};
            }
            .itemsList {
              position: relative;
            }
            .itemsList .item {
              border-bottom: 1px solid #e8e9eb;
            }
            .loading {
              color: ${colors.darkgray};
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(255, 255, 255, 0.85);
              text-transform: uppercase;
              letter-spacing: 3px;
              font-weight: bold;
              z-index: 10;
              -webkit-backdrop-filter: blur(2px);
              backdrop-filter: blur(5px);
            }
          `}
        </style>

        {filters && (
          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button
                className="filterBtn all"
                bsSize="small"
                bsStyle={!this.state.status ? 'primary' : 'default'}
                onClick={() => this.refetch()}
              >
                <FormattedMessage id="expenses.all" defaultMessage="all" />
              </Button>
              <Button
                className="filterBtn pending"
                bsSize="small"
                bsStyle={this.state.status === 'PENDING' ? 'primary' : 'default'}
                onClick={() => this.refetch('PENDING')}
              >
                <FormattedMessage id="expenses.pending" defaultMessage="pending" />
              </Button>
              <Button
                className="filterBtn approved"
                bsSize="small"
                bsStyle={this.state.status === 'APPROVED' ? 'primary' : 'default'}
                onClick={() => this.refetch('APPROVED')}
              >
                <FormattedMessage id="expenses.approved" defaultMessage="approved" />
              </Button>
              <Button
                className="filterBtn ready"
                bsSize="small"
                bsStyle={this.state.status === 'READY' ? 'primary' : 'default'}
                onClick={() => this.refetch('READY')}
              >
                <FormattedMessage id="expenses.ready" defaultMessage="ready to pay" />
              </Button>
              <Button
                className="filterBtn paid"
                bsSize="small"
                bsStyle={this.state.status === 'PAID' ? 'primary' : 'default'}
                onClick={() => this.refetch('PAID')}
              >
                <FormattedMessage id="expenses.paid" defaultMessage="paid" />
              </Button>
            </ButtonGroup>
          </div>
        )}

        <div className="itemsList">
          {this.state.loading && (
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          )}
          {expenses.map(
            expense =>
              (this.state.status !== 'READY' ||
                get(expense.collective || collective, 'stats.balance') > expense.amount) && (
                <div className="item" key={expense.id}>
                  <Expense
                    collective={expense.collective || collective}
                    host={host}
                    expense={expense}
                    editable={editable}
                    view={view}
                    includeHostedCollectives={includeHostedCollectives}
                    LoggedInUser={LoggedInUser}
                    allowPayAction={!this.state.isPayActionLocked[(expense.collective || collective).id]}
                    lockPayAction={this.setPayActionLock.bind(this, { [(expense.collective || collective).id]: true })}
                    unlockPayAction={this.setPayActionLock.bind(this, {
                      [(expense.collective || collective).id]: false,
                    })}
                  />
                </div>
              ),
          )}
          {expenses.length === 0 && (
            <div className="empty">
              <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
            </div>
          )}
          {expenses.length >= 10 && expenses.length % 10 === 0 && (
            <div className="loadMoreBtn">
              <Button bsStyle="default" onClick={this.fetchMore}>
                {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Expenses;
