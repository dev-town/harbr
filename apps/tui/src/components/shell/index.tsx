import { ActiveRoute, BrowseRoute } from '../../routes'
import { useShell } from '../../hooks/useShell'
import { Layout } from '../layout'
import { Logo } from '../logo'
import { Tab, Tabs } from '../tabs'
import { FooterRow } from '../footer-row'

export function Shell() {
  const { currentRoute, onRouteSelect } = useShell()

  return (
    <Layout>
      <Layout.Header>
        <Logo />
      </Layout.Header>
      <Layout.Tabs>
        <Tabs value={currentRoute} onValueChange={onRouteSelect}>
          <Tab label="Active" value="active" />
          <Tab label="Browse" value="browse" />
        </Tabs>
      </Layout.Tabs>
      <Layout.Content>
        {currentRoute === 'active' ? <ActiveRoute /> : <BrowseRoute />}
      </Layout.Content>
      <Layout.Footer>
        <FooterRow />
      </Layout.Footer>
    </Layout>
  )
}
