import type {RouteConfig} from '@react-router/dev/routes';
import {flatRoutes} from '@react-router/fs-routes';

// 既存の app/routes/ のファイル名（products.$handle.tsx など）をそのままURLにする
export default flatRoutes() satisfies RouteConfig;
