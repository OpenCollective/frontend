import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import AdminPanelSection from '../components/admin-panel/AdminPanelSection';
import AdminPanelMenu from '../components/admin-panel/menu/AdminPanelMenu';
import AuthenticatedPage from '../components/AuthenticatedPage';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import { Grid } from '../components/Grid';

const GRID_TEMPLATE_COLUMNS = ['1fr', '208px 1fr'];

const adminPanelQuery = gqlV2`
  query AdminPanel($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      isHost
      type
      features {
        ...NavbarFields
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

const AdminPanelPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { data, loading } = useQuery(adminPanelQuery, { context: API_V2_CONTEXT, variables: { slug } });
  const section = router.query.section || 'info';
  return (
    <AuthenticatedPage>
      <Grid gridTemplateColumns={GRID_TEMPLATE_COLUMNS} maxWidth={1024} gridGap={64} m="0 auto" px={2} py={3}>
        <AdminPanelMenu
          isLoading={loading}
          collective={data?.account}
          collectiveSlug={slug}
          selectedSection={section}
        />
        <AdminPanelSection section={section} isLoading={loading} collective={data?.account} />
      </Grid>
    </AuthenticatedPage>
  );
};

export default AdminPanelPage;
