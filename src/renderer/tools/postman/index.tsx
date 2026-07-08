import { registerTool, ToolComponentProps } from '@renderer/components/providers/createTabProvider';

interface Props {}

// eslint-disable-next-line react-refresh/only-export-components, no-empty-pattern
function Main({}: ToolComponentProps<Props>) {
  return <div />;
}

export const httpTool = registerTool({
  name: 'http-client',
  component: Main,
  generateName: () => 'HTTP Client',
  label: ''
});
