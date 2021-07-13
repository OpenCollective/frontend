import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getEnvVar } from '../../../lib/env-utils';
import { exportHosts, exportMembers } from '../../../lib/export_file';

import Container from '../../Container';
import ExportImages from '../../ExportImages';
import { Box } from '../../Grid';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import { H4, P } from '../../Text';
import SettingsTitle from '../SettingsTitle';

import SettingsSectionTitle from './SettingsSectionTitle';

class Export extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  renderStyledLink(path) {
    const restURL = getEnvVar('REST_URL');
    const URL = `${restURL}${path}`;
    return (
      <StyledLink display="block" href={URL}>
        {URL}
      </StyledLink>
    );
  }

  renderCollectivesExport(collective, widgetCode) {
    return (
      <Fragment>
        <SettingsTitle mb={4}>
          <FormattedMessage id="editCollective.menu.export" defaultMessage="Export" />
        </SettingsTitle>
        <SettingsSectionTitle>
          <FormattedMessage id="export.widget.title" defaultMessage="Widget" />
        </SettingsSectionTitle>
        <Container as="pre" fontSize="11px" whiteSpace="pre-wrap" mb={4}>
          {widgetCode}
        </Container>
        <Box my={4}>
          <ExportImages collective={collective} />
        </Box>
        <SettingsSectionTitle mt={4}>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </SettingsSectionTitle>
        <P mb={2}>
          <FormattedMessage
            id="ExportContributors.Description"
            defaultMessage="Export your contributor data in {format} format"
            values={{ format: 'CSV' }}
          />
        </P>
        <StyledButton onClick={async () => await exportMembers(collective.slug)}>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </StyledButton>

        <SettingsSectionTitle mt={4}>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
        </SettingsSectionTitle>
        <p>
          <FormattedMessage
            id="ExportContributors.Description"
            defaultMessage="Export your contributor data in {format} format"
            values={{ format: 'JSON' }}
          />
        </p>
        <ul>
          <li>
            <FormattedMessage
              id="ExportContributors.All"
              defaultMessage="All contributors: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/all.json`) }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyIndividuals"
              defaultMessage="Only individuals: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/users.json`) }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyOrganizations"
              defaultMessage="Only organizations: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/organizations.json`) }}
            />
          </li>
        </ul>

        <H4 fontSize="14px" fontWeight="500">
          <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
        </H4>
        <Container as="table" fontSize="14px" mb={3} width="100%" css={{ borderSpacing: 16 }}>
          <tbody>
            <tr>
              <td>limit</td>
              <td>
                <FormattedMessage id="export.json.parameters.limit" defaultMessage="number of contributors to return" />
              </td>
            </tr>
            <tr>
              <td>offset</td>
              <td>
                <FormattedMessage
                  id="export.json.parameters.offset"
                  defaultMessage="number of contributors to skip (for paging)"
                />
              </td>
            </tr>
            <tr>
              <Container as="td" pr={2}>
                TierId
              </Container>
              <td>
                <FormattedMessage
                  id="export.json.parameters.TierId"
                  defaultMessage="only return contributors that belong to this Tier (select a tier on your Collective page and look at the URL to find its ID)."
                />
              </td>
            </tr>
          </tbody>
        </Container>
        {collective.tiers[0] && (
          <div>
            e.g.
            {this.renderStyledLink(
              `/${collective.slug}/members/all.json?limit=10&offset=0&TierId=${collective.tiers[0].id}`,
            )}
          </div>
        )}
        {!collective.tiers[0] && (
          <div>
            e.g.
            {this.renderStyledLink(`/${collective.slug}/members/all.json?limit=10&offset=0`)}
          </div>
        )}
      </Fragment>
    );
  }

  renderHostExports(collective) {
    return (
      <Fragment>
        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </h1>
        <P textAlign="center">
          <FormattedMessage
            id="ExportHostedCollectives.Description"
            defaultMessage="Export your hosted collectives data in {format} format"
            values={{ format: 'CSV' }}
          />
        </P>
        <div className="actions">
          <StyledButton onClick={async () => await exportHosts(collective.slug, 'csv')}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
          </StyledButton>
        </div>

        <hr />

        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
        </h1>
        <P textAlign="center">
          <FormattedMessage
            id="ExportHostedCollectives.Description"
            defaultMessage="Export your hosted collectives data in {format} format"
            values={{ format: 'JSON' }}
          />
        </P>
        <div className="actions">
          <StyledButton onClick={async () => await exportHosts(collective.slug, 'json')}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
          </StyledButton>
        </div>
      </Fragment>
    );
  }

  render() {
    const { collective } = this.props;
    const widgetCode = `<script src="https://opencollective.com/${collective.slug}/banner.js"></script>`;

    return (
      <div className="ExportData">
        <style global jsx>
          {`
            table tr td {
              vertical-align: top;
            }
            .param {
              font-weight: bold;
              padding-right: 0.5rem;
              font-family: 'Courrier';
            }
            .actions {
              text-align: center;
            }
            .code {
              font-size: 1.4rem;
              font-family: Courrier;
              padding: 0.1rem 0.3rem;
              background: #ddd;
              margin: 0.5rem;
              border: 1px solid #ccc;
            }
          `}
        </style>
        {collective.type === CollectiveType.COLLECTIVE
          ? this.renderCollectivesExport(collective, widgetCode)
          : this.renderHostExports(collective)}
      </div>
    );
  }
}

export default Export;
