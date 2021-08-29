import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import workbox from 'rollup-plugin-workbox-inject';

export default {
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    workbox({
      globDirectory: 'public',
      globPatterns: ['**/*.{css,html,ico,js,json,png,svg,ttf,xml}'],
    }),
    nodeResolve(),
  ],
};
