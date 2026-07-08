import { httpTool } from 'src/renderer/tools/postman';
import { createTabProvider } from './createTabProvider';
import { screenRecordTool } from '@screen-studio/index';

const tools = createTabProvider([httpTool, screenRecordTool]);

export const ToolTabProvider = tools.TabProvider;
export const useToolTabs = tools.useTabs;
export type ToolTabItem = ReturnType<typeof tools.useTabs>['tabs'][number];
